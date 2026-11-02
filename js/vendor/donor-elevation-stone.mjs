/* STONE — donor-derived block (Sculpture phase A). TEMPORARY: proven by scripts/qa/hybrid-elevation-stone-proof.cjs,
   sculpted into js/presentation-elevation-hybrid.js and removed in phase E (CLEAN). Never loaded by the product.
   Source: Sam1983Aing/flat-to-3d @ d7b9b69753d3af679535ee56695a05c8d955c3c6, 07-sunlit-elevation/engine/elevation.js:
   GLSL_COMMON (verbatim), mat() onBeforeCompile pieces (verbatim strings): world position/normal varyings
   (#include <worldpos_vertex> replacement), shadow-mask include, reveal/discard at main(), and the paper + shadow-derived
   hatch + registered sweep + front band composite (#include <dithering_fragment> replacement). Only the material-kind
   defines are fixed (KIND 0 = plain, FAINT 0, REAL_ONLY 0, DRAW_ONLY 0): brick/zinc/wood branches compile out.

   MIT License — Copyright (c) 2026 Samnang Aing
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
   documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
   persons to whom the Software is furnished to do so, subject to the following conditions:
   The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
   Software.
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
   WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
   COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
export const GLSL_COMMON = /* glsl */`
  uniform vec3 uSun; uniform vec4 uSweep; uniform float uReal;
  uniform vec3 uPaper; uniform vec3 uInk; uniform vec3 uAccent; uniform float uHatch; uniform float uLinePx;
  uniform float uDraw; uniform vec2 uDrawSpan; uniform vec2 uDrawDir; uniform float uHatchIn; uniform vec2 uWipe; uniform float uDetailIn; uniform float uDepthCue;
  float sweepS(vec3 p) { return dot(p.xy, uSweep.xy); }
  float revealAt(vec3 p) {
    float s = sweepS(p);
    return clamp(uReal + 1.0 - smoothstep(uSweep.z - uSweep.w, uSweep.z + uSweep.w, s), 0.0, 1.0);
  }
  float lineAt(float c, float period, float px) {
    float t = c / period, fw = max(fwidth(t), 1e-5);
    float d = abs(fract(t) - 0.5);
    float hw = 0.5 * px * fw;
    return 1.0 - smoothstep(hw, hw + fw, 0.5 - d);
  }
  float lineFade(float c, float period, float minPx) {
    float px = period / max(fwidth(c), 1e-5);
    return smoothstep(minPx, minPx * 1.8, px);
  }
  float frontBand(vec3 p) {
    float bandOn = step(-35.0, uSweep.z) * (1.0 - step(35.0, uSweep.z)) * (1.0 - uReal);
    float sd = sweepS(p) - uSweep.z;
    float w = max(uSweep.w, 0.45);
    float laser = exp(-pow(sd / (w * 0.11), 2.0));
    float halo = exp(-pow(sd / (w * 0.55), 2.0)) * 0.34;
    float gridEnv = exp(-pow(sd / (w * 1.08), 2.0));
    float gx = lineAt(p.x, 0.5, uLinePx * 0.85);
    float gy = lineAt(p.y, 0.5, uLinePx * 0.85);
    float gz = lineAt(p.z, 0.25, uLinePx * 0.8);
    float grid = max(max(gx, gy) * 0.65, gz * 0.55) * gridEnv;
    return clamp(laser + halo + grid, 0.0, 1.0) * bandOn;
  }
  // the hatching pours in along the light, from the upper left
  float hatchWipe(vec3 p) {
    float ns = clamp((dot(p.xy, vec2(0.7071, -0.7071)) - uWipe.x) / (uWipe.y - uWipe.x), 0.0, 1.0);
    return clamp((uHatchIn * 1.3 - ns) / 0.3, 0.0, 1.0);
  }
  // courses and joints are laid in the same order as the lines were drawn
  float detailWipe(vec3 p) {
    float hn = clamp((dot(p.xy, uDrawDir) - uDrawSpan.x) / (uDrawSpan.y - uDrawSpan.x), 0.0, 1.0);
    return clamp((uDetailIn * 1.25 - hn) / 0.25, 0.0, 1.0);
  }
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y); }
  vec2 planeUV(vec3 p, vec3 n) {
    vec3 a = abs(n);
    if (a.y > 0.7) return p.xz;
    return a.x > a.z ? vec2(p.z, p.y) : vec2(p.x, p.y);
  }
`;
export const VERT = `#include <worldpos_vertex>
        vec4 wpp = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          wpp = instanceMatrix * wpp;
        #endif
        vWP = (modelMatrix * wpp).xyz;
        vWN = normalize(mat3(modelMatrix) * objectNormal);`;
export const MAIN = `void main() {
            float rv = revealAt(vWP);
            #if REAL_ONLY
              if (rv < 0.5) discard;
            #endif
            #if DRAW_ONLY
              if (rv > 0.5 || uHatchIn < 0.02) discard;
            #endif`;
export const DITHER = `#include <dithering_fragment>
            {
              vec3 N = normalize(vWN);
              float ndl = dot(N, uSun);
              float lit = getShadowMask() * smoothstep(-0.02, 0.06, ndl);
              float shade = 1.0 - lit;
              vec2 q = planeUV(vWP, N);
              vec3 col = uPaper;
              float hw = hatchWipe(vWP) * step(0.001, uHatchIn);
              #if KIND == 3
                col *= mix(1.0, 0.955, hw);
              #endif
              #if KIND == 7
                shade = 0.0;
              #endif
              // depth cue: what sits back gets a little grey, so the relief reads before the lens moves
              col *= 1.0 - uDepthCue * 0.11 * smoothstep(0.0, -1.1, vWP.z) * (FAINT == 1 ? 0.4 : 1.0);
              float hatchK = FAINT == 1 ? 0.18 : 0.85;
              float hl = lineAt(q.x + q.y, uHatch, uLinePx * 0.95);
              float dense = 1.0 - lineFade(q.x + q.y, uHatch, 3.5);
              hl = mix(hl, 0.32, dense);
              col = mix(col, col * 0.93, shade * hw * (FAINT == 1 ? 0.3 : 1.0));
              col = mix(col, uInk, hl * shade * hatchK * hw);
              float det = detailWipe(vWP) * (FAINT == 1 ? 0.3 : 1.0);
              #if KIND == 1
                if (abs(N.y) < 0.7) {
                  float c4 = lineAt(q.y, 0.3, uLinePx * 0.7) * lineFade(q.y, 0.3, 5.0);
                  float c1 = lineAt(q.y, 0.075, uLinePx * 0.6) * lineFade(q.y, 0.075, 7.0);
                  float crs = floor(q.y / 0.075);
                  float c2 = lineAt(q.x + mod(crs, 2.0) * 0.1125, 0.225, uLinePx * 0.6) * lineFade(q.y, 0.075, 9.0);
                  col = mix(col, uInk, max(max(c4 * 0.22, c1 * 0.2), c2 * 0.16) * det);
                }
              #elif KIND == 4
                col = mix(col, uInk, lineAt(q.x, 0.43, uLinePx * 0.7) * 0.3 * lineFade(q.x, 0.43, 5.0) * det);
              #elif KIND == 5 || KIND == 11
                col = mix(col, uInk, lineAt(q.x, 0.095, uLinePx * 0.6) * 0.25 * lineFade(q.x, 0.095, 5.0) * det);
              #elif KIND == 6
                vec2 g6 = vec2(lineAt(q.x, 0.6, uLinePx * 0.6), lineAt(q.y, 0.6, uLinePx * 0.6));
                col = mix(col, uInk, max(g6.x, g6.y) * 0.12 * lineFade(q.x, 0.6, 6.0) * det);
              #endif
              gl_FragColor.rgb = mix(col, gl_FragColor.rgb, rv);
              #if KIND != 7
                float fb = frontBand(vWP);
                vec3 scanCol = mix(uAccent, vec3(1.0, 0.55, 0.18), smoothstep(0.42, 0.92, fb));
                gl_FragColor.rgb = mix(gl_FragColor.rgb, scanCol, clamp(fb * 0.85, 0.0, 0.94));
              #endif
            }`;
// Donor mat() wiring with the four strings above (structure of elevation.js mat(); brick/normal/ao replacements omitted).
export function applyStone(m, U) {
  const K = 0, faint = 0, realOnly = 0, drawOnly = 0;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = 'varying vec3 vWP; varying vec3 vWN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', VERT);
    sh.fragmentShader = `#define KIND ${K}\n#define FAINT ${faint}\n#define REAL_ONLY ${realOnly}\n#define DRAW_ONLY ${drawOnly}\nvarying vec3 vWP; varying vec3 vWN; uniform float uBump;\n${GLSL_COMMON}` + sh.fragmentShader
      .replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>')
      .replace('void main() {', MAIN)
      .replace('#include <dithering_fragment>', DITHER);
  };
  m.customProgramCacheKey = () => `elev-${K}-${faint}-${realOnly}-${drawOnly}`;
  return m;
}
