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
    const float bandH = 0.32;
    const float bandFade = 0.36;
    float band = smoothstep(bandY - bandH, bandY - bandH + bandFade, uv.y)
               * smoothstep(bandY + bandH, bandY + bandH - bandFade, uv.y);

    // Big square pixels (screen-space grid)
    const float cellPx = 12.0;
    vec2 cell = floor(gl_FragCoord.xy / cellPx);

    // Slow wave, mixed with per-cell variation
    const float waveIntensity = 0.4;
    const float waveSpeed = 0.2;
    const float waveFrequency = 0.05;
    const float waveNoise = 0.4;
    float waveDirection = mix(cell.x, -cell.y, 0.7);
    float wave = mix(1.0, sin(waveDirection * waveFrequency - iTime * waveSpeed), waveIntensity);
    float shade = mix(wave, hash21(cell), waveNoise);

    // Map to white (invisible) → light grey only
    const float greyMin = 0.86;
    float grey = mix(greyMin, 1.0, shade);
    float vis = band * (1.0 - grey) / (1.0 - greyMin);

    // Very light stroboscopic fade: each cell blinks on its own slow random cycle
    float strobeT = fract(iTime * mix(0.10, 0.16, hash21(cell + 29.3)) + hash21(cell + 53.7));
    float strobe = smoothstep(0.0, 0.18, strobeT) * (1.0 - smoothstep(0.62, 0.82, strobeT));
    vis *= strobe;

    fragColor = vec4(mix(u_bg, vec3(grey), vis), 1.0);
}`;

