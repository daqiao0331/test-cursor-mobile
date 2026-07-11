# -*- coding: utf-8 -*-
"""
NEO·ZEN 数字禅境 —— 实时 4K 冥想视觉程序

- 四个程序化生成的风景场景（合成波日落 / 极光 / 黎明海面 / 深空星云），
  由 GPU 着色器实时渲染，分辨率无关，在 4K 屏幕上即原生 4K。
- 可选：将网上下载的免费 4K 风景视频放入 videos/ 目录，自动成为额外场景。
- 内置 4-7-8 呼吸引导光环，辅助冥想。

快捷键：
    空格 / →     下一个场景          ←        上一个场景
    B            呼吸引导开关        A        自动轮播开关（默认开，120 秒）
    F / F11      全屏切换            ESC / Q  退出
"""

import math
import os
import sys
import time

import numpy as np
import pygame
import moderngl

from shaders import VERTEX, build_fragment, PROCEDURAL_SCENES, VIDEO_SCENE_BODY

try:
    import cv2
    HAS_CV2 = True
except ImportError:
    HAS_CV2 = False

AUTO_CYCLE_SECONDS = 120.0   # 自动轮播间隔
FADE_SECONDS = 1.2           # 场景切换淡入淡出时长

# 4-7-8 呼吸法：吸气 4 秒，屏息 7 秒，呼气 8 秒
BREATH_PHASES = [("inhale", 4.0), ("hold", 7.0), ("exhale", 8.0)]
BREATH_TOTAL = sum(d for _, d in BREATH_PHASES)

VIDEO_EXTS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}


def app_dir() -> str:
    """程序所在目录（兼容 PyInstaller 打包后的 exe）。"""
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def find_videos() -> list:
    folder = os.path.join(app_dir(), "videos")
    if not os.path.isdir(folder):
        return []
    paths = sorted(
        os.path.join(folder, f)
        for f in os.listdir(folder)
        if os.path.splitext(f)[1].lower() in VIDEO_EXTS
    )
    return paths


def ease(x: float) -> float:
    """smoothstep 缓动，让呼吸节奏更自然。"""
    x = max(0.0, min(1.0, x))
    return x * x * (3.0 - 2.0 * x)


def breath_value(t: float) -> float:
    """返回当前呼吸引导值 0..1（环半径系数）。"""
    p = t % BREATH_TOTAL
    for name, dur in BREATH_PHASES:
        if p < dur:
            k = p / dur
            if name == "inhale":
                return ease(k)
            if name == "hold":
                return 1.0 - 0.03 * math.sin(k * math.pi * 2.0) ** 2
            return 1.0 - ease(k)   # exhale
        p -= dur
    return 0.0


class VideoPlayer:
    """用 OpenCV 解码视频帧并上传为 GPU 纹理，循环播放。"""

    def __init__(self, ctx: moderngl.Context, path: str):
        self.path = path
        self.cap = cv2.VideoCapture(path)
        if not self.cap.isOpened():
            raise RuntimeError(f"无法打开视频: {path}")
        self.fps = self.cap.get(cv2.CAP_PROP_FPS) or 30.0
        if self.fps <= 1.0:
            self.fps = 30.0
        w = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.size = (w, h)
        self.texture = ctx.texture((w, h), 3)
        self.texture.filter = (moderngl.LINEAR, moderngl.LINEAR)
        self._next_frame_at = 0.0
        self._read_frame()

    def _read_frame(self):
        ok, frame = self.cap.read()
        if not ok:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = self.cap.read()
            if not ok:
                return
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        self.texture.write(np.ascontiguousarray(frame).tobytes())

    def update(self, now: float):
        if now >= self._next_frame_at:
            self._read_frame()
            self._next_frame_at = now + 1.0 / self.fps

    def release(self):
        self.cap.release()
        self.texture.release()


class NeoZen:
    def __init__(self, windowed: bool = False):
        pygame.init()
        pygame.display.set_caption("NEO·ZEN 数字禅境")
        pygame.display.gl_set_attribute(pygame.GL_CONTEXT_MAJOR_VERSION, 3)
        pygame.display.gl_set_attribute(pygame.GL_CONTEXT_MINOR_VERSION, 3)
        pygame.display.gl_set_attribute(
            pygame.GL_CONTEXT_PROFILE_MASK, pygame.GL_CONTEXT_PROFILE_CORE
        )
        pygame.mouse.set_visible(False)

        self.windowed = windowed
        self._open_window()

        self.ctx = moderngl.create_context()
        quad = np.array([-1, -1, 1, -1, -1, 1, 1, 1], dtype="f4")
        self.vbo = self.ctx.buffer(quad.tobytes())

        # 编译程序化场景
        self.programs = []      # [(名称, program, vao, video_player 或 None)]
        for name, body in PROCEDURAL_SCENES:
            prog = self.ctx.program(
                vertex_shader=VERTEX, fragment_shader=build_fragment(body)
            )
            vao = self.ctx.vertex_array(prog, [(self.vbo, "2f", "in_pos")])
            self.programs.append((name, prog, vao, None))

        # 加载 videos/ 目录中的 4K 视频作为额外场景
        video_paths = find_videos()
        if video_paths and not HAS_CV2:
            print("检测到 videos/ 目录，但未安装 opencv-python，跳过视频场景。")
        elif video_paths:
            vprog = self.ctx.program(
                vertex_shader=VERTEX,
                fragment_shader=build_fragment(VIDEO_SCENE_BODY),
            )
            for path in video_paths:
                try:
                    player = VideoPlayer(self.ctx, path)
                except Exception as exc:
                    print(f"跳过视频 {path}: {exc}")
                    continue
                vao = self.ctx.vertex_array(vprog, [(self.vbo, "2f", "in_pos")])
                name = "VIDEO · " + os.path.basename(path)
                self.programs.append((name, vprog, vao, player))

        self.scene_index = 0
        self.pending_index = None      # 淡出完成后要切换到的场景
        self.fade = 1.0                # 当前亮度 0..1
        self.fading_out = False
        self.breath_on = False
        self.breath_t0 = 0.0
        self.auto_cycle = True
        self.last_switch = time.perf_counter()
        self.clock = pygame.time.Clock()

    # ------------------------------------------------------------ 窗口
    def _open_window(self):
        if self.windowed:
            flags = pygame.OPENGL | pygame.DOUBLEBUF | pygame.RESIZABLE
            self.screen = pygame.display.set_mode((1600, 900), flags, vsync=1)
        else:
            flags = pygame.OPENGL | pygame.DOUBLEBUF | pygame.FULLSCREEN
            self.screen = pygame.display.set_mode((0, 0), flags, vsync=1)

    def _toggle_fullscreen(self):
        self.windowed = not self.windowed
        self._open_window()

    # ------------------------------------------------------------ 场景切换
    def switch_scene(self, step: int):
        if self.pending_index is not None:
            return
        self.pending_index = (self.scene_index + step) % len(self.programs)
        self.fading_out = True
        self.last_switch = time.perf_counter()

    # ------------------------------------------------------------ 主循环
    def run(self):
        t0 = time.perf_counter()
        running = True
        while running:
            now = time.perf_counter()
            dt = self.clock.tick(60) / 1000.0

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    key = event.key
                    if key in (pygame.K_ESCAPE, pygame.K_q):
                        running = False
                    elif key in (pygame.K_SPACE, pygame.K_RIGHT):
                        self.switch_scene(1)
                    elif key == pygame.K_LEFT:
                        self.switch_scene(-1)
                    elif key == pygame.K_b:
                        self.breath_on = not self.breath_on
                        self.breath_t0 = now
                    elif key == pygame.K_a:
                        self.auto_cycle = not self.auto_cycle
                    elif key in (pygame.K_f, pygame.K_F11):
                        self._toggle_fullscreen()

            # 自动轮播
            if (
                self.auto_cycle
                and self.pending_index is None
                and now - self.last_switch > AUTO_CYCLE_SECONDS
            ):
                self.switch_scene(1)

            # 淡入淡出状态机
            fade_speed = dt / FADE_SECONDS
            if self.fading_out:
                self.fade -= fade_speed
                if self.fade <= 0.0:
                    self.fade = 0.0
                    self.scene_index = self.pending_index
                    self.pending_index = None
                    self.fading_out = False
            elif self.fade < 1.0:
                self.fade = min(1.0, self.fade + fade_speed)

            name, prog, vao, player = self.programs[self.scene_index]

            w, h = pygame.display.get_window_size()
            self.ctx.viewport = (0, 0, w, h)

            t = now - t0
            prog["u_time"].value = t
            prog["u_resolution"].value = (float(w), float(h))
            prog["u_fade"].value = self.fade
            prog["u_breath_on"].value = 1.0 if self.breath_on else 0.0
            prog["u_breath"].value = (
                breath_value(now - self.breath_t0) if self.breath_on else 0.0
            )

            if player is not None:
                player.update(now)
                player.texture.use(0)
                prog["u_tex"].value = 0
                prog["u_texsize"].value = (float(player.size[0]), float(player.size[1]))

            self.ctx.clear(0.0, 0.0, 0.0)
            vao.render(moderngl.TRIANGLE_STRIP)
            pygame.display.flip()

        for _, _, _, player in self.programs:
            if player is not None:
                player.release()
        pygame.quit()


def main():
    windowed = "--window" in sys.argv or "-w" in sys.argv
    NeoZen(windowed=windowed).run()


if __name__ == "__main__":
    main()
