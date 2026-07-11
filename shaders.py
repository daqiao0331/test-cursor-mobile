# -*- coding: utf-8 -*-
"""
NEO·ZEN 数字禅境 —— GLSL 场景库
所有风景均为实时程序化生成（procedural），分辨率无关：
在 4K 屏幕上就是原生 4K，没有任何缩放损失。
"""

VERTEX = """
#version 330
in vec2 in_pos;
void main() {
    gl_Position = vec4(in_pos, 0.0, 1.0);
}
"""

# ---------------------------------------------------------------- 公共头部
_HEADER = """
#version 330
uniform float u_time;        // 秒
uniform vec2  u_resolution;  // 像素
uniform float u_breath;      // 呼吸引导 0..1
uniform float u_breath_on;   // 呼吸环开关
uniform float u_fade;        // 场景淡入淡出 0..1
uniform sampler2D u_tex;     // 视频纹理（程序化场景不使用）
uniform vec2  u_texsize;     // 视频纹理尺寸
out vec4 fragColor;

float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = p * 2.03 + 17.7;
        a *= 0.5;
    }
    return v;
}

// 闪烁星空
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
"""

# ---------------------------------------------------------------- 公共尾部
_FOOTER = """
void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;

    vec3 col = scene(uv, st);

    // ---- 呼吸引导光环（4-7-8 呼吸法） ----
    if (u_breath_on > 0.5) {
        float r = mix(0.10, 0.30, u_breath);
        float d = abs(length(uv) - r);
        float ring = smoothstep(0.010, 0.0, d);
        float glow = 0.018 / (d + 0.018);
        vec3 rc = mix(vec3(0.35, 0.9, 1.0), vec3(0.85, 0.5, 1.0), u_breath);
        col *= 1.0 - 0.18 * smoothstep(r + 0.3, 0.0, length(uv));
        col += rc * (ring * 0.9 + glow * 0.30);
    }

    // ---- 暗角 + 细腻噪点（胶片质感，降低色带） ----
    float vig = smoothstep(1.5, 0.4, length(uv) * 1.1);
    col *= mix(0.72, 1.0, vig);
    col += (hash21(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.018;

    col *= clamp(u_fade, 0.0, 1.0);
    col = pow(max(col, 0.0), vec3(0.92));
    fragColor = vec4(col, 1.0);
}
"""

# ================================================================ 场景 1
# SOLAR GRID —— 合成波日落 + 透视霓虹网格（Skrillex 直播视觉风格）
_SOLAR_GRID = """
vec3 scene(vec2 uv, vec2 st) {
    float t = u_time;
    float horizon = 0.0;
    vec3 col;

    vec3 sunTop = vec3(1.0, 0.85, 0.30);
    vec3 sunBot = vec3(1.0, 0.18, 0.55);
    vec2 sp = uv - vec2(0.0, 0.22);
    float sd = length(sp);
    vec3 sunCol = mix(sunTop, sunBot, smoothstep(0.20, -0.20, sp.y));

    if (uv.y > horizon) {
        // 渐变夜空：深紫 -> 品红
        vec3 top = vec3(0.04, 0.01, 0.13);
        vec3 bot = vec3(0.42, 0.05, 0.34);
        col = mix(bot, top, smoothstep(0.0, 0.75, uv.y));

        // 星空
        col += vec3(1.0, 0.9, 1.0) * stars(uv + vec2(t * 0.003, 0.0), 45.0, 2.0)
             * smoothstep(0.12, 0.45, uv.y);

        // 太阳（带经典横向切割条纹，越往下越稀疏）
        float stripes = sin(sp.y * 110.0 + t * 1.2);
        float cut = smoothstep(0.0, 0.12, stripes - smoothstep(0.05, -0.18, sp.y) * 1.7 + 0.8);
        float sun = smoothstep(0.205, 0.195, sd);
        col = mix(col, sunCol, sun * cut);
    } else {
        // 地平线下：无限延伸的透视网格
        float z = 0.12 / (horizon - uv.y + 0.002);
        vec2 gp = vec2(uv.x * z * 7.0, z * 2.0 + t * 0.5);
        vec2 grid = abs(fract(gp) - 0.5);
        float lw = 0.5 * fwidth(gp.y) + 0.03;
        float line = smoothstep(lw + 0.02, 0.0, min(grid.x, grid.y));
        float depthFade = smoothstep(7.0, 0.6, z);

        vec3 ground = vec3(0.03, 0.0, 0.08);
        vec3 neon = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.2, 0.8),
                        0.5 + 0.5 * sin(t * 0.25 + z * 0.7));
        col = ground + neon * line * depthFade * 0.9;

        // 太阳在"水面/地面"上的倒影光带
        col += sunCol * exp(-abs(uv.x) * 7.0) * smoothstep(-0.35, 0.0, uv.y) * 0.30;
    }

    // 太阳外发光 + 地平线光晕
    col += sunCol * 0.05 / (0.05 + sd * sd * 9.0) * 0.55;
    col += vec3(1.0, 0.3, 0.8) * 0.012 / (abs(uv.y - horizon) + 0.02) * 0.35;
    return col;
}
"""

# ================================================================ 场景 2
# AURORA —— 极地夜空，缓慢流动的极光帷幕与山脊剪影
_AURORA = """
vec3 scene(vec2 uv, vec2 st) {
    float t = u_time * 0.25;

    // 深夜天空
    vec3 col = mix(vec3(0.005, 0.010, 0.045), vec3(0.020, 0.030, 0.10), st.y);
    col += vec3(1.0, 0.97, 0.92) * stars(uv, 55.0, 3.0) * smoothstep(-0.15, 0.15, uv.y);

    // 三层极光帷幕
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

    // 远山剪影
    float ridge = fbm(vec2(uv.x * 2.2 + 3.7, 1.0)) * 0.28 - 0.30;
    float mountain = smoothstep(0.004, -0.004, uv.y - ridge);
    col = mix(col, vec3(0.008, 0.014, 0.030), mountain);

    // 雪面微弱反光
    col += vec3(0.05, 0.12, 0.10) * mountain * smoothstep(-0.5, -0.3, uv.y)
         * fbm(vec2(uv.x * 6.0, uv.y * 6.0)) * 0.6;
    return col;
}
"""

# ================================================================ 场景 3
# OCEAN DAWN —— 黎明海面，日光路径随波光闪烁
_OCEAN_DAWN = """
vec3 scene(vec2 uv, vec2 st) {
    float t = u_time;
    float horizon = 0.05;
    vec3 col;

    vec2 sp = uv - vec2(0.0, horizon + 0.10);
    float sd = length(sp);
    vec3 sunCol = vec3(1.0, 0.72, 0.42);

    if (uv.y > horizon) {
        // 黎明天空：靛蓝 -> 暖橙
        vec3 top = vec3(0.06, 0.09, 0.22);
        vec3 bot = vec3(0.95, 0.45, 0.25);
        col = mix(bot, top, smoothstep(0.0, 0.8, uv.y - horizon));

        // 粉色卷云
        float cl = fbm(vec2(uv.x * 2.5 + t * 0.010, uv.y * 6.0 + 4.0));
        cl = smoothstep(0.45, 0.75, cl) * smoothstep(0.65, 0.15, uv.y);
        col = mix(col, vec3(1.0, 0.62, 0.55), cl * 0.35);

        // 太阳
        col = mix(col, vec3(1.0, 0.92, 0.75), smoothstep(0.085, 0.075, sd));

        // 残星
        col += vec3(1.0) * stars(uv, 50.0, 2.0) * smoothstep(0.3, 0.7, uv.y) * 0.5;
    } else {
        // 海面：透视 + 波光
        float z = 0.10 / (horizon - uv.y + 0.002);
        vec3 deep = vec3(0.02, 0.06, 0.12);
        vec3 warm = vec3(0.55, 0.28, 0.18);

        // 日光在海面上的反射路径（远处窄、近处宽）
        float path = exp(-pow(uv.x * (2.5 + z * 1.6), 2.0));
        col = mix(deep, warm, path * 0.8);

        // 波光粼粼（噪声频率随距离缩放，近处波纹更大）
        float sparkle = noise(vec2(uv.x * (18.0 + z * 42.0), z * 9.0 - t * 1.4));
        sparkle *= noise(vec2(uv.x * (9.0 + z * 20.0), z * 5.0 + t * 0.9));
        col += sunCol * smoothstep(0.40, 0.72, sparkle) * path
             * smoothstep(8.0, 0.5, z) * 0.9;

        // 缓慢的横向涌浪明暗
        col *= 0.9 + 0.1 * sin(z * 3.0 - t * 0.35);
    }

    // 太阳光晕 + 地平线辉光
    col += sunCol * 0.05 / (0.05 + sd * sd * 7.0) * 0.6;
    col += sunCol * 0.010 / (abs(uv.y - horizon) + 0.02) * 0.4;
    return col;
}
"""

# ================================================================ 场景 4
# NEBULA DRIFT —— 深空星云，域扭曲噪声缓慢流动
_NEBULA = """
vec3 scene(vec2 uv, vec2 st) {
    float t = u_time * 0.03;

    // 极缓慢旋转
    float a = t * 0.15;
    mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
    vec2 p = rot * uv * 1.7;

    // 域扭曲（domain warping）
    vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
    vec2 r = vec2(fbm(p + 3.0 * q + vec2(1.7, 9.2)),
                  fbm(p + 3.0 * q + vec2(8.3, 2.8)));
    float f = fbm(p + 3.0 * r);

    vec3 col = mix(vec3(0.015, 0.015, 0.07), vec3(0.24, 0.08, 0.42),
                   clamp(f * f * 2.6, 0.0, 1.0));
    col = mix(col, vec3(0.0, 0.45, 0.55), clamp(length(q), 0.0, 1.0) * 0.45);
    col = mix(col, vec3(0.90, 0.42, 0.70), clamp(r.x * r.x, 0.0, 1.0) * 0.40);
    col *= 0.75 + 0.5 * f;

    // 双层星空（视差）
    col += vec3(1.0) * stars(uv * 1.0 + q * 0.02, 60.0, 2.5);
    col += vec3(0.8, 0.9, 1.0) * stars(uv * 2.3 + 11.0, 60.0, 1.5) * 0.6;

    // 中心一颗缓慢脉动的"心灯"
    float d = length(uv);
    col += vec3(0.9, 0.8, 1.0) * 0.010 / (0.01 + d * d * 4.0)
         * (0.8 + 0.2 * sin(u_time * 0.4));
    return col;
}
"""

# ================================================================ 视频场景
# 播放 videos/ 目录下的 4K 实拍风景（cover 填充 + 电影级微调色）
_VIDEO = """
vec3 scene(vec2 uv, vec2 st) {
    // cover 填充：等比缩放铺满屏幕，多余部分裁掉
    float s = max(u_resolution.x / u_texsize.x, u_resolution.y / u_texsize.y);
    vec2 k = u_resolution / (u_texsize * s);
    vec2 tuv = (st - 0.5) * k + 0.5;
    tuv.y = 1.0 - tuv.y;

    vec3 col = texture(u_tex, tuv).rgb;

    // 轻微电影感调色：暗部偏青、亮部偏暖
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * vec3(0.92, 1.0, 1.06), (1.0 - lum) * 0.25);
    col = mix(col, col * vec3(1.05, 1.0, 0.95), lum * 0.15);
    col = pow(col, vec3(1.04));
    return col;
}
"""

# 程序化场景（名称 -> 片元着色器主体）
PROCEDURAL_SCENES = [
    ("SOLAR GRID · 合成波日落", _SOLAR_GRID),
    ("AURORA · 极光之夜", _AURORA),
    ("OCEAN DAWN · 黎明海面", _OCEAN_DAWN),
    ("NEBULA DRIFT · 深空星云", _NEBULA),
]

VIDEO_SCENE_BODY = _VIDEO


def build_fragment(body: str) -> str:
    """拼装完整的片元着色器：公共头部 + 场景主体 + 公共尾部。"""
    return _HEADER + body + _FOOTER
