/* Serene · 静观 —— 渲染进程主逻辑
 * 播放项两类：
 *   scene — scenes.js 里的算法动画（着色器风景 / 元胞自动机），时长无限
 *   video — videos/ 文件夹、手动选择的本地文件、粘贴的网络直链
 */

"use strict";

const $ = (id) => document.getElementById(id);

const videoLayers = [$("v0"), $("v1")];
const glCanvas = $("glCanvas");
const caCanvas = $("caCanvas");
let activeVideo = 0;

let folderItems = [];
let customItems = [];
let playlist = [];        // [{type:'scene', scene} | {type:'video', name, url, source}]
let index = -1;

let muted = true;
let stay = false;         // 停留循环：不自动切换
let consecutiveErrors = 0;

let engine = null;               // 当前算法动画引擎
const engineCache = new Map();   // 场景 id -> 引擎实例（切回时延续演化状态）
let dwellTimer = null;    // 算法动画停留计时
let switchToken = 0;      // 防止快速切换时的竞态

const SCENE_DWELL_MS = 180 * 1000;   // 算法动画停留 3 分钟后自动下一个
const STORE_KEY = "serene.customSources";

const hasBridge = typeof window.serene !== "undefined";

/* ---------------- 工具 ---------------- */

let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
}

function saveCustom() {
  const persistable = customItems.filter((it) => !it.url.startsWith("blob:"));
  localStorage.setItem(STORE_KEY, JSON.stringify(persistable));
}

function loadCustom() {
  try {
    customItems = JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    customItems = [];
  }
}

/* ---------------- 播放列表 ---------------- */

function rebuildPlaylist() {
  const playingUrl =
    index >= 0 && playlist[index] && playlist[index].type === "video"
      ? playlist[index].url
      : null;
  const playingScene =
    index >= 0 && playlist[index] && playlist[index].type === "scene"
      ? playlist[index].scene.id
      : null;

  playlist = [
    ...SCENES.map((scene) => ({ type: "scene", scene })),
    ...folderItems.map((v) => ({ type: "video", ...v })),
    ...customItems.map((v) => ({ type: "video", ...v })),
  ];

  if (playingScene) {
    index = playlist.findIndex((it) => it.type === "scene" && it.scene.id === playingScene);
  } else if (playingUrl) {
    index = playlist.findIndex((it) => it.type === "video" && it.url === playingUrl);
  }
  renderMenu();
}

/* ---------------- 播放核心 ---------------- */

function stopEngine() {
  clearTimeout(dwellTimer);
  if (engine) {
    engine.stop();
    engine = null;
  }
}

function hideVideos() {
  videoLayers.forEach((v) => v.classList.remove("visible"));
  setTimeout(() => {
    videoLayers.forEach((v) => {
      if (!v.classList.contains("visible")) {
        v.pause();
        v.removeAttribute("src");
        v.load();
      }
    });
  }, 1700);
}

function playIndex(i) {
  if (!playlist.length) return;
  i = ((i % playlist.length) + playlist.length) % playlist.length;
  const item = playlist[i];
  index = i;
  const token = ++switchToken;

  if (item.type === "scene") {
    playScene(item.scene, token);
  } else {
    playVideo(item, token);
  }
  renderMenu();
}

function playScene(sceneDef, token) {
  const targetCanvas = sceneDef.canvas === "gl" ? glCanvas : caCanvas;
  const otherCanvas = sceneDef.canvas === "gl" ? caCanvas : glCanvas;

  hideVideos();
  otherCanvas.classList.remove("visible");

  const begin = () => {
    if (token !== switchToken) return;
    stopEngine();
    try {
      if (!engineCache.has(sceneDef.id)) engineCache.set(sceneDef.id, sceneDef.make());
      engine = engineCache.get(sceneDef.id);
      engine.setPaused(false);
      engine.start(targetCanvas);
    } catch (err) {
      console.warn("scene failed:", sceneDef.id, err);
      toast("此设备不支持该动画");
      return;
    }
    targetCanvas.classList.add("visible");
    scheduleDwell();
  };

  // 同一画布上换场景时先淡出，避免生硬跳变
  if (targetCanvas.classList.contains("visible")) {
    targetCanvas.classList.remove("visible");
    setTimeout(begin, 900);
  } else {
    begin();
  }
}

function scheduleDwell() {
  clearTimeout(dwellTimer);
  if (stay || playlist.length < 2) return;
  dwellTimer = setTimeout(() => playIndex(index + 1), SCENE_DWELL_MS);
}

function playVideo(item, token) {
  stopEngine();
  glCanvas.classList.remove("visible");
  caCanvas.classList.remove("visible");

  const cur = videoLayers[activeVideo];
  const next = videoLayers[1 - activeVideo];
  next.src = item.url;
  next.muted = muted;
  next.loop = false;

  next
    .play()
    .then(() => {
      if (token !== switchToken) return;
      consecutiveErrors = 0;
      next.classList.add("visible");
      cur.classList.remove("visible");
      activeVideo = 1 - activeVideo;
      setTimeout(() => {
        if (videoLayers[activeVideo] !== cur) {
          cur.pause();
          cur.removeAttribute("src");
          cur.load();
        }
      }, 1700);
    })
    .catch((err) => {
      if (token !== switchToken) return;
      console.warn("play failed:", item.name, err);
      consecutiveErrors++;
      toast("无法播放该视频，已跳过");
      if (consecutiveErrors < playlist.length) {
        setTimeout(() => playIndex(index + 1), 700);
      }
    });
}

videoLayers.forEach((v) =>
  v.addEventListener("ended", (e) => {
    if (e.target !== videoLayers[activeVideo]) return;
    if (stay) {
      e.target.currentTime = 0;
      e.target.play().catch(() => {});
    } else {
      playIndex(index + 1);
    }
  })
);

function togglePause() {
  const item = playlist[index];
  if (!item) return;
  if (item.type === "scene") {
    if (engine) {
      engine.setPaused(!engine.paused);
      toast(engine.paused ? "已暂停" : "继续");
    }
  } else {
    const v = videoLayers[activeVideo];
    if (!v.src) return;
    if (v.paused) {
      v.play().catch(() => {});
      toast("继续");
    } else {
      v.pause();
      toast("已暂停");
    }
  }
}

/* ---------------- 菜单 ---------------- */

function renderMenu() {
  const sceneUl = $("sceneList");
  const videoUl = $("videoList");
  sceneUl.innerHTML = "";
  videoUl.innerHTML = "";

  playlist.forEach((item, i) => {
    const li = document.createElement("li");
    if (i === index) li.classList.add("active");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = item.type === "scene" ? item.scene.name : item.name;
    li.appendChild(name);

    const en = document.createElement("span");
    en.className = "en";
    en.textContent =
      item.type === "scene"
        ? item.scene.en
        : { folder: "FOLDER", picked: "LOCAL", url: "URL" }[item.source] || "";
    li.appendChild(en);

    if (item.type === "video" && item.source !== "folder") {
      const del = document.createElement("button");
      del.className = "del";
      del.textContent = "✕";
      del.title = "移除";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        customItems = customItems.filter((it) => it.url !== item.url);
        saveCustom();
        rebuildPlaylist();
      });
      li.appendChild(del);
    }

    li.addEventListener("click", () => playIndex(i));
    (item.type === "scene" ? sceneUl : videoUl).appendChild(li);
  });

  if (!videoUl.children.length) {
    const li = document.createElement("li");
    li.style.cursor = "default";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = "（暂无视频，可选）";
    li.appendChild(name);
    videoUl.appendChild(li);
  }
}

function toggleMenu(force) {
  const menu = $("menu");
  const show = force !== undefined ? force : menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !show);
}

async function refreshFolder({ silent = false } = {}) {
  if (!hasBridge) {
    $("folderHint").textContent = "浏览器模式：不支持自动扫描文件夹。";
    return;
  }
  const { dir, items } = await window.serene.scanVideos();
  folderItems = items;
  $("folderHint").textContent = items.length
    ? `videos/ 文件夹：${items.length} 个视频`
    : `把视频放进 ${dir} 后点"刷新"`;
  rebuildPlaylist();
  if (!silent) toast(`videos/ 文件夹：${items.length} 个视频`);
}

async function addFiles() {
  if (hasBridge) {
    const picked = await window.serene.pickVideos();
    if (picked.length) mergeCustom(picked);
  } else {
    $("fileFallback").click();
  }
}

$("fileFallback").addEventListener("change", (e) => {
  const picked = [...e.target.files].map((f) => ({
    name: f.name.replace(/\.[^.]+$/, ""),
    url: URL.createObjectURL(f),
    source: "picked",
  }));
  mergeCustom(picked);
  e.target.value = "";
});

function mergeCustom(items) {
  let added = 0;
  for (const it of items) {
    if (!customItems.some((c) => c.url === it.url)) {
      customItems.push(it);
      added++;
    }
  }
  saveCustom();
  rebuildPlaylist();
  toast(`已添加 ${added} 个视频`);
}

function addUrl() {
  const input = $("urlInput");
  const url = input.value.trim();
  if (!url) return;
  if (!/^https?:\/\/.+/i.test(url)) {
    toast("请输入 http(s) 开头的视频直链");
    return;
  }
  let name;
  try {
    name = decodeURIComponent(new URL(url).pathname.split("/").pop()) || url;
  } catch {
    name = url;
  }
  name = name.replace(/\.[^.]+$/, "");
  mergeCustom([{ name, url, source: "url" }]);
  input.value = "";
}

/* ---------------- 呼吸引导 HUD（4-7-8） ---------------- */

const BREATH_PHASES = [
  { zh: "吸气", en: "INHALE", dur: 4, color: [127, 181, 168] },  // 青苔绿
  { zh: "屏息", en: "HOLD",   dur: 7, color: [231, 227, 216] },  // 象牙白
  { zh: "呼气", en: "EXHALE", dur: 8, color: [204, 120, 92] },   // 陶土色
];
const BREATH_TOTAL = BREATH_PHASES.reduce((s, p) => s + p.dur, 0);

let breathOn = false;
let breathStart = 0;
let breathRaf = 0;

const easeInOut = (x) => x * x * (3 - 2 * x);

function breathState(nowMs) {
  let t = ((nowMs - breathStart) / 1000) % BREATH_TOTAL;
  for (let pi = 0; pi < BREATH_PHASES.length; pi++) {
    const p = BREATH_PHASES[pi];
    if (t < p.dur) {
      const k = t / p.dur;
      let value; // 0..1 圆的胀缩
      if (pi === 0) value = easeInOut(k);
      else if (pi === 1) value = 1;
      else value = 1 - easeInOut(k);
      return { phase: p, pi, k, remain: p.dur - t, value };
    }
    t -= p.dur;
  }
  return { phase: BREATH_PHASES[0], pi: 0, k: 0, remain: 4, value: 0 };
}

function drawBreath(nowMs) {
  if (!breathOn) return;
  breathRaf = requestAnimationFrame(drawBreath);

  const canvas = $("breathCanvas");
  const dpr = devicePixelRatio;
  const w = canvas.clientWidth * dpr;
  const h = canvas.clientHeight * dpr;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, w, h);

  const { phase, k, remain, value } = breathState(nowMs);
  const [cr, cg, cb] = phase.color;
  const col = (a) => `rgba(${cr},${cg},${cb},${a})`;
  const ink = (a) => `rgba(231,227,216,${a})`;

  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.155;           // 基准半径
  const rInner = R * (0.42 + 0.58 * value);   // 呼吸圆半径

  // 背景压暗（聚焦中心）
  const bgGrad = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 3.2);
  bgGrad.addColorStop(0, "rgba(10,12,14,0.58)");
  bgGrad.addColorStop(1, "rgba(10,12,14,0)");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 外圈刻度环（60 格，走过的格点亮为相位色）
  const TICKS = 60;
  const tickR = R * 1.30;
  for (let i = 0; i < TICKS; i++) {
    const ang = -Math.PI / 2 + (i / TICKS) * Math.PI * 2;
    const passed = i / TICKS <= k;
    const r1 = tickR;
    const r2 = tickR + (passed ? R * 0.075 : R * 0.05);
    ctx.strokeStyle = passed ? col(0.92) : ink(0.30);
    ctx.lineWidth = (passed ? 1.6 : 1) * dpr;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ctx.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2);
    ctx.stroke();
  }

  // 呼吸圆：内部辉光 + 细描边
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, rInner);
  glow.addColorStop(0, col(0.10));
  glow.addColorStop(0.8, col(0.05));
  glow.addColorStop(1, col(0));
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = col(0.95);
  ctx.lineWidth = 1.4 * dpr;
  ctx.stroke();

  // 最大半径参考虚线圈
  ctx.setLineDash([2 * dpr, 5 * dpr]);
  ctx.strokeStyle = ink(0.14);
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // 中心：倒计时秒数 + 相位标签
  ctx.textAlign = "center";
  ctx.fillStyle = ink(0.95);
  ctx.font = `200 ${Math.round(R * 0.52)}px ui-monospace, "SF Mono", Consolas, monospace`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(String(Math.ceil(remain)), cx, cy + R * 0.10);

  ctx.fillStyle = col(0.95);
  ctx.font = `500 ${Math.round(R * 0.135)}px system-ui, sans-serif`;
  const label = `${phase.zh}　${phase.en}`;
  ctx.fillText(label.split("").join(" "), cx, cy + R * 0.34);

  // 底部节律标记 4 · 7 · 8
  ctx.fillStyle = ink(0.30);
  ctx.font = `400 ${Math.round(R * 0.10)}px ui-monospace, monospace`;
  ctx.fillText("4 · 7 · 8", cx, cy + tickR + R * 0.32);
}

function toggleBreath() {
  breathOn = !breathOn;
  $("breathCanvas").classList.toggle("hidden", !breathOn);
  cancelAnimationFrame(breathRaf);
  if (breathOn) {
    breathStart = performance.now();
    breathRaf = requestAnimationFrame(drawBreath);
  }
}

/* ---------------- 光标 / 界面唤醒 ---------------- */

let idleTimer = null;
function wakeUI() {
  document.body.classList.add("ui-awake");
  document.body.classList.remove("hide-cursor");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    document.body.classList.remove("ui-awake");
    if ($("menu").classList.contains("hidden")) {
      document.body.classList.add("hide-cursor");
    }
  }, 3000);
}
window.addEventListener("mousemove", wakeUI);

/* ---------------- 事件 ---------------- */

$("menuBtn").addEventListener("click", () => toggleMenu());
$("closeMenu").addEventListener("click", () => toggleMenu(false));
$("refreshBtn").addEventListener("click", () => refreshFolder());
$("addFilesBtn").addEventListener("click", addFiles);
$("addUrlBtn").addEventListener("click", addUrl);
$("urlInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addUrl();
  e.stopPropagation();
});

document.querySelectorAll("a[data-ext]").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    if (hasBridge) window.serene.openExternal(a.href);
    else window.open(a.href, "_blank");
  });
});

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ":
      e.preventDefault();
      togglePause();
      break;
    case "ArrowRight":
      playIndex(index + 1);
      break;
    case "ArrowLeft":
      playIndex(index - 1);
      break;
    case "m":
    case "M":
      toggleMenu();
      break;
    case "l":
    case "L":
      stay = !stay;
      toast(stay ? "停留：当前画面不再自动切换" : "轮播：自动切换已恢复");
      scheduleDwell();
      break;
    case "s":
    case "S":
      muted = !muted;
      videoLayers.forEach((v) => (v.muted = muted));
      toast(muted ? "声音：关" : "声音：开");
      break;
    case "b":
    case "B":
      toggleBreath();
      break;
    case "f":
    case "F":
      if (hasBridge) window.serene.toggleFullscreen();
      else if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
      break;
    case "Escape":
      toggleMenu(false);
      break;
    case "q":
    case "Q":
      if (hasBridge) window.serene.quit();
      break;
  }
});

/* ---------------- 启动 ---------------- */

(async function init() {
  loadCustom();
  await refreshFolder({ silent: true });
  rebuildPlaylist();
  playIndex(0);   // 算法动画永远可用，开箱即有画面
  wakeUI();
})();
