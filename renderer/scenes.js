/* Serene · 静观 —— 算法动画场景库
 *
 * 两类引擎：
 *   ShaderEngine  — WebGL2 片元着色器实时生成的风景（极光 / 海面 / 星云 / 云海）
 *   元胞自动机     — 一格一格无限迭代的网格动画（生命游戏 / 循环元胞 / 初等元胞）
 *
 * 每个引擎实现 start(canvas) / stop() / setPaused(bool)。
 */

"use strict";

/* ================================================================ WebGL 着色器 */

const VERT_SRC = `#version 300 es
in vec2 in_pos;
void main() { gl_Position = vec4(in_pos, 0.0, 1.0); }
`;

const FRAG_HEADER = `#version 300 es
precision highp float;
uniform float u_time;
uniform vec2  u_resolution;
out vec4 fragColor;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1, 0));
  float c = hash21(i + vec2(0, 1)), d = hash21(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.7; a *= 0.5; }
  return v;
}
float stars(vec2 uv, float density, float twinkle) {
  vec2 g = uv * density;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash21(id);
  vec2 offs = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * 0.6;
  float star = smoothstep(0.06, 0.0, length(f - offs));
  float tw = 0.5 + 0.5 * sin(u_time * twinkle + h * 40.0);
  return star * step(0.92, h) * tw;
}
`;

const FRAG_FOOTER = `
void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
  vec3 col = scene(uv, st);
  float vig = smoothstep(1.5, 0.4, length(uv) * 1.1);
  col *= mix(0.72, 1.0, vig);
  col += (hash21(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.016;
  col = pow(max(col, 0.0), vec3(0.92));
  fragColor = vec4(col, 1.0);
}
`;

const SHADER_AURORA = `
vec3 scene(vec2 uv, vec2 st) {
  float t = u_time * 0.25;
  vec3 col = mix(vec3(0.005, 0.010, 0.045), vec3(0.020, 0.030, 0.10), st.y);
  col += vec3(1.0, 0.97, 0.92) * stars(uv, 55.0, 3.0) * smoothstep(-0.15, 0.15, uv.y);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y0 = 0.02 + fi * 0.13;
    float w = fbm(vec2(uv.x * 1.6 + t * (0.35 + fi * 0.12), fi * 7.0 + t * 0.2));
    float path = uv.y - y0 - (w - 0.5) * 0.55;
    float band = exp(-abs(path) * 7.5)
               * (0.35 + 0.65 * fbm(vec2(uv.x * 3.2 - t * 1.2, fi * 13.0)));
    vec3 ac = mix(vec3(0.10, 0.90, 0.50), vec3(0.42, 0.28, 0.95),
                  fi * 0.5 + 0.25 * sin(t + fi * 2.0));
    col += ac * band * 0.45;
  }
  float ridge = fbm(vec2(uv.x * 2.2 + 3.7, 1.0)) * 0.28 - 0.30;
  float mountain = smoothstep(0.004, -0.004, uv.y - ridge);
  col = mix(col, vec3(0.008, 0.014, 0.030), mountain);
  col += vec3(0.05, 0.12, 0.10) * mountain * smoothstep(-0.5, -0.3, uv.y)
       * fbm(vec2(uv.x * 6.0, uv.y * 6.0)) * 0.6;
  return col;
}
`;

const SHADER_OCEAN = `
vec3 scene(vec2 uv, vec2 st) {
  float t = u_time;
  float horizon = 0.05;
  vec3 col;
  vec2 sp = uv - vec2(0.0, horizon + 0.10);
  float sd = length(sp);
  vec3 sunCol = vec3(1.0, 0.72, 0.42);

  if (uv.y > horizon) {
    vec3 top = vec3(0.06, 0.09, 0.22);
    vec3 bot = vec3(0.95, 0.45, 0.25);
    col = mix(bot, top, smoothstep(0.0, 0.8, uv.y - horizon));
    float cl = fbm(vec2(uv.x * 2.5 + t * 0.010, uv.y * 6.0 + 4.0));
    cl = smoothstep(0.45, 0.75, cl) * smoothstep(0.65, 0.15, uv.y);
    col = mix(col, vec3(1.0, 0.62, 0.55), cl * 0.35);
    col = mix(col, vec3(1.0, 0.92, 0.75), smoothstep(0.085, 0.075, sd));
    col += vec3(1.0) * stars(uv, 50.0, 2.0) * smoothstep(0.3, 0.7, uv.y) * 0.5;
  } else {
    float z = 0.10 / (horizon - uv.y + 0.002);
    vec3 deep = vec3(0.02, 0.06, 0.12);
    vec3 warm = vec3(0.55, 0.28, 0.18);
    float path = exp(-pow(uv.x * (2.5 + z * 1.6), 2.0));
    col = mix(deep, warm, path * 0.8);
    float sparkle = noise(vec2(uv.x * (18.0 + z * 42.0), z * 9.0 - t * 1.4));
    sparkle *= noise(vec2(uv.x * (9.0 + z * 20.0), z * 5.0 + t * 0.9));
    col += sunCol * smoothstep(0.40, 0.72, sparkle) * path
         * smoothstep(8.0, 0.5, z) * 0.9;
    col *= 0.9 + 0.1 * sin(z * 3.0 - t * 0.35);
  }
  col += sunCol * 0.05 / (0.05 + sd * sd * 7.0) * 0.6;
  col += sunCol * 0.010 / (abs(uv.y - horizon) + 0.02) * 0.4;
  return col;
}
`;

const SHADER_NEBULA = `
vec3 scene(vec2 uv, vec2 st) {
  float t = u_time * 0.03;
  float a = t * 0.15;
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 p = rot * uv * 1.7;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2)),
                fbm(p + 3.0 * q + vec2(8.3, 2.8)));
  float f = fbm(p + 3.0 * r);
  vec3 col = mix(vec3(0.015, 0.015, 0.07), vec3(0.24, 0.08, 0.42),
                 clamp(f * f * 2.6, 0.0, 1.0));
  col = mix(col, vec3(0.0, 0.45, 0.55), clamp(length(q), 0.0, 1.0) * 0.45);
  col = mix(col, vec3(0.90, 0.42, 0.70), clamp(r.x * r.x, 0.0, 1.0) * 0.40);
  col *= 0.75 + 0.5 * f;
  col += vec3(1.0) * stars(uv + q * 0.02, 60.0, 2.5);
  col += vec3(0.8, 0.9, 1.0) * stars(uv * 2.3 + 11.0, 60.0, 1.5) * 0.6;
  float d = length(uv);
  col += vec3(0.9, 0.8, 1.0) * 0.010 / (0.01 + d * d * 4.0)
       * (0.8 + 0.2 * sin(u_time * 0.4));
  return col;
}
`;

const SHADER_MIST = `
vec3 scene(vec2 uv, vec2 st) {
  float t = u_time * 0.03;
  vec3 col = mix(vec3(0.045, 0.060, 0.085), vec3(0.14, 0.17, 0.21), st.y);

  // 月亮与月晕
  vec2 mp = uv - vec2(0.52, 0.28);
  float md = length(mp);
  col += vec3(0.92, 0.93, 0.95) * smoothstep(0.045, 0.040, md);
  col += vec3(0.75, 0.80, 0.88) * 0.015 / (0.015 + md * md * 6.0) * 0.7;
  col += vec3(1.0) * stars(uv, 45.0, 2.0) * smoothstep(0.0, 0.3, uv.y) * 0.6;

  // 四层缓慢漂移的雾海
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    vec2 p = uv * vec2(1.1 + fi * 0.5, 2.2 + fi * 0.5)
           + vec2(t * (6.0 + fi * 4.0), fi * 3.7);
    float m = fbm(p + fbm(p + t * 2.0) * 0.7);
    float layerY = -0.05 - fi * 0.11;
    float mask = smoothstep(0.22, -0.30, uv.y - layerY);
    float band = smoothstep(0.40, 0.80, m);
    vec3 mistCol = mix(vec3(0.55, 0.60, 0.68), vec3(0.80, 0.78, 0.74), fi / 3.0);
    col = mix(col, mistCol * (0.55 + 0.12 * fi), band * mask * 0.60);
  }
  return col;
}
`;

// 同一画布共享一个 WebGL2 上下文，场景切换只换 program，避免上下文丢失
let _sharedGL = null;
function getGL(canvas) {
  if (_sharedGL && _sharedGL.canvas === canvas && !_sharedGL.isContextLost()) {
    return _sharedGL;
  }
  _sharedGL = canvas.getContext("webgl2", { antialias: false });
  return _sharedGL;
}

class ShaderEngine {
  constructor(fragBody) {
    this.fragBody = fragBody;
    this.raf = 0;
    this.elapsed = 0;
    this.lastTs = 0;
    this.paused = false;
    this.prog = null;
    this.builtWith = null;
  }
  _build(gl) {
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(s) || "shader compile failed");
      }
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG_HEADER + this.fragBody + FRAG_FOOTER));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || "program link failed");
    }
    this.prog = prog;
    this.buf = gl.createBuffer();
    this.builtWith = gl;
  }
  start(canvas) {
    this.canvas = canvas;
    const gl = (this.gl = getGL(canvas));
    if (!gl) throw new Error("WebGL2 不可用");
    if (!this.prog || this.builtWith !== gl) this._build(gl);
    gl.useProgram(this.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(this.prog, "in_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.uTime = gl.getUniformLocation(this.prog, "u_time");
    this.uRes = gl.getUniformLocation(this.prog, "u_resolution");
    this.lastTs = performance.now();
    const frame = (ts) => {
      this.raf = requestAnimationFrame(frame);
      if (!this.paused) this.elapsed += (ts - this.lastTs) / 1000;
      this.lastTs = ts;
      if (this.paused) return;
      const w = canvas.clientWidth * devicePixelRatio;
      const h = canvas.clientHeight * devicePixelRatio;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform1f(this.uTime, this.elapsed + 30.0);
      gl.uniform2f(this.uRes, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    this.raf = requestAnimationFrame(frame);
  }
  stop() {
    cancelAnimationFrame(this.raf);
  }
  setPaused(p) {
    this.paused = p;
    if (!p) this.lastTs = performance.now();
  }
}

/* ================================================================ 元胞自动机基类 */

class CellEngine {
  constructor(stepMs) {
    this.stepMs = stepMs;
    this.raf = 0;
    this.acc = 0;
    this.lastTs = 0;
    this.paused = false;
  }
  start(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this._fit();
    this.init();
    this.lastTs = performance.now();
    const frame = (ts) => {
      this.raf = requestAnimationFrame(frame);
      const dt = ts - this.lastTs;
      this.lastTs = ts;
      if (this.paused) return;
      if (this._fit()) this.init();
      this.acc += dt;
      while (this.acc >= this.stepMs) {
        this.acc -= this.stepMs;
        this.step();
      }
      this.render();
    };
    this.raf = requestAnimationFrame(frame);
  }
  _fit() {
    const c = this.canvas;
    const w = Math.floor(c.clientWidth * devicePixelRatio);
    const h = Math.floor(c.clientHeight * devicePixelRatio);
    if (c.width !== w || c.height !== h) {
      c.width = w;
      c.height = h;
      return true;
    }
    return false;
  }
  stop() {
    cancelAnimationFrame(this.raf);
  }
  setPaused(p) {
    this.paused = p;
    if (!p) this.lastTs = performance.now();
  }
  init() {}
  step() {}
  render() {}
}

const INK = [231, 227, 216];      // 象牙白
const CLAY = [204, 120, 92];      // 陶土色
const BG = "#0a0c0e";

/* ---------------- 生命游戏：康威 Life，带余辉与自动补种 ---------------- */

class LifeEngine extends CellEngine {
  constructor() {
    super(200);
  }
  init() {
    const px = 16 * devicePixelRatio;
    this.cols = Math.max(24, Math.round(this.canvas.width / px));
    this.rows = Math.max(16, Math.round(this.canvas.height / px));
    const n = this.cols * this.rows;
    this.grid = new Uint8Array(n);
    this.next = new Uint8Array(n);
    this.age = new Float32Array(n);   // 显示亮度（余辉）
    this.born = new Uint8Array(n);    // 新生标记
    this.ticks = 0;
    this.lastPop = 0;
    this.stagnant = 0;
    for (let i = 0; i < n; i++) this.grid[i] = Math.random() < 0.14 ? 1 : 0;
  }
  _seedBlob() {
    const { cols, rows, grid } = this;
    const cx = 2 + Math.floor(Math.random() * (cols - 4));
    const cy = 2 + Math.floor(Math.random() * (rows - 4));
    const r = 3 + Math.floor(Math.random() * 5);
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (Math.random() < 0.45) {
          grid[((y + rows) % rows) * cols + ((x + cols) % cols)] = 1;
        }
      }
    }
  }
  step() {
    const { cols, rows, grid, next } = this;
    let pop = 0;
    for (let y = 0; y < rows; y++) {
      const yu = ((y - 1 + rows) % rows) * cols;
      const ym = y * cols;
      const yd = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const xl = (x - 1 + cols) % cols;
        const xr = (x + 1) % cols;
        const n =
          grid[yu + xl] + grid[yu + x] + grid[yu + xr] +
          grid[ym + xl] +               grid[ym + xr] +
          grid[yd + xl] + grid[yd + x] + grid[yd + xr];
        const alive = grid[ym + x];
        const v = alive ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0;
        next[ym + x] = v;
        this.born[ym + x] = v && !alive ? 1 : 0;
        pop += v;
      }
    }
    this.grid.set(next);
    for (let i = 0; i < grid.length; i++) {
      this.age[i] = grid[i] ? Math.min(1, this.age[i] + 0.5) : this.age[i] * 0.80;
    }
    // 活性检测：种群长期不变则补种，保证无限迭代不死寂
    this.ticks++;
    this.stagnant = Math.abs(pop - this.lastPop) <= 2 ? this.stagnant + 1 : 0;
    this.lastPop = pop;
    if (this.stagnant > 30 || pop < grid.length * 0.02) {
      this._seedBlob();
      this._seedBlob();
      this.stagnant = 0;
    }
    if (this.ticks % 300 === 0) this._seedBlob();
  }
  render() {
    const { ctx, canvas, cols, rows, age, born } = this;
    const cw = canvas.width / cols;
    const ch = canvas.height / rows;
    const gap = Math.max(1, cw * 0.14);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        const a = age[i];
        if (a < 0.02) continue;
        const c = born[i] ? CLAY : INK;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(a * 0.88).toFixed(3)})`;
        const r = Math.min(3 * devicePixelRatio, cw * 0.18);
        ctx.beginPath();
        ctx.roundRect(x * cw + gap / 2, y * ch + gap / 2, cw - gap, ch - gap, r);
        ctx.fill();
      }
    }
  }
}

/* ---------------- 循环元胞：状态互相"追逐"，自发形成螺旋波 ---------------- */

class CyclicEngine extends CellEngine {
  constructor() {
    super(110);
    this.N = 14;
  }
  init() {
    const px = 9 * devicePixelRatio;
    this.cols = Math.max(48, Math.round(this.canvas.width / px));
    this.rows = Math.max(32, Math.round(this.canvas.height / px));
    const n = this.cols * this.rows;
    this.grid = new Uint8Array(n);
    this.next = new Uint8Array(n);
    for (let i = 0; i < n; i++) this.grid[i] = Math.floor(Math.random() * this.N);
    // 主题色循环色板：炭黑 → 深青 → 鼠尾草 → 象牙白 → 沙色 → 陶土 → 回到炭黑
    this.palette = [
      "#141a1e", "#1d2b33", "#2e4a52", "#4f7368",
      "#7fa08c", "#b5b8a3", "#e2ddcf", "#d6b896",
      "#c98d68", "#a86a4f", "#6f4a3e", "#35302e",
    ];
    this.N = this.palette.length;
    for (let i = 0; i < n; i++) this.grid[i] = Math.floor(Math.random() * this.N);
    // 预演化：跳过早期噪声阶段，开屏即是成形的波纹/螺旋
    for (let s = 0; s < 220; s++) this.step();
  }
  step() {
    const { cols, rows, grid, next, N } = this;
    for (let y = 0; y < rows; y++) {
      const yu = ((y - 1 + rows) % rows) * cols;
      const ym = y * cols;
      const yd = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const s = grid[ym + x];
        const eat = (s + 1) % N;
        const xl = (x - 1 + cols) % cols;
        const xr = (x + 1) % cols;
        next[ym + x] =
          grid[yu + x] === eat || grid[yd + x] === eat ||
          grid[ym + xl] === eat || grid[ym + xr] === eat
            ? eat
            : s;
      }
    }
    this.grid.set(next);
  }
  render() {
    const { ctx, canvas, cols, rows, grid, palette } = this;
    const cw = canvas.width / cols;
    const ch = canvas.height / rows;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 0.85;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = palette[grid[y * cols + x]];
        ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  }
}

/* ---------------- 初等元胞：Rule 90 逐行迭代，向上无限滚动 ----------------
 * 稀疏的谢尔宾斯基三角相互交叠、生灭，空灵而不密集 */

class ElementaryEngine extends CellEngine {
  constructor() {
    super(150);
    this.rule = 90;
  }
  init() {
    const px = 14 * devicePixelRatio;
    this.cell = px;
    this.cols = Math.max(48, Math.round(this.canvas.width / px));
    this.row = new Uint8Array(this.cols);
    for (let i = 0; i < this.cols; i++) this.row[i] = Math.random() < 0.03 ? 1 : 0;
    this.ctx.fillStyle = BG;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  step() {
    const { cols, row, rule } = this;
    const next = new Uint8Array(cols);
    let pop = 0;
    for (let x = 0; x < cols; x++) {
      const l = row[(x - 1 + cols) % cols];
      const c = row[x];
      const r = row[(x + 1) % cols];
      next[x] = (rule >> ((l << 2) | (c << 1) | r)) & 1;
      pop += next[x];
    }
    // 偶尔播一颗新种子；全灭时重新起头，保证无限迭代
    if (Math.random() < 0.03 || pop === 0) {
      next[Math.floor(Math.random() * cols)] = 1;
    }
    this.row = next;
    this._scrollAndDraw();
  }
  _scrollAndDraw() {
    const { ctx, canvas, cell, cols, row } = this;
    const ch = cell;
    // 整幅画面上移一行，旧行随复制轻微变暗，形成时间纵深
    ctx.globalAlpha = 0.975;
    ctx.drawImage(canvas, 0, ch, canvas.width, canvas.height - ch, 0, 0, canvas.width, canvas.height - ch);
    ctx.globalAlpha = 1;
    ctx.fillStyle = BG;
    ctx.fillRect(0, canvas.height - ch, canvas.width, ch);
    const cw = canvas.width / cols;
    const gap = Math.max(0.5, cw * 0.12);
    for (let x = 0; x < cols; x++) {
      if (!row[x]) continue;
      const c = Math.random() < 0.03 ? CLAY : INK;
      ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},0.9)`;
      ctx.fillRect(x * cw + gap / 2, canvas.height - ch + gap / 2, cw - gap, ch - gap);
    }
  }
  render() {} // 绘制在 step 内完成（滚动画布自身即历史）
}

/* ================================================================ 场景注册表 */

const SCENES = [
  { id: "aurora", name: "极光", en: "AURORA", make: () => new ShaderEngine(SHADER_AURORA), canvas: "gl" },
  { id: "ocean", name: "黎明海面", en: "OCEAN DAWN", make: () => new ShaderEngine(SHADER_OCEAN), canvas: "gl" },
  { id: "mist", name: "月下云海", en: "MOONLIT MIST", make: () => new ShaderEngine(SHADER_MIST), canvas: "gl" },
  { id: "nebula", name: "深空星云", en: "NEBULA", make: () => new ShaderEngine(SHADER_NEBULA), canvas: "gl" },
  { id: "life", name: "生命游戏", en: "CONWAY LIFE", make: () => new LifeEngine(), canvas: "2d" },
  { id: "cyclic", name: "螺旋元胞", en: "CYCLIC CA", make: () => new CyclicEngine(), canvas: "2d" },
  { id: "rule90", name: "初等元胞", en: "RULE 90", make: () => new ElementaryEngine(), canvas: "2d" },
];
