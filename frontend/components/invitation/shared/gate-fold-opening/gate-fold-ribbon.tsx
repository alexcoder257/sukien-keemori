"use client";

import { useEffect, useRef, useState } from "react";
import { GATE_FOLD_OPENING } from "./gate-fold-timing";
import styles from "./gate-fold-opening.module.css";

const RELEASE_MS = GATE_FOLD_OPENING.ribbon;

// One texture and one shared mesh: adjacent pieces cannot pull apart at their
// joins. The contours only remove the paper behind the photographed satin.
// They are traced on the 984×1598 gate-fold photograph, so any recoloured
// copy of that photograph (same geometry, other palette) reuses them as is.
export const GATE_FOLD_RIBBON_CONTOURS = [
  "M30 702L177 707L155 770L155 806L441 787L445 837L30 867Z",
  "M813 706L957 701L957 863L819 865L774 820L815 786Z",
  "M448 800C386 819 294 910 76 1147L171 1145L197 1287C296 1180 398 1015 461 841Z",
  "M536 811C568 816 667 850 721 914L925 1190L818 1186L796 1309C665 1147 576 1036 538 857Z",
  "M446 765C386 719 340 616 216 599C200 599 195 624 185 654L153 769C142 805 265 856 444 800Z",
  "M544 759C625 702 699 650 805 647C819 681 824 740 834 801C851 851 694 888 546 807Z",
  "M442 736C460 730 472 742 489 730C502 723 519 743 542 740L552 793L541 837C518 831 508 855 488 841L448 836Z",
];

const VERTEX = `
  attribute vec2 position;
  uniform float progress;
  varying vec2 uv;
  void main() {
    uv = position / vec2(984.0, 1598.0);
    vec2 p = position;
    float dx = p.x - 492.0;
    float dy = p.y - 790.0;
    float side = dx / 492.0;
    float centerDistance = dx / 350.0;
    float center = exp(-centerDistance * centerDistance);
    float loosen = smoothstep(0.0, 0.46, progress);
    float fall = smoothstep(0.24, 1.0, progress);
    float tail = smoothstep(15.0, 220.0, dy);
    float loop = 1.0 - smoothstep(-12.0, 18.0, dy);
    vec2 knotDistance = vec2(dx, dy) / 70.0;
    float knot = exp(-dot(knotDistance, knotDistance));

    // Loops soften toward the knot; the tails develop a hanging S-curve.
    // All offsets are continuous functions of source coordinates, including
    // across the knot and both horizontal bands.
    p.x -= dx * 0.14 * loosen * center;
    p.y -= dy * 0.64 * loosen * loop;
    p.x += sin(dy / 130.0 + progress * 5.0) * 76.0 * tail * loosen * side;
    p.y += sin(dx / 180.0 + progress * 4.0) * 24.0 * loosen * (1.0 - knot);
    p.x += sin(progress * 5.0) * 22.0 * center * fall;

    // The knot leads the descent; the still-connected band ends lag behind
    // briefly before following the ribbon below the bottom of the wrapper.
    p.y += 1570.0 * fall * (0.72 + 0.28 * center);
    p.x += side * sin(fall * 3.14159265) * 45.0;
    gl_Position = vec4((p.x - 30.0) / 925.0 * 2.0 - 1.0,
      1.0 - (p.y - 86.0) / 2004.8 * 2.0, 0.0, 1.0);
  }
`;

const FRAGMENT = `
  precision mediump float;
  uniform sampler2D artwork;
  varying vec2 uv;
  void main() { gl_FragColor = texture2D(artwork, uv); }
`;

function shader(gl: WebGLRenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) return null;
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (gl.getShaderParameter(result, gl.COMPILE_STATUS)) return result;
  gl.deleteShader(result);
  return null;
}

export function GateFoldRibbon({ art, isOpening, id }: { art: string; isOpening: boolean; id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;
    const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
      if (program) gl.deleteProgram(program);
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      return;
    }

    const columns = 48;
    const rows = 40;
    const vertices: number[] = [];
    const indices: number[] = [];
    for (let y = 0; y <= rows; y += 1) {
      for (let x = 0; x <= columns; x += 1) {
        vertices.push(x * 984 / columns, 580 + y * 760 / rows);
        if (x < columns && y < rows) {
          const a = y * (columns + 1) + x;
          indices.push(a, a + 1, a + columns + 1, a + 1, a + columns + 2, a + columns + 1);
        }
      }
    }
    const vertexBuffer = gl.createBuffer();
    const indexBuffer = gl.createBuffer();
    const texture = gl.createTexture();
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    const attribute = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const progressUniform = gl.getUniformLocation(program, "progress");
    let frame = 0;
    let disposed = false;
    let loaded = false;
    const started = performance.now();

    function draw() {
      if (disposed || !loaded || !gl || !canvas) return;
      const progress = isOpening ? Math.min((performance.now() - started) / RELEASE_MS, 1) : 0;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(progressUniform, progress);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
      canvas.dataset.progress = progress.toFixed(3);
    }
    function animate() {
      draw();
      if (!disposed && isOpening && performance.now() - started < RELEASE_MS) {
        frame = requestAnimationFrame(animate);
      }
    }
    const resize = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio));
      canvas.height = Math.max(1, Math.round(rect.height * ratio));
      draw();
    });
    resize.observe(canvas);
    const source = new window.Image();
    source.onload = () => {
      if (disposed) return;
      const cutout = document.createElement("canvas");
      cutout.width = 984;
      cutout.height = 1598;
      const ctx = cutout.getContext("2d");
      if (!ctx) return;
      const mask = new Path2D();
      GATE_FOLD_RIBBON_CONTOURS.forEach((path) => mask.addPath(new Path2D(path)));
      ctx.clip(mask);
      ctx.drawImage(source, 0, 0, 984, 1598);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cutout);
      loaded = true;
      setReady(true);
      animate();
    };
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(frame);
      setReady(false);
    };
    canvas.addEventListener("webglcontextlost", lost);
    source.src = art;
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      source.onload = null;
      canvas.removeEventListener("webglcontextlost", lost);
      gl.deleteTexture(texture);
      gl.deleteBuffer(vertexBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    };
  }, [art, isOpening]);

  return (
    <span className={styles.ribbonLayer} data-ribbon-renderer={ready ? "mesh" : "fallback"}>
      <canvas ref={canvasRef} className={styles.ribbonCanvas} style={{ visibility: ready ? "visible" : "hidden" }} />
      <svg className={styles.ribbonFallback} viewBox="30 86 925 1432" style={{ visibility: ready ? "hidden" : "visible" }}>
        <defs><clipPath id={`${id}-ribbon`}>
          {GATE_FOLD_RIBBON_CONTOURS.map((path) => <path key={path} d={path} />)}
        </clipPath></defs>
        <image href={art} width="984" height="1598" clipPath={`url(#${id}-ribbon)`} />
      </svg>
    </span>
  );
}
