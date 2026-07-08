window.backgroundShaderSource = `#version 300 es
/*
Shader for a minimalist & performant colorful fluid wave, displayed on the background.
*/

precision mediump float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 u_bg;
out vec4 fragColor;

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
    float flow = uv.y - iTime * flowSpeed;
    vec2 p = uv * 2.4 + vec2(flow * 0.0, flow * 0.75);

    // Domain warp for fluid-like animation
    vec2 warp = vec2(
        fbm(p + vec2(0.0, iTime * 0.04)),
        fbm(p + vec2(4.7, 1.9) - iTime * 0.03)
    );
    float smoke1 = fbm(p + 2.8 * warp);
    float smoke2 = fbm(p * 1.6 - warp * 1.4 + vec2(0.0, flow * 0.3));
    float smoke = mix(smoke1, smoke2, 0.45);
    const float smokeBlur = 0.175; // increase to make the smoke more diffuse
    smoke = smoothstep(0.5-smokeBlur, 0.5+smokeBlur, smoke);

    // Fades
    float vignette = smoothstep(0.18, 0.72, length(uv - 0.5));
    float topFade = smoothstep(0.92, 0.30, uv.y);
    const float globalFade = 0.30;
    float vis = vignette * topFade * globalFade;

    fragColor = vec4(mix(u_bg, vec3(smoke), vis), 1.0);
}`;
