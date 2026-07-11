// Compile and run a WebGL2 shader for the page background.
// Vertex shader is a simple fullscreen triangle, fragment shader is the main logic (à la Shadertoy).

(function () {
    const VERTEX_SRC = `#version 300 es
in vec2 a_pos;
void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

    const FALLBACK_FRAGMENT = `#version 300 es
precision mediump float;
uniform vec3 u_bg;
out vec4 fragColor;
void main() {
    fragColor = vec4(u_bg, 1.0);
}`;

    const DEFAULT_OPTIONS = {
        renderScale: 0.25,
        maxFps: 45,
        maxDpr: 1.5
    };

    function compileShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    }

    function hexToRgb(hex) {
        const n = parseInt(hex.replace('#', ''), 16);
        return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    }

    function parseCssBgColor(cssValue) {
        const value = (cssValue || '').trim();
        if (value.startsWith('#')) {
            return hexToRgb(value);
        }
        return [1, 1, 1];
    }

    function ensureShaderLayer(canvas) {
        const parent = canvas.parentElement;
        if (parent && parent.id === 'bg-shader-layer') {
            return parent;
        }
        const layer = document.createElement('div');
        layer.id = 'bg-shader-layer';
        canvas.parentNode.insertBefore(layer, canvas);
        layer.appendChild(canvas);
        return layer;
    }

    window.startBackgroundShader = function (canvas, fragmentSource, options) {
        if (!canvas) {
            return null;
        }

        const settings = Object.assign({}, DEFAULT_OPTIONS, options || {});
        const frameInterval = 1000 / settings.maxFps;

        ensureShaderLayer(canvas);

        const gl = canvas.getContext('webgl2', {
            antialias: false,
            alpha: false,
            desynchronized: true,
            powerPreference: 'low-power'
        });
        if (!gl) {
            return null;
        }

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        gl.disable(gl.BLEND);

        const program = gl.createProgram();
        try {
            gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC));
            gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource || FALLBACK_FRAGMENT));
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                throw new Error(gl.getProgramInfoLog(program));
            }
        } catch (err) {
            console.error('Background shader failed:', err);
            return null;
        }

        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(program, 'a_pos');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(program, 'iTime');
        const uResolution = gl.getUniformLocation(program, 'iResolution');
        const uBg = gl.getUniformLocation(program, 'u_bg');

        const cssBg = getComputedStyle(document.documentElement).getPropertyValue('--bg');
        gl.uniform3fv(uBg, parseCssBgColor(cssBg));

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);
            const scale = settings.renderScale;
            const w = window.innerWidth;
            const h = window.innerHeight;
            canvas.width = Math.max(1, Math.floor(w * dpr * scale));
            canvas.height = Math.max(1, Math.floor(h * dpr * scale));
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform2f(uResolution, w * scale, h * scale);
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        let time = Math.random() * 120;
        let lastTime = performance.now();
        let lastDraw = 0;
        let running = true;

        document.addEventListener('visibilitychange', function () {
            running = !document.hidden;
            if (running) {
                const now = performance.now();
                lastTime = now;
                lastDraw = now;
                requestAnimationFrame(tick);
            }
        });

        function tick(t) {
            if (!running) {
                return;
            }

            if (t - lastDraw < frameInterval) {
                requestAnimationFrame(tick);
                return;
            }
            lastDraw = t;

            time += (t - lastTime) * 0.001;
            lastTime = t;
            gl.uniform1f(uTime, time);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            requestAnimationFrame(tick);
        }

        requestAnimationFrame(function (t) {
            lastTime = t;
            lastDraw = t;
            tick(t);
        });

        return gl;
    };
})();
