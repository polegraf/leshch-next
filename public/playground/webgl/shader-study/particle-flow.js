import * as T from '../three.module.js';
import {geographicFilm, particleLook} from './shader-style.js?v=32';

export function createParticleFlow(time, pixelScale, trade = null) {
  const ribbons = 6;
  const length = 360;
  const width = 36;
  const samples = new Float32Array(ribbons * length * width * 3);
  let offset = 0;
  for (let ribbon = 0; ribbon < ribbons; ribbon++) {
    for (let row = 0; row < width; row++) {
      for (let column = 0; column < length; column++) {
        samples[offset++] = (column + 0.46 * (row % 2)) * Math.PI * 2 / length;
        samples[offset++] = row * 2 / (width - 1) - 1;
        samples[offset++] = ribbon;
      }
    }
  }

  const geometry = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(samples, 3));
  const opacity = {value: 0};
  const material = new T.ShaderMaterial({
    defines: trade ? {TRADE_MORPH: 1} : {},
    uniforms: {
      uTime: time, uPixelScale: pixelScale, uOpacity: opacity,
      ...trade
    },
    transparent: true,
    blending: T.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform float uTime, uPixelScale, uOpacity;
      varying vec3 vColor;
      varying float vOpacity;
      ${particleLook}

      vec2 rotate(vec2 p, float angle) {
        float c = cos(angle), s = sin(angle);
        return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
      }

      vec3 sheet(float u, float v, float layer, float time) {
        float shell = 1.0 - step(0.5, layer);
        float accent = step(3.5, layer);
        float phase = layer * 1.89;
        // The points follow material coordinates on overlapping curved membranes.
        float azimuth = u + 0.26 * sin(v * 2.1 + time + phase) + 0.13 * sin(u * 2.0 - time);
        float latitude = v * mix(0.39, 1.28, shell);
        latitude += (1.0 - shell) * (0.28 * sin(2.0 * u - time + phase)
                  + 0.115 * sin(3.0 * u + 2.0 * time + phase));
        latitude += (0.060 + 0.063 * accent) * sin(2.8 * v + 3.0 * u - time + phase);
        float pinch = sin(3.4 * v - 2.0 * u + time + phase);
        float wave = 0.063 * sin(4.0 * u - time + phase + 3.1 * v) + 0.054 * pinch;
        float tip = pow(0.5 + 0.5 * sin(3.0 * u + time + phase), 5.0) * smoothstep(0.0, 0.95, abs(v));
        float radius = 0.78 + 0.057 * shell + 0.054 * accent + wave * (1.0 - 0.57 * shell)
                     + tip * accent * 0.20;
        vec3 p = radius * vec3(cos(azimuth) * cos(latitude), sin(latitude), sin(azimuth) * cos(latitude));
        p.yz = rotate(p.yz, layer * 0.56 + 0.18 * sin(time + phase));
        p.xy = rotate(p.xy, layer * 0.72 + 0.17 * cos(time + phase));
        p.xz = rotate(p.xz, 0.24 * sin(time + phase) + 0.17 * layer);
        return p * vec3(0.93, 1.11, 1.0);
      }

      #ifdef TRADE_MORPH
        uniform float uTradeStage, uToGlobe, uGlobeRadius, uGlobeTime;
        uniform mat4 uGlobeView, uGlobeProjection;
        uniform sampler2D uGlobeCoast;
        ${geographicFilm}

        vec3 tradeForm(float u, float v, float layer, float t, int stage) {
          if (stage == 0) return sheet(u, v, layer, t);
          float phase = layer * 1.89;
          float shell = 1.0 - step(0.5, layer);
          if (stage == 1) {
            float twist = 2.0 * u + phase + mix(0.77, 2.90, shell) * v - 0.40 * t;
            float tube = 0.185 + 0.035 * sin(3.0 * u - t + phase);
            float ring = 0.72 + tube * cos(twist) + 0.075 * cos(3.0 * u + 0.45 * t);
            vec3 p = vec3(ring * cos(u), 0.93 * ring * sin(u), tube * sin(twist));
            p.z += 0.23 * sin(2.0 * u + 0.42 * t);
            p.yz = rotate(p.yz, 0.46 + 0.12 * sin(t));
            p.xz = rotate(p.xz, -0.28 + 0.16 * cos(t));
            return p;
          }
          if (stage == 2) {
            float turn = u + 2.20 * v + 0.35 * sin(phase + t);
            float wake = sin(3.0 * turn - 4.7 * v + 0.66 * t + phase);
            float width = sqrt(max(0.015, 1.0 - v * v));
            float radius = width * (0.27 + 0.12 * wake + 0.07 * shell);
            vec3 p = vec3(radius * cos(turn) + 0.20 * sin(2.8 * v - 0.42 * t),
                          1.03 * v + 0.062 * width * wake, radius * sin(turn));
            p.xy = rotate(p.xy, -0.63 + 0.11 * sin(t));
            return p;
          }
          float leaf = 0.5 + 0.5 * cos(4.0 * u + 0.41 * sin(u * 3.0 + phase) + t * 0.46);
          float spread = (v + 1.0) * 0.5;
          float angle = u + 0.18 * v * sin(u * 2.0 + phase - t);
          float radius = mix(0.085, 1.04, spread) * (0.67 + 0.39 * leaf * leaf);
          float curl = sin(u * 2.0 + 4.2 * spread - 0.64 * t + phase);
          vec3 p = vec3(radius * cos(angle), 0.86 * radius * sin(angle),
                        0.19 - 0.37 * spread + (0.14 + 0.28 * leaf) * spread * curl);
          p.yz = rotate(p.yz, -0.32 + 0.12 * sin(t));
          return p;
        }
      #endif

      vec3 surface(float u, float v, float layer, float t) {
        #ifdef TRADE_MORPH
          int stage = int(floor(uTradeStage));
          float blend = fract(uTradeStage);
          vec3 from = tradeForm(u, v, layer, t, stage);
          if (blend < 0.001) return from;
          return mix(from, tradeForm(u, v, layer, t, (stage + 1) % 4), blend);
        #else
          return sheet(u, v, layer, t);
        #endif
      }

      void main() {
        float u = position.x, v = position.y, layer = position.z;
        float t = uTime * 6.2831853 / 24.0;
        vec3 p = surface(u, v, layer, t);
        vec3 du = surface(u + 0.011, v, layer, t) - p;
        vec3 dv = surface(u, v + 0.012, layer, t) - p;
        vec4 view = modelViewMatrix * vec4(p * 24.0, 1.0);
        vec3 tangentArea = cross(du, dv);
        vec3 normal = normalize(normalMatrix * tangentArea + vec3(1e-8));
        float face = abs(dot(normal, normalize(-view.xyz)));
        #ifdef TRADE_MORPH
          face = abs(normal.z);
        #endif
        float caustic = pow(1.0 - face, 3.2);
        float compressed = 1.0 - smoothstep(0.12, 0.54, length(tangentArea) / (0.011 * 0.012));
        float crest = clamp(0.37 + 0.57 * caustic + 0.12 * compressed, 0.0, 1.0);
        float edge = 1.0 - smoothstep(0.70, 1.0, abs(v));
        if (layer < 0.5) {
          vColor = mix(vec3(0.009, 0.037, 0.72), vec3(0.018, 0.19, 1.0), caustic);
          vOpacity = (0.064 + caustic * 0.43) * edge;
        } else if (layer < 3.5) {
          vColor = particleInk(caustic, crest);
          vOpacity = (0.12 + 0.57 * caustic + 0.12 * compressed) * (0.25 + 0.75 * edge);
        } else {
          float fleck = pow(0.5 + 0.5 * sin(u * 3.0 + t + layer * 1.89), 3.0);
          vColor = mix(vec3(0.027, 0.10, 0.97), vec3(0.30, 0.30, 1.0), fleck);
          vOpacity = (0.036 + 0.27 * caustic + 0.19 * fleck) * (0.18 + 0.82 * edge);
        }
        vOpacity *= uOpacity;
        gl_Position = projectionMatrix * view;
        gl_PointSize = clamp((0.105 + 0.052 * caustic) * uPixelScale * projectionMatrix[1][1] / max(-view.z, 1.0), 1.04, 3.1);
        #ifdef TRADE_MORPH
          gl_PointSize = clamp((1.00 + 0.58 * caustic) * uPixelScale * projectionMatrix[1][1], 1.0, 2.8);
          if (uToGlobe > 0.0) {
            // Interleave the six ribbons into consecutive rows on one spherical surface.
            float latitude = (0.966 * v + (layer - 2.5) * 0.0092) * 1.5707963;
            float longitude = -u + (layer - 2.5) * 0.004;
            vec3 direction = vec3(cos(longitude) * cos(latitude), sin(latitude), -sin(longitude) * cos(latitude));
            vec4 sphereView = uGlobeView * vec4(direction * uGlobeRadius, 1.0);
            vec4 sphereClip = uGlobeProjection * sphereView;
            gl_Position = mix(gl_Position, sphereClip / sphereClip.w, uToGlobe);

            vec2 coastUV = vec2(fract(0.5 + longitude / 6.2831853), 0.5 + latitude / 3.14159265);
            float land = smoothstep(0.43, 0.66, texture2D(uGlobeCoast, coastUV).r);
            vec3 outward = normalize(mat3(uGlobeView) * direction);
            float facing = dot(outward, normalize(-sphereView.xyz));
            float front = smoothstep(0.035, 0.38, facing);
            float daylight = smoothstep(-0.54, 0.94, dot(outward, vec3(-0.57, 0.62, 0.54)));
            float territory = smoothstep(0.48, 0.94, uToGlobe);
            vec2 ribbons = geographicFoldRims(geographicFoldPhase(direction * uGlobeRadius, uGlobeTime));
            vec3 sea = mix(vec3(0.04, 0.10, 0.42), vec3(0.10, 0.46, 0.90), daylight);
            sea = mix(sea, vec3(0.14, 0.30, 0.95), 0.45 * ribbons.y);
            vec3 ground = mix(vec3(0.03, 0.27, 0.47), vec3(0.12, 0.68, 0.93), daylight);
            ground = mix(ground, vec3(0.42, 0.95, 1.0), 0.55 * ribbons.x);
            vColor = mix(vColor, mix(sea, ground, land), territory);
            float sphereOpacity = (mix(0.22, 0.38, land) + 0.36 * ribbons.x) * (0.66 + 0.40 * daylight) * front;
            vOpacity = mix(vOpacity, sphereOpacity * uOpacity, territory);
            gl_PointSize *= mix(1.0, mix(0.88, 1.12, land), territory);
          }
        #endif
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        float radius = length(gl_PointCoord - 0.5);
        float core = 1.0 - smoothstep(0.17, 0.47, radius);
        float halo = 1.0 - smoothstep(0.22, 0.5, radius);
        gl_FragColor = vec4(vColor, (0.86 * core + 0.14 * halo) * vOpacity);
      }
    `
  });
  const points = new T.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;
  return {points, opacity};
}

export function createTradeMorph(copy, pixelScale, screenCenter) {
  const panel = document.createElement('aside');
  panel.className = 'trade-morph';
  panel.setAttribute('aria-labelledby', 'tradeMorphTitle');
  panel.setAttribute('aria-hidden', 'true');
  const content = document.createElement('div');
  const title = copy.querySelector('h2').cloneNode(true);
  title.id = 'tradeMorphTitle';
  content.append(title, copy.querySelector('.intro').cloneNode(true));
  const viewport = document.createElement('div');
  viewport.className = 'trade-morph-viewport';
  panel.append(content, viewport);
  document.body.append(panel);

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
  camera.position.z = 400;
  const clock = {value: 0};
  const trade = {
    uTradeStage: {value: 0}, uToGlobe: {value: 0}, uGlobeRadius: {value: 1},
    uGlobeView: {value: new T.Matrix4()}, uGlobeProjection: {value: new T.Matrix4()},
    uGlobeCoast: {value: null}, uGlobeTime: {value: 0}
  };
  const {points, opacity} = createParticleFlow(clock, pixelScale, trade);
  scene.add(points);

  let needsLayout = true;
  function layout() {
    const w = window.innerWidth, h = window.innerHeight;
    const {width, height} = viewport.getBoundingClientRect();
    camera.left = -w * 0.5;
    camera.right = w * 0.5;
    camera.top = h * 0.5;
    camera.bottom = -h * 0.5;
    camera.updateProjectionMatrix();
    const x = screenCenter.x * w, y = screenCenter.y * h;
    const edge = Math.min(x, w - x, y, h - y);
    const diameter = Math.max(1, 2 * (edge - 16));
    points.position.set(x - w * 0.5, y - h * 0.5, 0);
    points.scale.setScalar(Math.min(width, height, diameter) / 52);
    needsLayout = false;
  }
  const observer = new ResizeObserver(() => { needsLayout = true; });
  observer.observe(viewport);
  window.addEventListener('resize', () => { needsLayout = true; });

  let visible = false, copyVisible = false;
  let previousTime = 0;
  function update(amount, copyAmount, toGlobe, time) {
    const showingCopy = copyAmount > 0.002;
    if (showingCopy !== copyVisible) {
      copyVisible = showingCopy;
      panel.classList.toggle('visible', showingCopy);
      panel.setAttribute('aria-hidden', String(!showingCopy));
      document.body.classList.toggle('trade-morph-open', showingCopy);
    }
    const showing = amount > 0.002;
    if (showing && !visible) {
      clock.value = 0;
      previousTime = time;
    }
    visible = showing;
    if (!visible) return;
    if (needsLayout) layout();
    panel.style.opacity = String(copyAmount);
    opacity.value = amount;
    clock.value += (time - previousTime) * (1 - T.MathUtils.smoothstep(toGlobe, 0.0, 0.52));
    previousTime = time;
    const phase = clock.value / 5.2;
    trade.uTradeStage.value = Math.floor(phase) % 4 + T.MathUtils.smoothstep(phase % 1, 0.42, 1);
    trade.uToGlobe.value = toGlobe;
    trade.uGlobeTime.value = time;
    points.rotation.y = 0.22 * Math.sin(clock.value * 0.24);
  }

  function alignGlobe(viewCamera, earth, radius) {
    if (!visible || trade.uToGlobe.value <= 0) return;
    trade.uGlobeView.value.multiplyMatrices(viewCamera.matrixWorldInverse, earth.matrixWorld);
    trade.uGlobeProjection.value.copy(viewCamera.projectionMatrix);
    trade.uGlobeRadius.value = radius;
  }

  function draw(renderer) {
    if (!visible) return;
    const autoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear = autoClear;
  }

  return {update, draw, alignGlobe, setGlobeCoast: field => { trade.uGlobeCoast.value = field; }};
}
