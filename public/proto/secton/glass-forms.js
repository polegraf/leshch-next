import * as T from './three.module.js';
import {glassLight} from './glass-style.js?v=12';

export const chromeTradeFormCount = 7;

export function createGlassForm(time, trade, optics, chrome = false) {
  const opacity = {value: 0};
  const geometry = new T.PlaneGeometry(1, 1, chrome ? 224 : 152, chrome ? (trade ? 56 : 44) : 68);
  const material = {
    defines: {...(trade ? {TRADE_MORPH: 1} : {}), ...(chrome ? {CHROME_STUDY: 1} : {})},
    transparent: true,
    depthWrite: chrome,
    side: chrome ? T.FrontSide : T.DoubleSide,
    vertexShader: `
      uniform float uTime, uVeil;
      varying vec3 vNormal, vEye;
      const float TAU = 6.2831853072;

      #ifdef TRADE_MORPH
        uniform float uTradeStage, uToGlobe, uGlobeRadius;
        uniform vec2 uLiquidFit;
        uniform mat4 uGlobeView, uGlobeProjection;
        varying vec3 vGeography, vSphereNormal, vSphereEye;
      #endif

      vec2 rotate(vec2 p, float angle) {
        float c = cos(angle), s = sin(angle);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
      }

      #ifdef CHROME_STUDY
      vec3 braidedCenter(float u, float time, vec4 profile) {
        float drive = 3.0 * u + time * 0.78;
        float radius = profile.x + profile.y * cos(drive) + 0.061 * cos(u - time * 0.54);
        return vec3(radius * cos(2.0 * u), radius * sin(2.0 * u), profile.z * sin(drive));
      }

      #ifdef TRADE_MORPH
      // The last part of the meridian closes through the interior. That keeps both UV
      // edges joined when an open ribbon folds into a solid form or the globe.
      const float SHELL_MERIDIAN = 0.875;

      bool isLiquidStage(int stage) {
        return stage >= 3;
      }

      vec3 sphereAxis(float u, float latitude) {
        float pole = (1.0 - latitude) * 3.14159265;
        return vec3(sin(pole) * cos(u), sin(pole) * sin(u), cos(pole));
      }

      vec3 wrappedSphere(float u, float meridian) {
        float cycle = fract(meridian);
        if (cycle <= SHELL_MERIDIAN) return sphereAxis(u, cycle / SHELL_MERIDIAN);
        return vec3(0.0, 0.0, mix(1.0, -1.0, (cycle - SHELL_MERIDIAN) / (1.0 - SHELL_MERIDIAN)));
      }

      float liquidLobe(vec3 direction, vec3 axis, float focus) {
        return exp((dot(direction, normalize(axis)) - 1.0) * focus);
      }

      vec3 spreadLiquid(vec3 p, vec3 direction, float time, int stage) {
        float spread = 0.43 + 0.19 * float(stage - 3);
        float surge = sin(time * 2.1 + float(stage) * 0.81);
        float left = liquidLobe(direction, vec3(-0.94, -0.24, 0.18), 8.2);
        float right = liquidLobe(direction, vec3(0.92, 0.10, 0.27), 6.9);
        float lowerRim = liquidLobe(direction, vec3(0.18, -0.87, 0.46), 6.0);
        float width = stage == 4 ? 0.15 : 0.31;
        // As the body flattens, volume shifts into alternating lobes along the rim.
        p.x = p.x * (1.0 + width * spread)
            + spread * (right * (0.18 + 0.08 * surge) - left * (0.18 - 0.07 * surge));
        p.y = p.y * (1.0 - 0.45 * spread) - 0.075 * spread
            + spread * (0.068 * left - 0.054 * right + 0.11 * lowerRim * surge);
        p.z = p.z * (1.0 - 0.11 * spread)
            + spread * (left * (0.11 + 0.045 * surge) + right * (0.075 - 0.04 * surge) + 0.065 * lowerRim);
        return p;
      }

      vec3 moldLiquid(vec3 d, float time, int stage) {
        float phase = time * 0.56;
        vec3 p;
        if (stage == 6) {
          // Broad pear-shaped drop with a diagonal valley pressed into the front face.
          float belly = 1.0 - 0.20 * d.y + 0.075 * d.x * d.z;
          p = d * vec3(0.79 * belly, 0.93, 0.65 * belly);
          p.x += 0.13 * d.y * d.y + 0.09 * d.y;
          float bank = (0.71 * d.x + 0.65 * d.y + 0.19 * d.y * d.y + 0.12 * sin(phase)) / 0.24;
          float channel = exp(-bank * bank) * smoothstep(0.05, 0.80, d.z);
          p.z += 0.24 * liquidLobe(d, vec3(-0.47, -0.49, 0.78), 4.9);
          p.z += 0.19 * liquidLobe(d, vec3(0.49, 0.32, 0.85), 7.2) - 0.35 * channel;
          p.xy += channel * vec2(0.068, -0.047);
        } else if (stage == 3) {
          // Three soft droplets meet in one surface, leaving a pinched trough between them.
          float swell = 1.0 + 0.18 * (d.y * (3.0 * d.x * d.x - d.y * d.y)) - 0.060 * d.x * d.y;
          p = d * vec3(0.85 * swell, 0.83 * swell, 0.61);
          p.z += 0.30 * liquidLobe(d, vec3(-0.51, 0.37, 0.78), 9.5);
          p.z += 0.26 * liquidLobe(d, vec3(0.54, 0.31, 0.78), 10.7);
          p.z += (0.26 + 0.055 * sin(phase)) * liquidLobe(d, vec3(-0.10, -0.59, 0.82), 8.4);
          p.z -= 0.29 * liquidLobe(d, vec3(0.04, 0.09, 1.0), 15.0);
          p.x += 0.11 * d.y * d.z;
        } else if (stage == 4) {
          // Low, stretched drop with a second bulge gathered into one end.
          float span = 1.0 - 0.17 * d.x + 0.13 * d.x * d.y;
          p = d * vec3(1.01, 0.63 * span, 0.59 * span);
          p.y += 0.15 * d.x * d.x - 0.14 * d.x;
          p.z += 0.32 * liquidLobe(d, vec3(-0.46, -0.07, 0.89), 5.9);
          p.z += 0.21 * liquidLobe(d, vec3(0.58, 0.35, 0.72), 10.0);
          p.z -= 0.30 * liquidLobe(d, vec3(0.25, -0.06 + 0.09 * sin(phase), 1.0), 10.7);
        } else {
          // An inflated seed with a curved fold crossing its shoulder.
          p = d * vec3(0.78, 0.93, 0.69) * (1.0 + 0.13 * d.x * d.y - 0.11 * d.y);
          float bow = (d.y - 0.38 * d.x - 0.54 * d.x * d.x + 0.09 * sin(phase)) / 0.22;
          float fold = exp(-bow * bow) * smoothstep(0.13, 0.76, d.z);
          p.z += 0.26 * liquidLobe(d, vec3(-0.43, 0.33, 0.86), 5.2) - 0.34 * fold;
          p.z += 0.14 * liquidLobe(d, vec3(0.31, -0.70, 0.72), 10.0);
          p.y += 0.082 * fold;
        }
        p = spreadLiquid(p, d, time, stage);
        p.xy = rotate(p.xy, (stage == 4 ? 0.17 : -0.10) + 0.11 * sin(phase + float(stage)));
        p.xz = rotate(p.xz, -0.18 + 0.14 * sin(phase));
        p.yz = rotate(p.yz, 0.13 + 0.11 * cos(phase * 0.82));
        p *= 1.08;
        p.x = p.x * uLiquidFit.x + uLiquidFit.y;
        return p;
      }

      vec3 tradeLiquid(float u, float v, float time, int stage) {
        float cycle = fract(v / TAU);
        if (cycle <= SHELL_MERIDIAN) return moldLiquid(sphereAxis(u, cycle / SHELL_MERIDIAN), time, stage);
        vec3 nearPole = moldLiquid(vec3(0.0, 0.0, 1.0), time, stage);
        vec3 farPole = moldLiquid(vec3(0.0, 0.0, -1.0), time, stage);
        return mix(nearPole, farPole, (cycle - SHELL_MERIDIAN) / (1.0 - SHELL_MERIDIAN));
      }

      vec3 tradeCenter(float u, float time, int stage) {
        float drift = time * 0.53;
        if (stage == 1) {
          return vec3(0.90 * sin(u), 0.47 * sin(2.0 * u) + 0.10 * cos(u),
                      0.27 * cos(u) + 0.10 * sin(2.0 * u + drift));
        }
        float twist = u + 0.42 * sin(drift);
        float radius = 0.69 + 0.18 * cos(twist);
        return vec3(radius * cos(2.0 * u), 0.84 * radius * sin(2.0 * u), 0.36 * sin(twist));
      }

      vec3 tradeRibbon(float u, float v, float time, int stage) {
        vec3 center = tradeCenter(u, time, stage);
        vec3 tangent = normalize(tradeCenter(u + 0.006, time, stage) - tradeCenter(u - 0.006, time, stage));
        vec3 across = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
        vec3 up = cross(across, tangent);
        bool eight = stage == 1;
        float width = eight ? 0.18 + 0.038 * sin(u + time) : 0.159 + 0.035 * sin(2.0 * u + time);
        float thickness = eight ? 0.54 : 0.66;
        float twist = 0.97 * sin(2.0 * u + time * 0.41) + 0.29 * cos(u - time);
        vec2 profile = rotate(vec2(cos(v), thickness * sin(v)), twist);
        vec3 p = center + width * (across * profile.x + up * profile.y);
        p.xy = rotate(p.xy, (eight ? -0.29 : 0.15) + 0.20 * sin(time * 0.67 + float(stage)));
        p.yz = rotate(p.yz, -0.18 + 0.28 * sin(time * 0.72 + float(stage)));
        p.xz = rotate(p.xz, 0.25 + 0.26 * cos(time * 0.61 + float(stage)));
        return p;
      }
      #endif

      vec3 glassForm(float u, float v, float time, int stage) {
        #ifdef TRADE_MORPH
          if (isLiquidStage(stage)) return tradeLiquid(u, v, time, stage);
          if (stage > 0) return tradeRibbon(u, v, time, stage);
        #endif
        vec4 profile = vec4(0.66, 0.235, 0.32, 0.161);
        vec3 center = braidedCenter(u, time, profile);
        vec3 tangent = normalize(braidedCenter(u + 0.006, time, profile) - braidedCenter(u - 0.006, time, profile));
        vec3 across = normalize(cross(tangent, vec3(0.0, 0.0, 1.0)));
        vec3 up = cross(across, tangent);
        float twist = 0.66 * sin(3.0 * u - time * 0.53) + 0.25 * cos(u + time);
        vec2 section = rotate(vec2(cos(v), 0.69 * sin(v)), twist);
        float width = profile.w * (1.0 + 0.22 * sin(3.0 * u - time * 1.18) + 0.11 * sin(u + time));
        vec3 p = center + width * (across * section.x + up * section.y);
        p.y *= 1.0 + 0.12 * sin(float(stage) * 1.54);
        p.xy = rotate(p.xy, -0.26 + 0.30 * sin(time * 0.78));
        #ifdef TRADE_MORPH
          p.yz = rotate(p.yz, -0.23 + 0.21 * sin(time + float(stage)));
          p.xz = rotate(p.xz, 0.34 + 0.25 * cos(time * 0.72));
        #else
          p.yz = rotate(p.yz, -0.28 + 0.25 * sin(time * 0.82));
          p.xz = rotate(p.xz, -0.42 + 0.22 * cos(time * 0.59));
        #endif
        return p;
      }
      #else
      vec3 glassForm(float u, float v, float time, int stage) {
        vec4 profile = vec4(1.00, 1.03, 0.17, 0.24);
        if (stage == 1) profile = vec4(1.08, 0.85, 0.29, 0.22);
        if (stage == 2) profile = vec4(0.77, 1.14, 0.23, 0.20);
        if (stage == 3) profile = vec4(1.00, 1.00, 0.31, 0.28);
        float turn = u + 0.10 * sin(2.0 * u - 0.69 * time);
        float swell = sin(2.0 * u - 0.75 * time + float(stage) * 0.68);
        float curl = cos(3.0 * u + 0.94 * time - float(stage) * 0.53);
        float radius = 0.64 + 0.080 * swell + 0.061 * curl;
        float tube = profile.w + 0.049 * sin(u + 0.99 * time) + 0.031 * curl;
        float twist = v + 0.53 * sin(u + time) + 0.21 * swell;
        float width = radius + tube * cos(twist);
        vec3 p = vec3(width * cos(turn) * profile.x, width * sin(turn) * profile.y,
                      tube * sin(twist) * (0.82 - 0.19 * curl) + profile.z * swell * 1.13);
        p.xy = rotate(p.xy, -0.21 + 0.11 * float(stage) + 0.20 * sin(time * 0.48));
        p.yz = rotate(p.yz, 0.15 + 0.20 * sin(time * 0.63 + float(stage)));
        #ifdef TRADE_MORPH
          p.xz = rotate(p.xz, -0.13 + 0.31 * cos(time * 0.71 + float(stage) * 0.81));
        #else
          p.xz = rotate(p.xz, -0.46 + 0.19 * cos(time * 0.71));
        #endif
        if (uVeil > 0.5) {
          p.xy = rotate(p.xy, 0.91 + 0.24 * sin(time * 0.61));
          p.xz = rotate(p.xz, -0.36 + 0.20 * sin(time * 0.74));
          p = p * vec3(0.85, 0.84, 0.69) + vec3(0.13, -0.19, -0.28);
        }
        return p;
      }

      #endif

      vec3 surface(float u, float v, float time) {
        #ifdef TRADE_MORPH
          int stage = int(floor(uTradeStage));
          float blend = fract(uTradeStage);
          #ifdef CHROME_STUDY
            stage = stage % ${chromeTradeFormCount};
          #endif
          vec3 form = glassForm(u, v, time, stage);
          #ifdef CHROME_STUDY
            if (blend > 0.0) {
              int next = (stage + 1) % ${chromeTradeFormCount};
              form = mix(form, glassForm(u, v, time, next), blend);
              if (!isLiquidStage(stage) || !isLiquidStage(next)) {
                form.z += 0.16 * sin(3.14159265 * blend) * (sin(u + time) + 0.34 * cos(3.0 * u));
              }
            }
          #else
            if (blend > 0.001) form = mix(form, glassForm(u, v, time, (stage + 1) % 4), blend);
          #endif
          return form;
        #else
          return glassForm(u, v, time, 0);
        #endif
      }

      void main() {
        float u = uv.x * TAU, v = uv.y * TAU;
        float time = uTime * 0.32 + uVeil * 1.62;
        vec3 p = surface(u, v, time);
        float normalV = v;
        #if defined(CHROME_STUDY) && defined(TRADE_MORPH)
          int stage = int(floor(uTradeStage)) % ${chromeTradeFormCount};
          int next = (stage + 1) % ${chromeTradeFormCount};
          bool closed = isLiquidStage(stage) && (fract(uTradeStage) == 0.0 || isLiquidStage(next));
          if (closed && uv.y <= SHELL_MERIDIAN) {
            // Differentiate on the visible shell, just inside its poles.
            normalV = clamp(v, 0.006, TAU * SHELL_MERIDIAN - 0.006);
          }
        #endif
        vec3 du = surface(u + 0.005, normalV, time) - surface(u - 0.005, normalV, time);
        vec3 dv = surface(u, normalV + 0.005, time) - surface(u, normalV - 0.005, time);
        vec4 view = modelViewMatrix * vec4(p * 24.0, 1.0);
        vec3 surfaceNormal = cross(du, dv);
        if (dot(surfaceNormal, surfaceNormal) < 1e-12) surfaceNormal = p;
        vNormal = normalize(normalMatrix * surfaceNormal);
        vEye = -view.xyz;
        gl_Position = projectionMatrix * view;

        #ifdef TRADE_MORPH
          vEye = vec3(0.0, 0.0, 1.0);
          vGeography = vSphereNormal = vSphereEye = vec3(0.0, 0.0, 1.0);
          if (uToGlobe > 0.0) {
            #ifdef CHROME_STUDY
              vec3 globePoint = wrappedSphere(u, uv.y);
            #else
              float pole = (1.0 - uv.y) * 3.14159265;
              vec3 globePoint = vec3(sin(pole) * cos(u), sin(pole) * sin(u), cos(pole));
            #endif
            vec3 globeNormal = normalize(globePoint + vec3(1e-7));
            vGeography = normalize(transpose(mat3(uGlobeView)) * globeNormal);
            vec4 sphereView = uGlobeView * vec4(vGeography * (length(globePoint) * uGlobeRadius), 1.0);
            vec4 sphereClip = uGlobeProjection * sphereView;
            vSphereNormal = globeNormal;
            vSphereEye = -sphereView.xyz;
            gl_Position = mix(gl_Position, sphereClip / sphereClip.w, uToGlobe);
            vNormal = mix(vNormal, globeNormal, uToGlobe);
          }
        #endif
      }
    `,
    fragmentShader: `
      uniform float uTime, uOpacity, uVeil;
      varying vec3 vNormal, vEye;
      ${glassLight}
      #ifdef TRADE_MORPH
        uniform float uToGlobe, uGlobeTime;
        #ifdef CHROME_STUDY
          uniform float uMercuryBlend;
        #endif
        uniform sampler2D uGlobeCoast;
        varying vec3 vGeography, vSphereNormal, vSphereEye;
      #endif
      void main() {
        if (uOpacity < 0.002) discard;
        vec3 normal = normalize(vNormal + vec3(1e-7));
        vec3 eye = normalize(vEye);
        normal = faceforward(normal, -eye, normal);
        vec4 glass = shadeGlass(normal, eye, uTime + uVeil * 5.1, 1.0);
        float rim = glassRim(normal, eye);
        #ifndef CHROME_STUDY
          glass.a *= (gl_FrontFacing ? 1.0 : 0.39) * (1.0 - 0.42 * uVeil) * (0.81 + 0.19 * rim);
        #endif
        #ifndef TRADE_MORPH
          float aspect = uGlassSize.x / uGlassSize.y;
          float compactCopy = smoothstep(0.71, 0.84, aspect) * (1.0 - smoothstep(1.10, 1.31, aspect));
          float copyMask = smoothstep(0.43, 0.60, gl_FragCoord.x / uGlassSize.x);
          #ifdef CHROME_STUDY
            glass.a *= mix(1.0, 0.70 + 0.30 * copyMask, compactCopy);
          #else
            glass.a *= mix(1.0, 0.39 + 0.61 * copyMask, compactCopy);
          #endif
        #endif
        #ifdef TRADE_MORPH
          if (uVeil > 0.5) {
            glass.a *= 1.0 - smoothstep(0.05, 0.55, uToGlobe);
            if (glass.a < 0.002) discard;
          }
          float geography = smoothstep(0.45, 0.93, uToGlobe);
          if (geography > 0.0) {
            vec3 direction = normalize(vGeography);
            vec2 coast = vec2(atan(-direction.z, direction.x) / 6.2831853072 + 0.5,
                              asin(clamp(direction.y, -1.0, 1.0)) / 3.14159265 + 0.5);
            vec3 sphereEye = normalize(vSphereEye), sphereNormal = normalize(vSphereNormal);
            vec4 globe = shadeGlassGlobe(sphereNormal, sphereEye, direction, texture2D(uGlobeCoast, coast), uGlobeTime);
            globe.a *= smoothstep(-0.04, 0.018, dot(sphereNormal, sphereEye));
            glass = mix(glass, globe, geography);
          }
        #endif
        #if defined(CHROME_STUDY) && defined(TRADE_MORPH)
          glass.a *= 1.0 - uMercuryBlend;
        #endif
        gl_FragColor = vec4(glass.rgb, glass.a * uOpacity);
      }
    `
  };
  const object = new T.Group();
  object.renderOrder = 2;
  for (const layer of chrome ? [0] : [1, 0]) {
    const surface = new T.Mesh(geometry, new T.ShaderMaterial({
      ...material,
      uniforms: {uTime: time, uOpacity: opacity, uVeil: {value: layer}, ...trade, ...optics}
    }));
    surface.frustumCulled = false;
    surface.renderOrder = layer ? 2 : 3;
    object.add(surface);
  }
  return {object, opacity};
}
