precision mediump float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec3 u_bg;

// Placeholder fragment shader — replace this with your raymarch code.
void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv - 0.5;
    float t = iTime * 0.2;
    float v = 0.5 * cos(6.2831 * (p.x + t));
    vec3 col = mix(u_bg, vec3(0.42, 0.49, 1.0), v);
    gl_FragColor = vec4(col, 1.0);
}
