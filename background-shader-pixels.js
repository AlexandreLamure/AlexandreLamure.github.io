window.backgroundShaderSource = `#version 300 es
/*
Shader for a minimalist & performant animated pattern, displayed on the background.
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

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution;

    // Horizontal band, soft vertical fade
    const float bandY = 0.45;
    const float bandH = 0.24;
    const float bandFade = 0.36;
    float band = smoothstep(bandY - bandH, bandY - bandH + bandFade, uv.y)
               * smoothstep(bandY + bandH, bandY + bandH - bandFade, uv.y);

    // Big square pixels (screen-space grid)
    const float cellPx = 12.0;
    vec2 cell = floor(gl_FragCoord.xy / cellPx);

    // Map to white (invisible) → light grey only
    float shade = hash21(cell);
    const float greyMin = 0.90;
    float grey = mix(greyMin, 1.0, shade);
    float vis = band * (1.0 - grey) / (1.0 - greyMin);

    // Very light stroboscopic fade: each cell blinks on its own slow random cycle
    float strobeT = fract(iTime * mix(0.12, 0.18, hash21(cell + 29.3)) + hash21(cell + 53.7));
    float strobe = smoothstep(0.0, 0.24, strobeT) * (1.0 - smoothstep(0.58, 0.80, strobeT));
    vis *= strobe;

    fragColor = vec4(mix(u_bg, vec3(grey), vis), 1.0);
}`;

