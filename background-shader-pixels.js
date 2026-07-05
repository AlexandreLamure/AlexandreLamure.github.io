window.backgroundShaderSource = `
/*
This shader is a minimalist, performant and animated background pattern, displayed on the background edges.
*/

precision mediump float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 u_bg;

// vec2 to vec2 hash
vec2 hash22(vec2 p) { 
    float n = sin(dot(p, vec2(41, 289)));
    p = fract(vec2(262144, 32768)*n); 
    return sin( p*6.2831853 + iTime )*.45 + .5; 
}

// 3D noise, inspired by Xor's "Dot Noise" ShaderToy (https://www.shadertoy.com/view/wfsyRX).
float DotNoise(vec3 p)
{
    //The golden ratio:
    //https://mini.gmshaders.com/p/phi
    const float PHI = 1.618033988;
    //Rotating the golden angle on the vec3(1, phi, phi*phi) axis
    const mat3 GOLD = mat3(
    -0.571464913, +0.814921382, +0.096597072,
    -0.278044873, -0.303026659, +0.911518454,
    +0.772087367, +0.494042493, +0.399753815);
    
    //Gyroid with irrational orientations and scales
    float noise = dot(cos(GOLD * p), sin(PHI * p * GOLD)); //Ranges from [-3 to +3]
    return noise / 6.0 + 0.5; //Remap to [0 to 1]
}

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv - 0.5;
    float t = iTime * 0.1;

    // Dot Noise
    const float DotNoiseScale = 16.0;
    float dotNoise = DotNoise(vec3(uv, t) * DotNoiseScale);

    // Combine
    vec3 color = vec3(dotNoise);

    // Fade out
    float vignette = smoothstep(0.17, 0.75, length(p - vec2(0.0, 0.1)));
    float topFade = smoothstep(1.0, 0.5, uv.y);
    const float globalFade = 0.4;
    color = mix(u_bg, color, vignette * topFade * globalFade); // blend with background color

    gl_FragColor = vec4(u_bg, 1.0);
}`;
