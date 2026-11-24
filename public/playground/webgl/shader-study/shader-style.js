import * as T from '../three.module.js';

const dotMask = `
float roundPoint() {
  float distanceToCenter = length(gl_PointCoord - 0.5);
  return 1.0 - smoothstep(0.23, 0.48, distanceToCenter);
}`;

export const waterRamp = `
vec3 waterColor(float height) {
  vec3 violet = vec3(0.035, 0.105, 0.44);
  vec3 cobalt = vec3(0.082, 0.32, 0.83);
  vec3 crest = vec3(0.12, 0.53, 0.95);
  vec3 color = mix(violet, cobalt, smoothstep(0.04, 0.61, height));
  return mix(color, crest, smoothstep(0.49, 1.0, height));
}`;

export const particleLook = `
  vec3 particleInk(float light, float wave) {
    vec3 violet = vec3(0.13, 0.11, 0.80);
    vec3 blue = vec3(0.018, 0.086, 0.90);
    vec3 cyan = vec3(0.052, 0.79, 1.0);
    vec3 color = mix(blue, violet, (1.0 - smoothstep(0.04, 0.30, wave)) * 0.32);
    color = mix(color, cyan, smoothstep(0.38, 0.96, wave));
    return mix(color, vec3(0.45, 0.96, 1.0), smoothstep(0.58, 1.0, light) * smoothstep(0.56, 0.96, wave) * 0.54);
  }

  vec3 particleCoordinates(vec3 point, float time) {
    // Composed shears carry the lattice through the same folds that light it.
    point.x += 1.32 * sin(point.y * 0.32 + point.z * 0.19 - time * 0.68);
    point.y += 0.80 * sin(point.x * 0.21 - point.z * 0.38 + time * 0.49);
    point.z += 1.07 * sin(point.x * 0.14 + point.y * 0.25 - time * 0.57);
    return point;
  }

  float particleCrests(vec3 film, float time) {
    float curl = sin(film.y * 0.34 + film.z * 0.25 + time * 0.43);
    float drift = sin(film.x * 0.082 - film.z * 0.21 - time * 0.31);
    return 0.5 + 0.5 * sin(film.x * 0.15 + film.y * 0.29 + film.z * 0.18 + 1.22 * curl + 0.60 * drift - time * 0.66);
  }

  float particleWave(vec3 point, float time) {
    return particleCrests(particleCoordinates(point, time), time);
  }
`;

export const equipmentPalette = `
vec3 equipmentBlue(float light, float wave) {
  float highlight = smoothstep(0.25, 0.96, wave);
  vec3 blue = mix(vec3(0.036, 0.19, 0.48), vec3(0.068, 0.65, 0.92), 0.23 * light + 0.77 * highlight);
  return mix(blue, vec3(0.37, 0.90, 1.0), smoothstep(0.52, 0.98, light) * (0.17 + 0.50 * highlight));
}`;

export const radarSweep = `
const float radarTurn = 6.2831853;
const float radarStart = 1.5707963;

vec2 radarPoint(vec2 uv, vec2 center, float aspect) {
  return (uv - center) * vec2(aspect, 1.0);
}

float radarSweepAngle(float phase) {
  return radarTurn * smoothstep(0.08, 0.90, phase);
}

float radarBearing(vec2 point) {
  return mod(radarStart - atan(point.y, point.x + 0.000001) + radarTurn, radarTurn);
}

float radarSweepAge(float sweep, float bearing) {
  return mod(sweep - bearing + radarTurn, radarTurn);
}

float radarFreshTrace(float age, float sweep) {
  return (1.0 - smoothstep(0.008, 0.145, age)) * step(age, sweep + 0.001);
}

float radarWakeWeight(float age, float sweep) {
  float trail = smoothstep(0.045, 0.13, age) * (1.0 - smoothstep(0.83, 1.57, age));
  return trail * exp(-1.65 * age) * step(age, sweep);
}
`;

export const radarTransition = `
${radarSweep}

float radarStroke(float distance, float width) {
  float aa = clamp(fwidth(distance), 0.00035, 0.0035);
  return 1.0 - smoothstep(width, width + aa, abs(distance));
}

float radarExposure(vec2 point, float sweep, float phase, float aspect) {
  float bearing = radarBearing(point);
  float scanned = 1.0 - smoothstep(sweep - 0.20, sweep, bearing);
  float reach = mix(0.16, 0.65 + 0.56 * aspect, smoothstep(0.11, 0.91, phase));
  float echo = 1.0 - smoothstep(reach - 0.075, reach + 0.05, length(point));
  return mix(scanned * echo, 1.0, smoothstep(0.81, 0.99, phase));
}

vec3 radarLight(vec2 point, float sweep, float size) {
  float radius = length(point);
  float bearing = radarBearing(point);
  vec2 marks = (fract(point / 0.047 + 0.5) - 0.5) * 0.047;
  float grid = max(radarStroke(marks.x, 0.00018), radarStroke(marks.y, 0.00018));
  float ringSpacing = size * 0.25;
  float ring = (fract(radius / ringSpacing + 0.5) - 0.5) * ringSpacing;
  float rings = radarStroke(ring, 0.00046);
  float rim = radarStroke(radius - size, 0.00089);
  float tick = (fract(bearing * (72.0 / radarTurn) + 0.5) - 0.5) * size * radarTurn / 72.0;
  float tenth = abs(fract(bearing * (36.0 / radarTurn) + 0.5) - 0.5);
  float major = 1.0 - smoothstep(0.045, 0.15, abs(fract(bearing * (12.0 / radarTurn) + 0.5) - 0.5));
  float lengthTick = 0.005 + 0.004 * (1.0 - smoothstep(0.05, 0.2, tenth)) + 0.008 * major;
  float ticks = radarStroke(tick, 0.00052) * step(size - lengthTick, radius) * step(radius, size);
  float scope = 1.0 - smoothstep(size - 0.001, size + 0.011, radius);

  float angle = radarStart - sweep;
  vec2 direction = vec2(cos(angle), sin(angle));
  float along = dot(point, direction);
  float away = dot(point, vec2(-direction.y, direction.x));
  float behind = radarSweepAge(sweep, bearing);
  float trail = exp(-behind * 3.9) * scope;
  float shaft = radarStroke(away, 0.00085) * step(0.0, along) * step(along, size);
  float head = radarStroke(abs(away) - 0.52 * (size - along), 0.00071)
    * step(size - 0.017, along) * step(along, size);
  float heading = radarStroke(point.x, 0.00038) * step(0.011, point.y) * step(point.y, size);
  heading *= step(0.40, fract(point.y / 0.018));
  float hub = radarStroke(radius - 0.0065, 0.00063);

  #ifdef PARTICLE_STUDY
    grid *= 0.42;
    rings *= 0.85;
  #endif
  vec3 phosphor = vec3(0.43, 0.80, 0.077);
  vec3 glow = phosphor * (grid * (0.018 + 0.073 * scope) + 0.18 * rings * scope + 0.55 * rim + 0.53 * ticks);
  glow += vec3(0.105, 0.26, 0.029) * trail * (0.10 + 0.45 * radius / size);
  glow += vec3(0.59, 0.94, 0.16) * (0.69 * shaft + 0.81 * head + 0.55 * hub + 0.18 * heading);
  return glow;
}`;

export const limePointPalette = `
vec3 limePointColor(float light, float highlight) {
  vec3 greenShade = vec3(0.31, 0.60, 0.065);
  vec3 lime = vec3(0.51, 0.83, 0.12);
  vec3 citron = vec3(0.79, 0.91, 0.20);
  vec3 base = mix(greenShade, lime, light);
  return mix(base, citron, smoothstep(0.58, 0.98, highlight) * 0.64);
}`;

const pointProfile = `
vec2 luminousPoint(float radius, float antialias) {
  float core = 1.0 - smoothstep(0.18 - antialias, 0.39 + antialias, radius);
  float halo = (1.0 - smoothstep(0.20, 0.50, radius)) * (1.0 - core);
  return vec2(core, halo);
}`;

export const loadingCutaway = `
vec2 cargoOpening(float amount) {
  return mix(vec2(1.35), vec2(-10.72, 16.45), amount);
}

bool insideLoadingCutaway(vec3 p, float amount) {
  vec2 limits = cargoOpening(amount);
  bool deck = p.y > 7.5 && p.z > -3.45;
  return amount > 0.002 && p.x > limits.x && p.x < limits.y
    && p.y > 1.47 && p.y < 9.10 && (p.z > 2.58 || deck);
}`;

// Project the same regular dot lattice onto all three axes, weighting it by the face normal.
export const surfaceVertex = `
varying vec3 vPosition, vNormal;
varying float vDepth, vFacing;
#ifdef VESSEL_FINISH
  varying float vReflection;
#endif
void main() {
  vPosition = position;
  vNormal = normal;
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  vDepth = -view.z;
  vec3 viewNormal = normalize(normalMatrix * normal);
  vec3 eye = normalize(-view.xyz);
  vFacing = abs(dot(viewNormal, eye));
  #ifdef VESSEL_FINISH
    vec3 lamp = normalize(normalMatrix * vec3(0.18, 0.79, 0.58));
    vReflection = max(0.0, dot(viewNormal, normalize(lamp + eye)));
  #endif
  gl_Position = projectionMatrix * view;
}`;

export const surfaceFragment = `
uniform float uTime, uScan, uReveal, uXray, uLoadingGrid;
varying vec3 vPosition, vNormal;
varying float vDepth, vFacing;
#ifdef VESSEL_FINISH
  varying float vReflection;
#endif
${limePointPalette}
${pointProfile}
${loadingCutaway}
${particleLook}
${equipmentPalette}

vec2 dots(vec2 plane) {
  vec2 cells = plane / 0.32;
  vec2 footprint = fwidth(cells);
  float aa = clamp(max(footprint.x, footprint.y) * 0.21, 0.015, 0.075);
  vec2 point = luminousPoint(1.65 * length(fract(cells) - 0.5), aa);
  return point * (1.0 - smoothstep(0.38, 1.0, length(footprint)));
}

float gridLines(vec2 plane) {
  vec2 cells = plane / 0.94;
  vec2 width = clamp(fwidth(cells), vec2(0.01), vec2(0.25));
  vec2 distanceToLine = abs(fract(cells + 0.5) - 0.5);
  vec2 line = 1.0 - smoothstep(0.10 * width, 0.67 * width, distanceToLine);
  return max(line.x, line.y);
}

void main() {
  if (vPosition.x > uScan || uReveal < 0.005) discard;
  bool cutaway = insideLoadingCutaway(vPosition, uLoadingGrid);
  #ifdef LOADING_GRID_PASS
    if (!cutaway) discard;
  #else
    if (cutaway) discard;
  #endif
  vec3 direction = normalize(vNormal);
  vec3 weights = pow(abs(direction), vec3(5.0));
  weights /= max(dot(weights, vec3(1.0)), 0.001);
  float key = max(0.0, dot(direction, vec3(0.49, 0.77, 0.40)));
  float heightLight = smoothstep(-3.8, 8.0, vPosition.y);
  float rim = pow(1.0 - clamp(vFacing, 0.0, 1.0), 2.6);
  float light = smoothstep(0.08, 0.94, 0.82 * key + 0.18 * heightLight);
  #ifdef LOADING_GRID_PASS
    float grid = dot(weights, vec3(gridLines(vPosition.zy), gridLines(vPosition.xz), gridLines(vPosition.xy)));
    vec2 limits = cargoOpening(uLoadingGrid);
    float edgeDistance = min(vPosition.x - limits.x, limits.y - vPosition.x);
    float edge = 1.0 - smoothstep(0.0, max(0.028, fwidth(vPosition.x)), edgeDistance);
    float opacity = max(grid * (0.25 + 0.10 * rim), edge * 0.51);
    vec3 wire = limePointColor(0.89, 0.48 + 0.37 * light);
    #ifdef PARTICLE_STUDY
      wire = mix(vec3(0.11, 0.33, 0.55), vec3(0.29, 0.80, 1.0), light);
      opacity = max(grid * (0.20 + 0.10 * rim), edge * 0.69);
    #endif
    gl_FragColor = vec4(wire, opacity * uReveal * smoothstep(0.0, 0.09, uLoadingGrid));
  #elif defined(PARTICLE_STUDY)
    vec3 film = particleCoordinates(vPosition, uTime);
    vec2 spots = weights.x * dots(film.zy) + weights.y * dots(film.xz) + weights.z * dots(film.xy);
    float wave = particleCrests(film, uTime);
    float ribbon = smoothstep(0.48, 0.99, wave);
    vec3 ink = equipmentBlue(light * 0.68 + rim * 0.32, wave);
    float flecks = dot(spots, vec2(0.98, 0.31));
    // Solid hull: a dark body that hides what is behind it; light comes from the dots and crests.
    vec3 body = mix(vec3(0.005, 0.012, 0.030), vec3(0.018, 0.050, 0.105), 0.78 * light + 0.22 * rim);
    vec3 color = body + ink * (0.030 + 0.095 * ribbon + rim * 0.14 + flecks * (0.42 + ribbon * 0.95));
    color = mix(vec3(0.004, 0.009, 0.022), color, exp(-vDepth * 0.0016));
    float opacity = uReveal * (uXray > 0.5 ? 0.51 : 1.0);
    gl_FragColor = vec4(color, opacity);
  #else
    float scan = exp(-pow((vPosition.x - sin(uTime * 0.22) * 32.0) * 0.30, 2.0));
    vec3 ink = limePointColor(mix(0.73, 1.0, light), clamp(light + 0.18 * scan, 0.0, 1.0));
    vec3 solid = vec3(0.007, 0.012, 0.006) + ink * (0.015 + 0.057 * light + 0.027 * rim);
    vec2 spots = weights.x * dots(vPosition.zy) + weights.y * dots(vPosition.xz) + weights.z * dots(vPosition.xy);
    float emission = dot(spots, vec2(0.86, 0.18)) * (0.32 + 0.61 * light + 0.12 * rim);
    #ifdef VESSEL_FINISH
      float plating = smoothstep(1.1, 8.1, vPosition.y);
      float reflection = pow(vReflection, 8.0);
      float rail = smoothstep(3.7, 4.65, abs(vPosition.z)) * smoothstep(7.2, 8.1, vPosition.y);
      solid = mix(vec3(0.006, 0.014, 0.015), vec3(0.056, 0.092, 0.047), light * (0.42 + 0.58 * plating));
      solid += vec3(0.085, 0.107, 0.069) * (reflection * 0.46 + rim * 0.12);
      solid *= mix(1.0, 0.69, rail);
      emission *= mix(0.46, 0.82, plating) * mix(1.0, 0.58, rail);
    #endif
    solid += ink * (emission + 0.016 * scan) * uReveal;
    solid = mix(vec3(0.012, 0.020, 0.037), solid, exp(-vDepth * 0.002));
    float opacity = uXray > 0.5 ? 0.16 + spots.x * 0.22 : 1.0;
    gl_FragColor = vec4(solid, opacity);
  #endif
}`;

const waterVertex = `
uniform float uTime, uAmplitude, uPixelScale;
uniform vec4 uWake;
varying vec2 vXZ;
varying float vFade, vHeight;
${particleLook}

float heightAt(vec2 p) {
  vec2 warp = vec2(
    sin(p.y * 0.11 + uTime * 0.30),
    sin(p.x * 0.07 - uTime * 0.28)
  );
  p += warp * vec2(9.0, 5.5);
  return (
    sin(p.x * 0.080 + p.y * 0.10 + uTime * 0.75) * 3.9 +
    cos(p.x * 0.055 - p.y * 0.14 - uTime * 0.51) * 2.8 +
    sin(p.x * 0.17 + p.y * 0.11 - uTime * 0.61) * 1.25
  ) * exp(-dot(p * vec2(0.018, 0.030), p * vec2(0.018, 0.030)) * 0.42);
}

float wakeAt(vec2 p) {
  vec2 direction = vec2(cos(uWake.z), -sin(uWake.z));
  vec2 offset = p - uWake.xy;
  float astern = -dot(offset, direction);
  float spread = abs(dot(offset, vec2(-direction.y, direction.x)));
  float distance = max(0.0, astern);
  float arm = (spread - (1.5 + 0.24 * distance)) / (1.1 + 0.068 * distance);
  float fade = smoothstep(0.0, 3.2, astern) * (1.0 - smoothstep(20.0, 47.0, astern));
  return 2.25 * uWake.w * fade * exp(-arm * arm) * sin(distance * 0.69 - uTime * 1.9);
}

void main() {
  vXZ = position.xz;
  float upstream = 1.0 - smoothstep(-94.0, -28.0, vXZ.x);
  float radius = length(vXZ / vec2(83.0 + 48.0 * upstream, 52.0));
  vFade = (1.0 - smoothstep(0.58, 1.0, radius));
  vec2 xy = vXZ;
  #ifdef PARTICLE_STUDY
    vec3 rest = vec3(vXZ.x, 0.0, vXZ.y) * 0.72;
    vec3 film = particleCoordinates(rest, uTime * 0.68);
    xy += (film.xz - rest.xz) * 1.91;
  #endif
  vHeight = heightAt(xy) + wakeAt(xy);
  vec3 displaced = vec3(xy.x, -3.85 + vHeight * uAmplitude, xy.y);
  vec4 view = modelViewMatrix * vec4(displaced, 1.0);
  gl_Position = projectionMatrix * view;
  gl_PointSize = clamp(0.27 * uPixelScale * projectionMatrix[1][1] / max(1.0, -view.z), 1.0, 6.2);
}`;

const waterContourFragment = `
uniform float uTime, uOpacity;
varying vec2 vXZ;
varying float vHeight, vFade;
${waterRamp}
${particleLook}

void main() {
  float level = vHeight / 0.55;
  float aa = max(fwidth(level), 0.001);
  float distanceToLine = abs(level - floor(level + 0.5));
  float line = (1.0 - smoothstep(0.025, 0.025 + min(0.23, aa * 0.82), distanceToLine))
    * (1.0 - smoothstep(0.26, 0.85, aa));
  float major = 1.0 - step(0.50, mod(floor(level + 0.5), 4.0));
  float depthColor = smoothstep(-4.8, 4.2, vHeight);
  #ifdef PARTICLE_STUDY
    float wave = particleWave(vec3(vXZ.x, vHeight, vXZ.y) * 0.72, uTime * 0.68);
    vec3 color = particleInk(depthColor, wave);
    gl_FragColor = vec4(color, line * vFade * uOpacity * mix(0.036, 0.18, major) * (0.32 + 0.68 * wave));
  #else
  vec3 color = waterColor(depthColor) * mix(0.49, 1.0, major);
  gl_FragColor = vec4(color, line * vFade * uOpacity * mix(0.18, 0.53, major));
  #endif
}`;

const waterPointFragment = `
uniform float uTime, uOpacity, uPointStrength;
varying vec2 vXZ;
varying float vHeight, vFade;
${dotMask}
${waterRamp}
${particleLook}
void main() {
  float heightColor = smoothstep(-4.0, 4.0, vHeight + 1.3 * sin(vXZ.x * 0.08 + uTime * 0.5));
  vec3 color = waterColor(heightColor);
  float wave = 0.55 + 0.45 * smoothstep(-4.5, 3.0, vHeight);
  #ifdef PARTICLE_STUDY
    float band = particleWave(vec3(vXZ.x, vHeight, vXZ.y) * 0.72, uTime * 0.68);
    color = particleInk(heightColor, band);
    wave *= 0.28 + 0.82 * smoothstep(0.12, 0.94, band);
  #endif
  gl_FragColor = vec4(color, roundPoint() * vFade * uOpacity * uPointStrength * wave);
}`;

export function createWater(time, pixelScale, particleStudy = false) {
  const defines = particleStudy ? {PARTICLE_STUDY: 1} : {};
  const uniforms = {
    uTime: time,
    uPixelScale: pixelScale,
    uWake: {value: new T.Vector4()},
    uAmplitude: {value: 1},
    uOpacity: {value: 1},
    uPointStrength: {value: 0.8}
  };
  const group = new T.Group();
  const topography = new T.PlaneGeometry(224, 106, 216, 102);
  topography.rotateX(-Math.PI / 2).translate(-26, 0, 0);
  const lines = new T.Mesh(topography, new T.ShaderMaterial({
    uniforms, defines, vertexShader: waterVertex, fragmentShader: waterContourFragment,
    transparent: true, depthWrite: false, side: T.DoubleSide
  }));
  lines.frustumCulled = false;
  const grid = new T.PlaneGeometry(224, 106, 176, 85);
  grid.rotateX(-Math.PI / 2).translate(-26, 0, 0);
  grid.setIndex(null);
  const particles = new T.Points(grid, new T.ShaderMaterial({
    uniforms, defines, vertexShader: waterVertex, fragmentShader: waterPointFragment,
    transparent: true, depthWrite: false
  }));
  particles.frustumCulled = false;
  particles.renderOrder = 1;
  group.add(lines, particles);
  return {group, uniforms};
}

export const geographicFilm = `
  vec2 geographicFoldPhase(vec3 p, float time) {
    float curl = sin(dot(p, vec3(0.16, 0.11, 0.19)) + 0.28 * time);
    float bend = sin(dot(p, vec3(-0.11, 0.18, 0.09)) - 0.21 * time);
    float warp = 1.72 * curl + 0.94 * bend;
    return vec2(dot(p, vec3(0.16, 0.27, -0.13)) + warp - 0.49 * time,
                dot(p, vec3(-0.17, 0.16, 0.21)) - 0.73 * warp + 0.33 * time);
  }

  vec2 geographicFoldRims(vec2 phase) {
    float crest = pow(0.5 + 0.5 * cos(phase.x), 11.0);
    float echo = pow(0.5 + 0.5 * cos(phase.y), 14.0);
    float offset = pow(0.5 + 0.5 * cos(phase.x + 0.58), 18.0);
    return vec2(crest, 0.72 * echo + 0.28 * offset);
  }
`;

const globeLighting = `
  float sphereKey(vec3 normal) {
    return smoothstep(-0.46, 0.94, dot(normal, vec3(-0.57, 0.62, 0.54)));
  }

  float sphereRim(vec3 normal, float facing) {
    float limb = smoothstep(0.015, 0.24, facing) * (1.0 - smoothstep(0.24, 0.59, facing));
    float litSide = smoothstep(-0.43, 0.76, dot(normal.xy, vec2(-0.55, 0.83)));
    return limb * mix(0.34, 1.0, litSide);
  }

  float sphereSweep(vec3 direction, float time) {
    float phase = time * 0.19;
    vec3 axis = normalize(vec3(0.52 * cos(phase), 0.77, 0.52 * sin(phase)));
    float latitude = 0.19 + 0.36 * sin(0.72 * phase);
    return 1.0 - smoothstep(0.025, 0.29, abs(dot(direction, axis) - latitude));
  }
`;

export function oceanMaterial(time, pixelScale, fold, mapHalfWidth, particleStudy = false) {
  return new T.ShaderMaterial({
    defines: particleStudy ? {PARTICLE_STUDY: 1} : {},
    uniforms: {
      uTime: time, uPixelScale: pixelScale, uFold: fold, uOpacity: {value: 0},
      uMapHalfWidth: {value: mapHalfWidth}
    },
    vertexShader: `
      attribute vec3 flatPosition;
      attribute float offshore, sheetOnly;
      uniform float uTime, uPixelScale, uFold, uMapHalfWidth;
      varying float vFacing, vRidge, vLight, vPolar, vOffshore, vCoverage;
      #ifdef PARTICLE_STUDY
        varying vec3 vSphereLight;
        varying vec2 vFoldRims;
        varying float vRippleSlope;
        ${particleLook}
        ${geographicFilm}
        ${globeLighting}
      #endif

      void main() {
        vec3 direction = normalize(position);
        // Use directions on the sphere so the waves stay continuous across the map seam.
        float a = dot(direction, vec3(11.1, 9.5, -7.3)) + 1.35 * sin(direction.z * 7.8 - uTime * 0.39) + uTime * 0.58;
        float b = dot(direction, vec3(-14.8, 8.8, 11.5)) + 1.1 * sin(direction.x * 8.4 + uTime * 0.43) - uTime * 0.51;
        float c = dot(direction, vec3(18.5, -17.3, -15.8)) + uTime * 0.38;
        float wave = 0.53 * sin(a) + 0.34 * cos(b) + 0.13 * sin(c);
        float swell = 0.61 * sin(a * 0.76) + 0.29 * cos(b * 0.75) + 0.10 * sin(c * 0.69);
        float sheetRidge = 0.25 + 0.69 * smoothstep(-0.89, 0.89, swell);
        float globeRidge = smoothstep(-0.53, 0.76, wave);
        #ifdef PARTICLE_STUDY
          vec3 rest = position * 0.63;
          vec3 film = particleCoordinates(rest, uTime * 0.62);
          globeRidge = smoothstep(0.06, 0.98, particleCrests(film, uTime * 0.62));
        #endif
        float ridge = mix(sheetRidge, globeRidge, uFold);
        float flatEdge = 1.0 - smoothstep(0.91, 1.0, abs(flatPosition.x) / uMapHalfWidth);
        vec3 sheetPosition = flatPosition + vec3(0.40 * sin(b * 0.75), 0.93 * swell, 2.65 * sheetRidge) * offshore * flatEdge;
        float waveHeight = 2.0;
        #ifdef PARTICLE_STUDY
          waveHeight = 0.74;
        #endif
        vec3 raised = position + direction * (waveHeight * offshore * globeRidge);
        #ifdef PARTICLE_STUDY
          vec3 flow = film - rest;
          raised += (flow - direction * dot(direction, flow)) * offshore * 0.29;
          vFoldRims = geographicFoldRims(geographicFoldPhase(position, uTime));
          raised += direction * (0.15 * vFoldRims.x * offshore);

          // Crossing ripples follow the sphere and flatten as they approach shore.
          float ripplePhase = dot(direction, vec3(39.0, -22.0, 27.0)) - 1.45 * uTime;
          ripplePhase += 2.2 * sin(dot(direction, vec3(5.0, 7.0, -8.0)) + 0.31 * uTime);
          float crossPhase = dot(direction, vec3(-29.0, 46.0, 31.0)) - 1.03 * uTime;
          float rippleStrength = smoothstep(0.50, 0.98, uFold) * smoothstep(0.06, 0.78, offshore);
          float rippleHeight = 0.68 * sin(ripplePhase) + 0.32 * sin(crossPhase);
          raised += direction * (0.14 * (0.5 + 0.5 * rippleHeight) * rippleStrength);
          vRippleSlope = (0.68 * cos(ripplePhase) + 0.32 * cos(crossPhase)) * rippleStrength;
        #endif
        vec3 folded = mix(sheetPosition, raised, uFold);
        folded.z += sin(uFold * 3.14159265) * 0.012 * flatPosition.x * flatPosition.x;
        vec4 view = modelViewMatrix * vec4(folded, 1.0);
        vec3 facing = normalMatrix * normalize(mix(vec3(0.0, 0.0, 1.0), direction, uFold));
        vFacing = dot(normalize(facing), normalize(-view.xyz));
        #ifdef PARTICLE_STUDY
          vec3 sphereNormal = normalize(normalMatrix * direction);
          vSphereLight = vec3(sphereKey(sphereNormal), sphereRim(sphereNormal, vFacing), sphereSweep(direction, uTime));
        #endif
        vRidge = mix(0.24, ridge, 0.45 + 0.55 * offshore);
        float sheetLight = 0.67 + 0.13 * cos(a * 0.76) - 0.09 * sin(b * 0.75) + 0.05 * cos(c * 0.69);
        float globeLight = clamp(0.56 + 0.25 * cos(a) - 0.18 * sin(b) + 0.10 * cos(c), 0.0, 1.0);
        vLight = mix(sheetLight, globeLight, uFold);
        vPolar = smoothstep(0.06, 0.4, length(direction.xz));
        vOffshore = offshore;
        vCoverage = 1.0 - sheetOnly * smoothstep(0.0, 0.24, uFold);
        gl_Position = projectionMatrix * view;
        float size = mix(0.15 * mix(0.92, 1.27, vRidge), 0.19 * mix(0.73, 1.50, vRidge), uFold);
        #ifdef PARTICLE_STUDY
          size *= 0.91 + 0.09 * vFoldRims.x;
        #endif
        gl_PointSize = clamp(size * uPixelScale * projectionMatrix[1][1] / max(1.0, -view.z), 1.35, 4.8);
      }
    `,
    fragmentShader: `
      uniform float uFold, uOpacity;
      varying float vFacing, vRidge, vLight, vPolar, vOffshore, vCoverage;
      ${dotMask}
      ${waterRamp}
      #ifdef PARTICLE_STUDY
        varying vec3 vSphereLight;
        varying vec2 vFoldRims;
        varying float vRippleSlope;
      #endif

      void main() {
        vec3 crest = vec3(0.18, 0.73, 1.0);
        vec3 color = waterColor(vRidge);
        vec3 sheetBlue = mix(vec3(0.074, 0.20, 0.52), color, 0.51 + 0.29 * vRidge);
        color = mix(sheetBlue, color, uFold);
        float shine = smoothstep(0.47, 0.94, vRidge) * vLight * mix(0.60, 1.0, uFold);
        color = mix(color, crest, shine);
        float facing = mix(1.0, smoothstep(0.13, 0.54, vFacing), uFold);
        float depth = mix(0.60, 1.0, vOffshore) * mix(1.0, vPolar, 0.75 * uFold);
        float sheetGlow = mix(0.53, 0.92, vRidge) * mix(0.82, 1.0, vLight);
        float globeGlow = mix(0.26, 1.0, vRidge) * mix(0.67, 1.0, vLight);
        float glow = mix(sheetGlow, globeGlow, uFold) * depth;
        #ifdef PARTICLE_STUDY
          vec3 deepWater = vec3(0.025, 0.07, 0.30);
          vec3 openWater = vec3(0.035, 0.16, 0.56);
          vec3 waveLight = vec3(0.12, 0.36, 0.88);
          float sphere = smoothstep(0.47, 0.98, uFold);
          float ripple = vRippleSlope * smoothstep(0.16, 0.48, vFacing);
          float ridge = mix(vRidge, 0.16 + 0.59 * vRidge + 0.22 * vSphereLight.z, sphere) + 0.047 * ripple;
          color = mix(deepWater, openWater, smoothstep(0.16, 0.68, ridge));
          color = mix(color, waveLight, smoothstep(0.54, 0.98, ridge) * (0.70 + 0.30 * vLight));
          vec2 ribbons = vFoldRims * sphere * mix(0.39, 1.0, vOffshore);
          color = mix(color, vec3(0.16, 0.34, 1.0), 0.48 * ribbons.y);
          color = mix(color, vec3(0.14, 0.63, 1.0), 0.70 * ribbons.x);
          float volumeLight = 0.62 + dot(vSphereLight, vec3(0.62, 0.75, 0.27));
          float waveGlow = (mix(0.26, 0.72, ridge) + dot(ribbons, vec2(0.30, 0.14)))
                         * depth * (1.0 + 0.24 * ripple);
          glow = mix(glow * mix(0.62, 0.94, smoothstep(0.23, 0.93, ridge)), waveGlow * volumeLight, sphere);
          facing = mix(facing, smoothstep(0.035, 0.38, vFacing), sphere);
        #endif
        gl_FragColor = vec4(color, roundPoint() * facing * glow * uOpacity * vCoverage);
      }
    `,
    transparent: true,
    depthWrite: false
  });
}

export function tintGlobeSurface(material, coastField) {
  const compileFold = material.onBeforeCompile;
  material.map = coastField;
  material.onBeforeCompile = (shader, renderer) => {
    compileFold(shader, renderer);
    shader.uniforms.uLandTint = {value: new T.Color(0x142f3a)};
    shader.vertexShader = `varying float vGlobeShade;\n${globeLighting}` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `
      #include <project_vertex>
      vec3 sphereNormal = normalize(normalMatrix * normalize(position));
      float facing = dot(sphereNormal, normalize(-mvPosition.xyz));
      float lighting = 0.55 + 0.66 * sphereKey(sphereNormal) + 0.25 * sphereRim(sphereNormal, facing);
      vGlobeShade = mix(1.0, lighting, smoothstep(0.47, 0.98, uFold));
    `);
    shader.fragmentShader = 'uniform vec3 uLandTint;\nvarying float vGlobeShade;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      // The sphere sheet runs from north to south as its vertical UV increases.
      float coast = texture2D(map, vec2(vMapUv.x, 1.0 - vMapUv.y)).r;
      diffuseColor.rgb = mix(diffuseColor.rgb, uLandTint, smoothstep(0.38, 0.72, coast)) * vGlobeShade;
    `);
  };
  material.customProgramCacheKey = () => 'secton-map-fold-coast';
  material.needsUpdate = true;
}

export function limeLandMaterial(pixelScale, fold, time, particleStudy = false, echo = false) {
  return new T.ShaderMaterial({
    defines: particleStudy ? {PARTICLE_STUDY: 1, ...(echo ? {FILM_ECHO: 1} : {})} : {},
    uniforms: {uPixelScale: pixelScale, uFold: fold, uTime: time, uOpacity: {value: 0}},
    vertexShader: `
      attribute vec3 flatPosition;
      attribute vec4 mapStyle;
      uniform float uPixelScale, uFold, uTime;
      varying float vFacing, vPolar, vLight, vGlobe, vCoverage, vCitrine;
      ${particleLook}
      #ifdef PARTICLE_STUDY
        attribute float filmInset;
        varying float vSheen, vFilmInset;
        varying vec3 vSphereLight;
        varying vec2 vFoldRims;
        ${geographicFilm}
        ${globeLighting}

        vec2 landFold(vec3 material, float time) {
          float crest = particleCrests(material, time);
          float curl = 0.5 + 0.5 * sin(dot(material, vec3(0.37, -0.26, 0.41))
                                    + sin(material.y * 0.39 + time * 0.44));
          float lift = (0.08 + 1.02 * pow(crest, 2.05)) * (0.74 + 0.36 * curl);
          return vec2(lift, crest);
        }
      #endif

      void main() {
        vec3 direction = normalize(position);
        vGlobe = smoothstep(0.05, 0.72, uFold);
        float globeDensity = smoothstep(0.32, 0.91, uFold);
        vCoverage = mix(1.0 - globeDensity, globeDensity, mapStyle.w);
        vec3 flatDots = flatPosition + vec3(mapStyle.xy * (1.0 - vGlobe), 0.0);
        vec3 folded = mix(flatDots, position, uFold);
        #ifdef PARTICLE_STUDY
          vec3 rest = position * 0.66;
          float time = uTime * 0.53;
          #ifdef FILM_ECHO
            time -= 1.10;
          #endif
          vec3 film = particleCoordinates(rest, time);
          vec2 shell = landFold(film, time);
          vFoldRims = geographicFoldRims(geographicFoldPhase(position, uTime));
          vec3 tangent = normalize(cross(direction, vec3(0.10, 1.0, 0.18)) + vec3(1e-8));
          vec3 across = cross(direction, tangent);
          float lift = shell.x * filmInset;
          float slopeU = (landFold(particleCoordinates(rest + tangent * 0.41, time), time).x - shell.x) * filmInset / 0.62;
          float slopeV = (landFold(particleCoordinates(rest + across * 0.41, time), time).x - shell.x) * filmInset / 0.62;
          vec3 sheetNormal = normalize(direction - 0.86 * (tangent * slopeU + across * slopeV));
          vec3 trail = film - rest;
          trail -= direction * dot(direction, trail);
          #ifdef FILM_ECHO
            float echoSeparation = filmInset * (0.08 + 0.21 * shell.y);
            folded += vGlobe * (direction * (0.18 + 0.29 * lift + echoSeparation) + 0.18 * filmInset * trail);
          #else
            folded += vGlobe * (direction * (0.60 * lift + 0.14 * vFoldRims.x * filmInset) + 0.18 * filmInset * trail);
          #endif
        #endif
        folded.z += sin(uFold * 3.14159265) * 0.012 * flatPosition.x * flatPosition.x;
        vec4 view = modelViewMatrix * vec4(folded, 1.0);
        vec3 normal = normalMatrix * normalize(mix(vec3(0.0, 0.0, 1.0), direction, uFold));
        vFacing = dot(normalize(normal), normalize(-view.xyz));
        vPolar = smoothstep(0.04, 0.67, length(direction.xz));
        vLight = mapStyle.z;
        float daylight = dot(direction, vec3(0.12, 0.86, -0.44));
        float bands = sin(dot(direction, vec3(5.5, -4.0, 3.5)));
        vCitrine = smoothstep(0.12, 0.90, daylight + 0.17 * bands);
        #ifdef PARTICLE_STUDY
          vec3 sphereNormal = normalize(normalMatrix * direction);
          vSphereLight = vec3(sphereKey(sphereNormal), sphereRim(sphereNormal, vFacing), sphereSweep(direction, uTime));
          float incidence = abs(dot(normalize(normalMatrix * sheetNormal), normalize(-view.xyz)));
          float turn = pow(1.0 - incidence, 3.10);
          float steepness = smoothstep(0.028, 0.36, length(vec2(slopeU, slopeV)));
          vSheen = (0.54 * turn + 0.46 * steepness) * mix(0.37, 1.0, filmInset);
          vFilmInset = filmInset;
          vCitrine = shell.y;
        #endif
        gl_Position = projectionMatrix * view;
        float scale = uPixelScale * projectionMatrix[1][1] / max(1.0, -view.z);
        float mapSize = clamp(0.42 * scale, 2.45, 4.6);
        float globeSize = clamp(0.395 * scale, 2.35, 5.0);
        #ifdef PARTICLE_STUDY
          globeSize = clamp(0.33 * scale, 1.75, 4.25) * mix(0.94, 1.16, vSheen);
        #endif
        gl_PointSize = mix(mapSize, globeSize, vGlobe);
      }
    `,
    fragmentShader: `
      uniform float uFold, uOpacity;
      varying float vFacing, vPolar, vLight, vGlobe, vCoverage, vCitrine;
      ${limePointPalette}
      ${pointProfile}
      ${particleLook}
      #ifdef PARTICLE_STUDY
        varying float vSheen, vFilmInset;
        varying vec3 vSphereLight;
        varying vec2 vFoldRims;
      #endif

      void main() {
        float facing = mix(1.0, smoothstep(0.05, 0.50, vFacing), uFold);
        float polar = mix(1.0, vPolar, 0.70 * uFold);
        float relief = smoothstep(0.08, 0.86, vLight);
        vec2 point = luminousPoint(length(gl_PointCoord - 0.5), 0.0);
        vec3 pointColor = limePointColor(mix(0.73, 1.0, vCitrine), vCitrine);
        float litTerrain = smoothstep(0.33, 0.96, relief);
        vec3 sheetColor = mix(pointColor, vec3(0.64, 0.94, 0.16), 0.25 * litTerrain);
        pointColor = mix(sheetColor, pointColor, vGlobe);
        vec3 color = mix(pointColor * vec3(0.63, 0.74, 0.55), pointColor, point.x);
        float sheetGlow = mix(0.32, 0.55, litTerrain);
        float globeGlow = mix(0.20, 0.36, vCitrine);
        float glow = point.x + mix(sheetGlow, globeGlow, vGlobe) * point.y;
        float reliefLight = mix(mix(0.66, 1.04, relief), 1.0, vGlobe);
        float alpha = glow * reliefLight * facing * polar * vCoverage * uOpacity;
        #ifdef PARTICLE_STUDY
          float sphere = smoothstep(0.47, 0.98, uFold);
          float fold = smoothstep(0.36, 0.96, mix(vCitrine, 0.14 + 0.64 * vCitrine + 0.22 * vSphereLight.z, sphere));
          float slopeLight = smoothstep(0.16, 0.66, vSheen);
          float glint = max(fold * 0.42, slopeLight * (0.42 + 0.58 * fold));
          float spectrum = clamp(0.19 + 0.54 * fold + 0.45 * glint, 0.0, 1.0);
          vec3 ribbonInk = particleInk(clamp(0.31 + 0.57 * glint, 0.0, 1.0), spectrum);
          vec3 landInk = mix(vec3(0.02, 0.20, 0.42), vec3(0.07, 0.56, 0.86), fold);
          color = mix(mix(landInk, ribbonInk, 0.24), vec3(0.27, 0.94, 1.0), 0.20 * fold + 0.36 * glint);
          vec2 ribbons = vFoldRims * sphere;
          color = mix(color, vec3(0.12, 0.32, 0.95), 0.17 * ribbons.y);
          color = mix(color, vec3(0.34, 0.95, 1.0), 0.50 * ribbons.x);
          float volumeLight = 0.61 + dot(vSphereLight, vec3(0.57, 0.58, 0.21));
          float film = (0.15 + 0.20 * fold + 0.66 * glint + 0.55 * ribbons.x) * mix(1.0, volumeLight, sphere);
          facing = mix(facing, smoothstep(0.035, 0.38, vFacing), sphere);
          alpha = (point.x + point.y * (0.14 + 0.43 * glint))
                * film * facing * polar * vCoverage * uOpacity;
          #ifdef FILM_ECHO
            color = mix(vec3(0.03, 0.08, 0.70), vec3(0.16, 0.42, 1.0), 0.28 + 0.56 * glint);
            alpha *= (0.05 + 0.24 * smoothstep(0.20, 0.62, vSheen) + 0.24 * ribbons.y) * vFilmInset;
          #endif
        #endif
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false
  });
}
