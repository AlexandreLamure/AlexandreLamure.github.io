window.backgroundShaderSource = `#version 300 es
/*
Shader for a minimalist & performant colorful fluid wave, displayed on the background.
*/

precision mediump float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 u_bg;
out vec4 fragColor;

float map(float value, float min1, float max1, float min2, float max2)
{
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float hash21(vec2 p)
{
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p)
{
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p = rot * p * 2.02 + 17.3;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Flow from top-left toward bottom-right
    const float flowSpeed = 0.07;
    float flow = dot(uv, vec2(1.0, 1.0)) - iTime * flowSpeed;
    vec2 p = uv * 2.4 + vec2(flow * 0.6, flow * 0.6);

    // Domain warp for fluid-like animation
    vec2 warp = vec2(
        fbm(p + vec2(0.0, iTime * 0.04)),
        fbm(p + vec2(4.7, 1.9) - iTime * 0.03)
    );
    float smoke = fbm(p + 2.8 * warp);
    float wisps = fbm(p * 1.6 - warp * 1.4 + vec2(flow * 0.3, 0.0));

    float field = mix(smoke, wisps, 0.45);
    float wave = field + flow * 0.18 + wisps * 0.25;
    wave = map(wave, 0.0, 1.0, 0.87, 0.93);

    // Horizontal band, soft vertical fade
    const float bandY = 0.45;
    const float bandH = 0.4;
    const float bandFade = 0.3;
    float band = smoothstep(bandY - bandH, bandY - bandH + bandFade, uv.y)
               * smoothstep(bandY + bandH, bandY + bandH - bandFade, uv.y);

    // Fades
    float vignette = clamp(0.7 + smoothstep(0.15, 0.72, length(uv - 0.5)), 0.0, 1.0);
    float edgeFade = clamp(0.8 + smoothstep(0.0, 0.15, uv.x) * smoothstep(1.0, 0.85, uv.x), 0.0, 1.0);
    const float globalIntensity = 1.2;
    float vis = band * vignette * edgeFade * globalIntensity * smoothstep(0.18, 0.82, field);

    fragColor = vec4(mix(u_bg, vec3(wave), vis), 1.0);
}`;
