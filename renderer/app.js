/* Serene · 静观 —— 渲染进程逻辑
 * 视频源三类：
 *   folder — 程序旁 videos/ 文件夹自动扫描（Electron 环境）
 *   picked — 通过系统对话框 / 文件选择器手动添加的本地文件
 *   url    — 用户粘贴的网络视频直链（持久化到 localStorage）
 */

const $ = (id) => document.getElementById(id);

const layers = [$("v0"), $("v1")];
let active = 0;

let folderItems = [];   // videos/ 目录扫描结果
let customItems = [];   // 手动添加（picked + url）
let playlist = [];      // folderItems + customItems
let index = -1;

let muted = true;
let loopOne = false;
let breathOn = false;
let consecutiveErrors = 0;

const FADE_MS = 1800;
const STORE_KEY = "serene.customSources";

const hasBridge = typeof window.serene !== "undefined";

/* ---------------- 工具 ---------------- */

let toastTimer = null;
function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

let nowPlayingTimer = null;
function showNowPlaying(name) {
  const el = $("nowPlaying");
  el.textContent = name;
  el.classList.add("show");
  clearTimeout(nowPlayingTimer);
  nowPlayingTimer = setTimeout(() => el.classList.remove("show"), 5000);
}

function saveCustom() {
  // 浏览器 blob: 链接无法跨会话恢复，只持久化 url 与 Electron 的 file: 源
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

/* ---------------- 播放核心 ---------------- */

function rebuildPlaylist() {
  const playingUrl = index >= 0 && playlist[index] ? playlist[index].url : null;
  playlist = [...folderItems, ...customItems];
  index = playingUrl ? playlist.findIndex((it) => it.url === playingUrl) : index;
  $("empty").classList.toggle("hidden", playlist.length > 0);
  renderPlaylist();
}

function playIndex(i) {
  if (!playlist.length) return;
  i = ((i % playlist.length) + playlist.length) % playlist.length;
  const item = playlist[i];
  index = i;

  const cur = layers[active];
  const next = layers[1 - active];
  next.src = item.url;
  next.muted = muted;
  next.loop = false;

  next
    .play()
    .then(() => {
      consecutiveErrors = 0;
      next.classList.add("visible");
      cur.classList.remove("visible");
      active = 1 - active;
      setTimeout(() => {
        if (layers[active] !== cur) {
          cur.pause();
          cur.removeAttribute("src");
          cur.load();
        }
      }, FADE_MS + 100);
      showNowPlaying(item.name);
      renderPlaylist();
    })
    .catch((err) => {
      console.warn("play failed:", item.name, err);
      consecutiveErrors++;
      toast(`无法播放：${item.name}`);
      if (consecutiveErrors < playlist.length) {
        setTimeout(() => playIndex(index + 1), 800);
      }
    });
}

function onEnded(e) {
  if (e.target !== layers[active]) return;
  if (loopOne) {
    e.target.currentTime = 0;
    e.target.play().catch(() => {});
  } else {
    playIndex(index + 1);
  }
}
layers.forEach((v) => v.addEventListener("ended", onEnded));

function togglePause() {
  const v = layers[active];
  if (!v.src) return;
  if (v.paused) {
    v.play().catch(() => {});
    toast("播放");
  } else {
    v.pause();
    toast("暂停");
  }
}

/* ---------------- 菜单 ---------------- */

function renderPlaylist() {
  const ul = $("playlist");
  ul.innerHTML = "";
  const tagText = { folder: "文件夹", picked: "本地", url: "网络" };
  playlist.forEach((item, i) => {
    const li = document.createElement("li");
    if (i === index) li.classList.add("active");

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = item.name;
    name.title = item.name;
    li.appendChild(name);

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = tagText[item.source] || "视频";
    li.appendChild(tag);

    if (item.source !== "folder") {
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
    ul.appendChild(li);
  });
}

function toggleMenu(force) {
  const menu = $("menu");
  const show = force !== undefined ? force : menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !show);
}

async function refreshFolder({ silent = false } = {}) {
  if (!hasBridge) {
    $("folderHint").textContent = "浏览器模式：不支持自动扫描文件夹，请用下方按钮添加视频。";
    return;
  }
  const { dir, items } = await window.serene.scanVideos();
  folderItems = items;
  $("folderHint").textContent = items.length
    ? `videos/ 文件夹：${items.length} 个视频（${dir}）`
    : `把 4K 视频放进 ${dir} 后点"刷新"`;
  rebuildPlaylist();
  if (!silent) toast(`已扫描到 ${items.length} 个文件夹视频`);
}

async function addFiles() {
  if (hasBridge) {
    const picked = await window.serene.pickVideos();
    if (!picked.length) return;
    mergeCustom(picked);
  } else {
    $("fileFallback").click(); // 浏览器测试环境的降级方案
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
  if (index < 0 && playlist.length) playIndex(0);
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

/* ---------------- 呼吸引导（4-7-8） ---------------- */

const BREATH_PHASES = [
  { label: "吸气", dur: 4, from: 0.45, to: 1.0 },
  { label: "屏息", dur: 7, from: 1.0, to: 1.0 },
  { label: "呼气", dur: 8, from: 1.0, to: 0.45 },
];
const BREATH_TOTAL = BREATH_PHASES.reduce((s, p) => s + p.dur, 0);
let breathStart = 0;

function ease(x) {
  return x * x * (3 - 2 * x);
}

function breathTick(now) {
  if (!breathOn) return;
  let t = ((now - breathStart) / 1000) % BREATH_TOTAL;
  for (const p of BREATH_PHASES) {
    if (t < p.dur) {
      const k = ease(t / p.dur);
      const scale = p.from + (p.to - p.from) * k;
      $("breathRing").style.transform = `scale(${scale.toFixed(4)})`;
      $("breathLabel").textContent = p.label;
      break;
    }
    t -= p.dur;
  }
  requestAnimationFrame(breathTick);
}

function toggleBreath() {
  breathOn = !breathOn;
  $("breath").classList.toggle("hidden", !breathOn);
  if (breathOn) {
    breathStart = performance.now();
    requestAnimationFrame(breathTick);
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

/* ---------------- 事件绑定 ---------------- */

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
      loopOne = !loopOne;
      toast(loopOne ? "单片循环：开" : "单片循环：关（播完自动下一个）");
      break;
    case "s":
    case "S":
      muted = !muted;
      layers.forEach((v) => (v.muted = muted));
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
  if (playlist.length) {
    playIndex(0);
  } else {
    toggleMenu(true); // 没有任何源时直接打开菜单引导用户
  }
  wakeUI();
})();
