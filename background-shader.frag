/*
This shader is inspired by Shane's "Perspex Web Lattice" ShaderToy (https://www.shadertoy.com/view/Mld3Rn).
It's a minimalist and performant voronoi pattern, animated, and displayed on the background edges.
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

// 2D 2nd-order Voronoi
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

void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 p = uv - 0.5;
    float t = iTime * 0.1;
    float u = 0.1 * cos(2.8976 * (p.y + t));
    float v = 0.5 * cos(6.2831 * (p.x + t));
    vec3 color = vec3(Voronoi(p * 5.0 + vec2(u, v)));

    float vignette = smoothstep(0.3, 0.8, length(p - vec2(0.0, 0.1)));
    float topFade = smoothstep(1.0, 0.5, uv.y);
    float globalFade = 0.5;
    color = mix(u_bg, color, vignette * topFade * globalFade); // blend with background color
    
    gl_FragColor = vec4(color, 1.0);
}