# NEO·ZEN 数字禅境

> 一个实时渲染的 4K 冥想视觉程序 —— 让屏幕成为一扇通往平静的窗。

四个由 GPU 数学实时生成的风景场景，加上可选的 4K 实拍视频播放，
配合内置的 4-7-8 呼吸引导光环，用于视觉放松与冥想。
视觉基调参考 Skrillex 直播时屏幕里的合成波（Synthwave）/ 赛博美学：
霓虹网格、条纹落日、极光、深空星云 —— 未来感，但节奏被刻意放慢到冥想级。

---

## 设计哲学：科技禅（Techno-Zen）

**1. 光即空间（Light as Space）**
没有 UI、没有按钮、没有文字。整块屏幕只有光与色的流动，
霓虹是这个空间唯一的建筑材料。

**2. 实时生成，永不重复（Generative & Infinite）**
风景不是播放的视频，而是每一帧由 GPU 着色器即时计算出来的数学。
它分辨率无关：在 4K 屏上就是原生 4K，在 8K 屏上就是原生 8K，
且每一秒的画面在宇宙中只出现一次。

**3. 呼吸即交互（Breath as Interface）**
程序唯一的"交互设计"是一个随 4-7-8 呼吸法（吸气 4 秒 → 屏息 7 秒 → 呼气 8 秒）
缓缓胀缩的光环。你不操作程序，你跟随它呼吸。

**4. 平静的技术（Calm Technology）**
所有运动速度都低于 0.5 倍日常动画速度；加入胶片噪点消除色带、
暗角把视线收向中心 —— 高沉浸，低刺激，适合长时间注视。

---

## 场景列表

| # | 场景 | 描述 |
|---|---|---|
| 1 | **SOLAR GRID · 合成波日落** | 条纹落日 + 无限透视霓虹网格，Skrillex 直播同款美学 |
| 2 | **AURORA · 极光之夜** | 三层极光帷幕在雪山剪影上方缓慢流动 |
| 3 | **OCEAN DAWN · 黎明海面** | 波光粼粼的日出海面，反射光路随波闪烁 |
| 4 | **NEBULA DRIFT · 深空星云** | 域扭曲星云缓慢漂移，中心一盏脉动的"心灯" |
| + | **VIDEO · 你的 4K 素材** | `videos/` 目录里的免费 4K 实拍风景（见下文） |

## 快捷键

| 键 | 功能 |
|---|---|
| `空格` / `→` | 下一个场景 |
| `←` | 上一个场景 |
| `B` | 呼吸引导光环 开/关 |
| `A` | 自动轮播 开/关（默认开，每 120 秒换景） |
| `F` / `F11` | 全屏 / 窗口切换 |
| `ESC` / `Q` | 退出 |

## 运行

```bash
# Python 3.10+
pip install -r requirements.txt
python main.py            # 默认全屏（屏幕是 4K 就渲染 4K）
python main.py --window   # 窗口模式
```

## 使用免费 4K 实拍风景（可选）

程序化场景零素材、开箱即用；如果你还想要**真实风景**，从这些免费素材站下载
4K（2160p）视频丢进 `videos/` 文件夹即可，启动时自动成为额外场景：

- **Pexels Videos** — https://www.pexels.com/videos/ （搜 `4K nature`、`ocean aerial`、`aurora`）
- **Pixabay** — https://pixabay.com/videos/ （搜 `4K landscape`、`clouds timelapse`）
- **Mixkit** — https://mixkit.co/free-stock-video/nature/
- **Coverr** — https://coverr.co/
- **NASA 影像库** — https://images.nasa.gov/ （搜 `earth 4K`、`ISS timelapse`）

以上素材均为免费授权（多为 CC0 或平台自有免费许可），可放心个人使用。
挑选建议：慢镜头、无剪辑跳切、无人物的长镜头最适合冥想。
视频播放需要 `opencv-python`（已在 requirements.txt 中）。

## 打包成 Windows exe

### 一键打包

在 Windows 上装好 Python 3.10+ 后，双击运行仓库里的 **`build_exe.bat`**，
完成后 exe 在 `dist\NeoZen.exe`。

### 手动打包（等价命令）

```bat
pip install -r requirements.txt pyinstaller
pyinstaller --noconfirm --onefile --windowed --name NeoZen --hidden-import glcontext main.py
```

参数说明：

| 参数 | 作用 |
|---|---|
| `--onefile` | 打成单个 exe（首次启动稍慢；改用 `--onedir` 启动更快但输出为文件夹） |
| `--windowed` | 不弹出黑色控制台窗口 |
| `--hidden-import glcontext` | moderngl 的 OpenGL 后端，确保被打进包里 |
| `--icon=neozen.ico` | （可选）自定义 exe 图标 |

打包注意事项：

1. **视频文件不要打进 exe** —— 把 `videos\` 文件夹放在 `NeoZen.exe` 旁边即可，
   程序会自动在 exe 同级目录寻找它。这样换素材也不用重新打包。
2. `opencv-python` 会让 exe 增大约 60 MB；如果只用程序化场景，
   打包前 `pip uninstall opencv-python` 可显著瘦身。
3. 杀毒软件偶尔会误报 PyInstaller 的 onefile 产物，属常见误报；
   介意的话改用 `--onedir` 模式。
4. 需要分发给别人时，对方电脑无需安装 Python，双击 exe 即可运行
   （要求显卡驱动支持 OpenGL 3.3，2012 年后的电脑基本都满足）。

## 技术栈

- **pygame** —— 窗口 / 输入 / 垂直同步
- **moderngl (OpenGL 3.3)** —— GLSL 片元着色器实时渲染，全部风景皆为程序化生成
- **opencv-python**（可选）—— 4K 视频解码，上传 GPU 纹理并做电影感调色

渲染负载完全在 GPU 上，全程 60 FPS 垂直同步，CPU 占用极低。
