# Serene · 静观

> 全屏播放 4K 风景视频的冥想放松程序 —— 让屏幕成为一扇安静的窗。

基于 Electron（HTML / CSS / JavaScript，无 Python），
全屏无边框播放真实风景视频，视频之间自动缓慢淡入淡出，
内置菜单可自由选择、添加、管理视频源，另附可选的 4-7-8 呼吸引导光环。

## 功能

- **纯风景**：只播放视频，不支持也不显示任何静态图片
- **视频源菜单**（按 `M` 或移动鼠标点右上角 ☰）：
  - 自动扫描程序旁的 `videos/` 文件夹
  - "选择本地视频文件…"——系统对话框任选硬盘上的视频
  - 粘贴网络视频直链（https://…/xxx.mp4），自动记住，下次启动还在
  - 点击列表任意一条立即切换；手动添加的源可单独移除
- **无缝轮播**：双层视频交叉淡入淡出（1.8 秒），一段播完自动接下一段，可切单片循环
- **冥想辅助**：按 `B` 显示 4-7-8 呼吸引导光环（吸气 4 秒 → 屏息 7 秒 → 呼气 8 秒）
- **零干扰**：鼠标静止 3 秒后光标与按钮自动隐藏，无任何常驻 UI

## 快捷键

| 键 | 功能 | 键 | 功能 |
|---|---|---|---|
| `M` | 视频源菜单 | `空格` | 暂停 / 播放 |
| `→` `←` | 下一个 / 上一个 | `L` | 单片循环开关 |
| `S` | 声音开关（默认静音） | `B` | 呼吸引导开关 |
| `F` | 全屏切换 | `Q` | 退出 |

## 运行（开发模式）

```bash
# 需要 Node.js 18+
npm install
npm start
```

放几个 4K 视频到 `videos/` 文件夹（获取免费素材见 [videos/README.md](videos/README.md)），
或启动后在菜单里添加。

## 打包成 Windows exe

```bash
npm install
npm run dist
```

完成后在 `dist/` 目录得到两种产物，任选其一：

| 产物 | 说明 |
|---|---|
| `Serene 1.0.0.exe`（portable） | **绿色单文件版**：无需安装，拷到任何电脑双击即用 |
| `Serene Setup 1.0.0.exe`（nsis） | 安装向导版：生成开始菜单与桌面快捷方式 |

打包说明：

1. **视频不打进 exe** —— 把 `videos/` 文件夹放在 exe 同级目录，程序自动读取，
   换素材不用重新打包；菜单手动添加的本地文件与网络链接也会自动记住。
2. 自定义图标：项目根目录放 `build/icon.ico`（256×256），electron-builder 会自动使用。
3. 在 Windows 上执行 `npm run dist` 直接出 exe；macOS / Linux 上交叉打包 Windows 版
   需要 wine，建议直接在 Windows 机器上打包。
4. 对方电脑**无需安装 Node.js**，双击 exe 即可运行。

## 免费 4K 风景素材

- **Pexels Videos** — https://www.pexels.com/videos/ （搜 `4K nature`、`ocean aerial`）
- **Pixabay** — https://pixabay.com/videos/ （搜 `4K landscape`、`clouds timelapse`）
- **Mixkit** — https://mixkit.co/free-stock-video/nature/
- **Coverr** — https://coverr.co/
- **NASA 影像库** — https://images.nasa.gov/

均为免费授权，下载 2160p 版本效果最佳。程序内菜单也内置了这些站点的入口。

## 技术

Electron + 原生 `<video>` 双层交叉淡化播放，硬件解码 4K 无压力；
渲染进程零依赖、零框架，整个界面就是三个文件：`renderer/index.html`、`style.css`、`app.js`。
