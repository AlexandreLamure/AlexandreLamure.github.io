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

// 2D 2nd-order Voronoi, inspired by Shane's "Perspex Web Lattice" ShaderToy (https://www.shadertoy.com/view/Mld3Rn).
float Voronoi(in vec2 p){
	vec2 g = floor(p), o; p -= g;
	vec3 d = vec3(1); // "d.z" holds the distance comparison value.
	for(int y = -1; y <= 1; y++){
		for(int x = -1; x <= 1; x++){
			o = vec2(x, y);
            o += hash22(g + o) - p;
			d.z = dot(o, o); 
            d.y = max(d.x, min(d.y, d.z));
            d.x = min(d.x, d.z); 
		}
	}
    return max(d.y/1.2 - d.x*1., 0.)/1.2;
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

    // Voronoi
    float u = 0.1 * cos(2.8976 * (p.x + t));
    float v = 0.5 * cos(6.2831 * (p.y + t));
    float voronoi = Voronoi(p * 5.0 + vec2(u, v));

    // Dot Noise
    const float DotNoiseScale = 16.0;
    float dotNoise = DotNoise(vec3(uv, t) * DotNoiseScale);

    // Combine
    vec3 color = vec3(1.0 - ((1.0 - voronoi) * dotNoise));

    // Fade out
    float vignette = smoothstep(0.17, 0.8, length(p - vec2(0.0, 0.1)));
    float topFade = smoothstep(1.0, 0.5, uv.y);
    const float globalFade = 0.4;
    color = mix(u_bg, color, vignette * topFade * globalFade); // blend with background color

    gl_FragColor = vec4(color, 1.0);
}