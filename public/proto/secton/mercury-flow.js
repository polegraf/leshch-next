import * as T from './three.module.js';

// Screen positions are in UV space. Radii are fractions of the viewport height.
const profiles = [
  {x: 0.13, y: 0.64, radius: 0.198, phase: 0.20, tilt: 0.78, elongation: 0.27, taper: 0.28, bend: 0.15},
  {x: 0.38, y: 0.43, radius: 0.156, phase: 2.90, tilt: -0.33, elongation: 0.32, taper: -0.16, bend: 0.22},
  {x: 0.70, y: 0.76, radius: 0.190, phase: 1.13, tilt: 1.12, elongation: 0.25, taper: 0.33, bend: -0.14},
  {x: 0.86, y: 0.32, radius: 0.205, phase: 3.95, tilt: -0.69, elongation: 0.29, taper: -0.25, bend: 0.10},
  {x: 0.04, y: 0.21, radius: 0.131, phase: 4.83, tilt: 0.48, elongation: 0.24, taper: 0.18, bend: -0.19},
  {x: 0.55, y: 0.12, radius: 0.119, phase: 5.71, tilt: 0.93, elongation: 0.20, taper: -0.29, bend: 0.12},
  {x: 0.97, y: 0.89, radius: 0.113, phase: 0.84, tilt: -0.38, elongation: 0.26, taper: 0.14, bend: -0.13},
  {x: 0.34, y: 0.90, radius: 0.088, phase: 3.23, tilt: 0.68, elongation: 0.23, taper: -0.26, bend: 0.17},
  {x: 0.62, y: 0.49, radius: 0.086, phase: 1.69, tilt: -0.92, elongation: 0.28, taper: 0.19, bend: 0.19}
];
const smallProfiles = [
  {x: 0.49, y: 0.69, radius: 0.050, phase: 2.61, tilt: -0.48, elongation: 0.22, taper: 0.19, bend: 0.17},
  {x: 0.23, y: 0.36, radius: 0.043, phase: 1.46, tilt: 0.70, elongation: 0.28, taper: -0.19, bend: -0.15},
  {x: 0.54, y: 0.92, radius: 0.055, phase: 3.57, tilt: 0.28, elongation: 0.23, taper: 0.23, bend: 0.18},
  {x: 0.76, y: 0.56, radius: 0.041, phase: 5.68, tilt: 0.84, elongation: 0.24, taper: -0.28, bend: 0.09},
  {x: 0.27, y: 0.14, radius: 0.053, phase: 2.72, tilt: -0.62, elongation: 0.28, taper: 0.14, bend: -0.17},
  {x: 0.94, y: 0.60, radius: 0.042, phase: 1.37, tilt: 0.53, elongation: 0.20, taper: 0.20, bend: 0.11},
  {x: 0.45, y: 0.24, radius: 0.032, phase: 5.30, tilt: -0.40, elongation: 0.19, taper: -0.16, bend: 0.14},
  {x: 0.78, y: 0.11, radius: 0.049, phase: 0.38, tilt: 0.30, elongation: 0.32, taper: 0.27, bend: 0.08},
  {x: 0.10, y: 0.92, radius: 0.039, phase: 6.01, tilt: -0.62, elongation: 0.23, taper: 0.22, bend: -0.11},
  {x: 0.28, y: 0.70, radius: 0.029, phase: 4.49, tilt: 0.57, elongation: 0.24, taper: -0.26, bend: 0.12},
  {x: 0.64, y: 0.28, radius: 0.044, phase: 3.32, tilt: -0.92, elongation: 0.26, taper: 0.19, bend: 0.12},
  {x: 0.78, y: 0.95, radius: 0.030, phase: 2.19, tilt: 0.51, elongation: 0.18, taper: 0.17, bend: -0.10},
  {x: 0.05, y: 0.43, radius: 0.037, phase: 3.40, tilt: 0.41, elongation: 0.26, taper: -0.23, bend: 0.18},
  {x: 0.87, y: 0.77, radius: 0.028, phase: 0.23, tilt: -0.27, elongation: 0.22, taper: 0.25, bend: -0.13}
];
const {clamp, smoothstep} = T.MathUtils;
const widestDrop = Math.max(...profiles.map(drop => drop.radius));

function dropReach(drop, x, y) {
  const axial = x * drop.axis.x + y * drop.axis.y;
  const lateral = y * drop.axis.x - x * drop.axis.y;
  const stretch = 1 + drop.stretch;
  return drop.radiusNow / Math.hypot(axial / stretch, lateral * stretch);
}

export const mercuryLens = `
  const int LENS_COUNT = ${profiles.length + smallProfiles.length};
  uniform int uMercuryCount;
  uniform vec4 uMercuryDrops[LENS_COUNT];
  uniform vec4 uMercuryShape[LENS_COUNT];
  uniform vec3 uMercuryContact[LENS_COUNT];
  uniform vec4 uMercuryOrb;
  uniform vec4 uMercuryGlobe;
  uniform mat3 uMercuryGlobeBasis;
  uniform sampler2D uMercuryInk, uMercuryCoast;
  uniform float uMercuryFov, uMercuryGlobeMix;
  uniform float uMercuryOpacity, uMercuryCopy, uMercuryTime, uMercuryCompact;

  float limitMercuryEdge(float distance) {
    const float limit = 0.042;
    const float width = 0.033;
    float smoothing = max(1.0 - abs(distance - limit) / width, 0.0);
    return min(distance, limit) - width * smoothing * smoothing * smoothing / 6.0;
  }

  vec2 mercuryField(vec2 p) {
    float distanceToBody = 10.0;
    float radius = 0.12;
    for (int i = 0; i < LENS_COUNT; i++) {
      if (i >= uMercuryCount) break;
      vec4 drop = uMercuryDrops[i];
      if (drop.z < 0.001) continue;
      vec2 offset = p - drop.xy;
      vec3 pull = uMercuryContact[i];
      // Leave room beyond the silhouette for deformed tips and their joining field.
      float reach = drop.z * (2.05 + max(drop.w, 0.0) + pull.z) + 0.035;
      if (dot(offset, offset) > reach * reach) continue;
      vec4 shape = uMercuryShape[i];
      vec2 direction = shape.xy;
      float stretch = 1.0 + drop.w;
      // Stretch the facing surface towards its neighbour while leaving the far side round.
      float facing = dot(offset, pull.xy) / (drop.z * max(pull.z, 0.015));
      float tip = clamp((facing - 0.05) / 1.10, 0.0, 1.0);
      float tipShape = tip * tip * tip * (tip * (6.0 * tip - 15.0) + 10.0);
      offset -= drop.z * pull.xy * tipShape;
      vec2 local = vec2(dot(offset, direction) / stretch,
                        dot(offset, vec2(-direction.y, direction.x)) * stretch) / drop.z;
      // Give each lens a wider shoulder and a rounded, off-axis tip.
      float along = clamp(local.x, -1.4, 1.4);
      local.y = (local.y - shape.w * (along * along - 0.35)) * (1.0 + shape.z * along);
      float edge = (dot(local, local) - 1.0) * drop.z * (0.5 / stretch);
      float pairRadius = min(radius, drop.z);
      float gap = min(0.016, 0.4 * pairRadius) + (0.22 + 1.8 * pull.z) * pairRadius;
      float overlap = max(1.0 - abs(distanceToBody - edge) / gap, 0.0);
      float blend = 0.5 * overlap * overlap;
      blend = mix(blend, 1.0 - blend, step(edge, distanceToBody));
      distanceToBody = min(distanceToBody, edge) - gap * overlap * overlap * overlap / 6.0;
      radius = mix(radius, drop.z, blend);
    }
    // Keep derivatives local to the liquid edge, away from the broad-phase cutoff.
    return vec2(limitMercuryEdge(distanceToBody), radius);
  }

  vec3 mercuryShade(vec3 color, vec2 uv) {
    float x = uv.x;
    float shade = mix(0.5843, 0.2902, clamp(x / 0.28, 0.0, 1.0));
    shade *= 1.0 - clamp((x - 0.28) / 0.26, 0.0, 1.0);
    if (uMercuryCompact > 0.5) shade = 0.5647 * (1.0 - clamp((1.0 - uv.y) / 0.55, 0.0, 1.0));
    return mix(color, vec3(0.00122, 0.00243, 0.00651), shade);
  }

  vec3 mercuryBackdrop(vec2 uv) {
    vec2 at = clamp(uv, 0.0, 1.0);
    vec4 front = texture2D(image, at);
    vec3 back = texture2D(uGlassField, at).rgb;
    return mercuryShade(mix(back, front.rgb + back * (1.0 - front.a), 0.92), at);
  }

  vec3 frostedMercury(vec2 uv, float blurSize) {
    vec2 horizontal = vec2(blurSize / uAspect, 0.0);
    vec2 vertical = vec2(0.0, blurSize);
    vec3 soft = mercuryBackdrop(uv) * 0.24;
    soft += (mercuryBackdrop(uv + horizontal) + mercuryBackdrop(uv - horizontal)
           + mercuryBackdrop(uv + vertical) + mercuryBackdrop(uv - vertical)) * 0.12;
    vec2 diagonal = 0.74 * (horizontal + vertical);
    vec2 crossDiagonal = 0.74 * (horizontal - vertical);
    soft += (mercuryBackdrop(uv + diagonal) + mercuryBackdrop(uv - diagonal)
           + mercuryBackdrop(uv + crossDiagonal) + mercuryBackdrop(uv - crossDiagonal)) * 0.07;
    return soft;
  }

  vec3 applyMercuryLens(vec3 sceneColor) {
    if (uMercuryOpacity < 0.002) return sceneColor;
    vec4 ink = texture2D(uMercuryInk, vUv);
    vec3 clear = mix(mercuryShade(sceneColor, vUv), ink.rgb, ink.a * uMercuryCopy);
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    vec2 field = mercuryField(p);
    vec3 rayToGlobe = vec3(0.0, 0.0, -1.0);
    vec3 closest = vec3(0.0);
    float globeEdge = 0.0;
    float projectedEdge = 0.0;
    if (uMercuryOrb.w > 0.0) {
      rayToGlobe = normalize(vec3(2.0 * p * uMercuryFov, -1.0));
      closest = rayToGlobe * dot(rayToGlobe, uMercuryGlobe.xyz) - uMercuryGlobe.xyz;
      float globeRadius = uMercuryGlobe.w;
      globeEdge = dot(closest, closest) - globeRadius * globeRadius;
      projectedEdge = globeEdge * uMercuryOrb.z / (2.0 * globeRadius * globeRadius);
      field = mix(field, vec2(limitMercuryEdge(projectedEdge), uMercuryOrb.z), uMercuryOrb.w);
    }
    float distanceToBody = field.x;
    float radius = max(0.005, field.y);
    vec2 gradient = vec2(dFdx(distanceToBody), dFdy(distanceToBody));
    float gradientSize = length(gradient);
    float rimWidth = clamp(fwidth(distanceToBody) * 0.56, 0.44 / uGlassSize.y, 3.0 / uGlassSize.y);
    float coverage = 1.0 - smoothstep(-rimWidth, rimWidth, distanceToBody);
    float depth = max(0.0, -distanceToBody);
    if (coverage <= 0.001) return clear;

    // Curve the face as well as the rolled edge so the studio reflects across the lens.
    vec2 outward = gradient / max(gradientSize, 0.08 / uGlassSize.y);
    float bevel = depth / (0.006 + 0.23 * radius);
    float shoulder = exp(-2.5 * bevel);
    float inner = smoothstep(0.0, 1.1, bevel);
    vec2 slope = outward * (2.3 * shoulder) + gradient * uGlassSize.y * 1.22;
    vec3 normal = normalize(vec3(slope, 1.0));
    vec2 refraction = normal.xy * vec2(1.0 / uAspect, 1.0);
    float bend = (0.008 + 0.057 * radius) * smoothstep(0.0, 0.49, bevel);
    vec2 lens = clamp(vUv - refraction * bend, 0.0, 1.0);
    vec3 blurred = frostedMercury(lens, 0.014 + 0.013 * inner);
    float time = uMercuryTime;
    vec2 lighting = normalize(vec2(-0.53 + 0.18 * sin(time * 0.40), 0.86));
    float litSide = clamp(0.5 + 0.5 * dot(outward, lighting), 0.0, 1.0);
    float opposingSide = clamp(0.5 + 0.5 * dot(outward, vec2(0.82, -0.57)), 0.0, 1.0);
    float catchLight = pow(litSide, 6.0) + 0.64 * pow(opposingSide, 10.0);
    vec3 prism = chromeFilm(0.30 + 0.36 * outward.x - 0.26 * outward.y
                            + 0.31 * bevel + 0.037 * sin(time * 0.49 + 6.0 * p.y));
    vec3 ice = vec3(0.73, 0.88, 1.07);
    vec3 eye = vec3(0.0, 0.0, 1.0);
    vec3 ray = reflect(-eye, normal);
    float lightBand = ray.y + 0.42 * ray.x + 0.24 * ray.x * ray.x
                    - 0.09 * ray.z + 0.07 * sin(time * 0.57 + ray.x * 2.2);
    float flag = glassBand(lightBand + 0.07, 0.20);
    float key = glassBand(lightBand - 0.51, 0.058);
    float wash = glassBand(lightBand - 0.30, 0.19);
    float bounce = glassBand(lightBand + 0.57, 0.135) * smoothstep(-0.86, 0.55, ray.x);
    vec3 coating = chromeFilm(0.43 + 0.20 * ray.x - 0.30 * lightBand + 0.038 * sin(time * 0.58));
    vec3 liquid = blurred * (0.62 + 0.25 * inner) + vec3(0.0035, 0.0047, 0.013) * inner;
    vec3 studio = shadeGlass(normal, eye, time, 1.0, 0.70).rgb;
    float studioPeak = max(studio.r, max(studio.g, studio.b));
    studio /= 1.0 + 0.48 * studioPeak;
    vec3 studioTint = mix(vec3(0.72, 0.80, 1.0), 0.43 + 0.44 * coating, 0.42);
    liquid += studio * studioTint * (0.31 + 0.37 * inner) * (1.0 - 0.84 * flag);
    liquid += (coating * wash * 0.235 + mix(ice, coating, 0.33) * key * 0.29
             + mix(coating, vec3(0.25, 0.11, 0.64), 0.56) * bounce * 0.32) * (0.24 + 0.76 * inner);
    // Use screen-space widths so the silver contour stays crisp as the drops move and merge.
    float pixel = max(gradientSize, rimWidth);
    float outerLine = glassBand(distanceToBody + 1.4 * pixel, 0.88 * pixel);
    float darkLine = glassBand(bevel - 0.13, 0.077);
    float prismLine = glassBand(bevel - 0.24, 0.049);
    float reflection = glassBand(bevel - (0.42 + 0.16 * litSide), 0.069 + 0.08 * opposingSide);
    float polish = glassBand(bevel - (0.305 + 0.046 * opposingSide), 0.025);
    liquid += prism * prismLine * (0.048 + 0.52 * catchLight);
    liquid += mix(prism, ice, catchLight * 0.59) * reflection * (0.038 + 0.38 * catchLight);
    liquid += ice * polish * (0.62 * pow(litSide, 14.0) + 0.46 * pow(opposingSide, 16.0));
    liquid *= 1.0 - darkLine * (0.79 - 0.20 * catchLight);
    liquid += mix(ice, prism, 0.42) * outerLine * (0.074 + 0.44 * pow(litSide, 4.0) + 0.19 * pow(opposingSide, 7.0));

    if (uMercuryGlobeMix > 0.001) {
      // The rounded liquid uses the same projection, lighting and coastline as the globe.
      vec3 globeNormal = normalize(closest - rayToGlobe * sqrt(max(0.0, -globeEdge)));
      vec2 orbUV = (p - uMercuryOrb.xy) / uMercuryOrb.z;
      float sweep = 0.48 + 0.15 * orbUV.y + 0.10 * orbUV.x + 0.043 * sin(5.0 * orbUV.x + 2.0 * orbUV.y);
      float settled = smoothstep(sweep - 0.22, sweep + 0.22, uMercuryGlobeMix);
      settled *= mix(smoothstep(0.0, 0.036, -projectedEdge), 1.0, uMercuryOrb.w);
      vec3 rippleNormal = normalize(globeNormal + vec3(normal.xy, 0.0) * (0.15 * (1.0 - settled)));
      vec3 geography = normalize(uMercuryGlobeBasis * rippleNormal);
      vec2 coastUV = vec2(atan(-geography.z, geography.x) / 6.2831853072 + 0.5,
                         asin(clamp(geography.y, -1.0, 1.0)) / 3.1415926536 + 0.5);
      vec4 atlas = shadeGlassGlobe(globeNormal, -rayToGlobe, geography, texture2D(uMercuryCoast, coastUV), uChartTime);
      vec3 surface = mercuryShade(mix(texture2D(uGlassField, vUv).rgb, atlas.rgb, atlas.a), vUv);
      liquid = mix(liquid, surface, settled);
    }
    if (uMercuryCopy > 0.001) {
      vec4 throughInk = texture2D(uMercuryInk, lens);
      vec2 smear = refraction * (0.0014 + 0.0018 * shoulder);
      vec4 nearInk = texture2D(uMercuryInk, clamp(lens + smear, 0.0, 1.0));
      vec4 farInk = texture2D(uMercuryInk, clamp(lens - smear, 0.0, 1.0));
      float inkOpacity = 0.76 * throughInk.a + 0.12 * (nearInk.a + farInk.a);
      // A soft dark rim behind the refracted glyphs keeps them legible on a bright catch.
      float inkEdge = max(nearInk.a, farInk.a);
      liquid *= 1.0 - (0.23 * inkOpacity + 0.38 * inkEdge) * uMercuryCopy;
      vec3 letterColor = mix(throughInk.rgb * 0.91, vec3(0.60, 0.75, 0.98), 0.19 + 0.12 * shoulder);
      liquid = mix(liquid, letterColor, inkOpacity * uMercuryCopy);
    }
    return mix(clear, liquid, coverage * uMercuryOpacity);
  }
`;

function textLines(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  const lines = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    for (let offset = 0; offset < node.length; offset++) {
      range.setStart(node, offset);
      range.setEnd(node, offset + 1);
      const bounds = range.getBoundingClientRect();
      if (bounds.width < 0.01 || bounds.height < 0.01) continue;
      let line = lines.at(-1);
      if (!line || Math.abs(line.top - bounds.top) > 1) {
        line = {text: '', left: bounds.left, top: bounds.top, height: bounds.height};
        lines.push(line);
      }
      line.text += node.data[offset];
    }
  }
  return lines;
}

export function createMercuryLens(content, screenCenter) {
  const artwork = document.createElement('canvas');
  const pen = artwork.getContext('2d');
  const drops = [...profiles, ...smallProfiles].map((profile, index) => ({...profile, small: index >= profiles.length,
    position: new T.Vector2(), velocity: new T.Vector2(), target: new T.Vector2(),
    axis: new T.Vector2(1, 0), pull: new T.Vector2(), pullVelocity: new T.Vector2(), contactPull: new T.Vector2(),
    radiusNow: 0, angle: 0, strain: 0, strainSpeed: 0, contact: 0, stretch: 0}));
  const uniforms = {
    uMercuryInk: {value: null}, uMercuryCopy: {value: 0}, uMercuryOpacity: {value: 0},
    uMercuryTime: {value: 0}, uMercuryCompact: {value: 0}, uMercuryCount: {value: profiles.length},
    uMercuryDrops: {value: drops.map(() => new T.Vector4())},
    uMercuryShape: {value: drops.map(() => new T.Vector4(1, 0, 0, 0))},
    uMercuryContact: {value: drops.map(() => new T.Vector3())},
    uMercuryOrb: {value: new T.Vector4(0, 0, 0.24, 0)},
    uMercuryGlobe: {value: new T.Vector4(0, 0, -1, 0.2)},
    uMercuryGlobeBasis: {value: new T.Matrix3()},
    uMercuryCoast: {value: null}, uMercuryFov: {value: 0.4}, uMercuryGlobeMix: {value: 0}
  };
  const orb = uniforms.uMercuryOrb.value;
  let activeDrops = drops.slice(0, profiles.length);
  let initializedCount = 0;
  let aspect = 1, active = false, inkReady = false, previousTime = 0, inkDirty = true;
  let inkLayout = '';

  function layout(width, height) {
    aspect = width / height;
    uniforms.uMercuryCompact.value = width <= 650 ? 1 : 0;
    const extra = width >= 1050 ? clamp(Math.round((aspect - 1.23) * 16), 0, smallProfiles.length) : 0;
    const count = profiles.length + extra;
    if (activeDrops.length !== count) {
      activeDrops = drops.slice(0, count);
      initializedCount = Math.min(initializedCount, count);
      uniforms.uMercuryCount.value = count;
    }
    inkDirty = true;
  }

  function renderInk() {
    if (!pen) return;
    const width = innerWidth, height = innerHeight;
    const dpr = Math.min(devicePixelRatio, 2);
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (!uniforms.uMercuryInk.value || artwork.width !== pixelWidth || artwork.height !== pixelHeight) {
      uniforms.uMercuryInk.value?.dispose();
      artwork.width = pixelWidth;
      artwork.height = pixelHeight;
      const texture = new T.CanvasTexture(artwork);
      texture.colorSpace = T.SRGBColorSpace;
      texture.minFilter = texture.magFilter = T.LinearFilter;
      texture.generateMipmaps = false;
      uniforms.uMercuryInk.value = texture;
    } else {
      pen.resetTransform();
      pen.clearRect(0, 0, pixelWidth, pixelHeight);
    }
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    pen.textBaseline = 'alphabetic';
    for (const element of content.querySelectorAll('h2, p')) {
      const style = getComputedStyle(element);
      pen.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      pen.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
      pen.fillStyle = style.color;
      for (const line of textLines(element)) {
        const metrics = pen.measureText(line.text);
        const ascent = metrics.fontBoundingBoxAscent ?? line.height * 0.8;
        const descent = metrics.fontBoundingBoxDescent ?? line.height * 0.2;
        const baseline = line.top + (line.height + ascent - descent) * 0.5;
        pen.fillText(line.text, line.left, baseline);
      }
    }
    uniforms.uMercuryInk.value.needsUpdate = true;
    inkDirty = false;
    inkReady = true;
  }
  document.fonts.ready.then(() => { inkDirty = true; });

  function placeTargets(time, spread, followScroll) {
    const homeX = (screenCenter.x - 0.5) * aspect;
    const homeY = screenCenter.y - 0.5;
    const footprint = Math.min(1, aspect / 0.88);
    for (const drop of activeDrops) {
      const wave = time * (drop.small ? 1.14 + 0.23 * Math.abs(Math.sin(drop.phase)) : 0.98) + drop.phase;
      const tide = Math.sin(wave) + 0.26 * Math.sin(2.0 * wave - drop.phase);
      const horizontal = (drop.x - 0.5) * aspect + (drop.small ? 0.099 : 0.117) * footprint * tide;
      const vertical = drop.y - 0.5 + (drop.small ? 0.103 : 0.145) * Math.sin(wave * 0.85 + drop.phase * 0.57);
      const x = T.MathUtils.lerp(homeX, horizontal, spread);
      const y = T.MathUtils.lerp(homeY, vertical, spread);
      if (followScroll) {
        drop.position.x += x - drop.target.x;
        drop.position.y += y - drop.target.y;
      }
      drop.target.set(x, y);
      drop.radiusNow = drop.radius * footprint * (0.69 + 0.31 * spread) * (1 + 0.043 * Math.cos(wave));
    }
  }

  function step(dt, spread) {
    for (const drop of activeDrops) {
      drop.velocity.x += (drop.target.x - drop.position.x) * 19 * dt;
      drop.velocity.y += (drop.target.y - drop.position.y) * 19 * dt;
      drop.contact = 0;
      drop.contactPull.set(0, 0);
    }
    for (let i = 0; i < activeDrops.length; i++) {
      const a = activeDrops[i];
      for (let j = i + 1; j < activeDrops.length; j++) {
        const b = activeDrops[j];
        const dx = b.position.x - a.position.x, dy = b.position.y - a.position.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 0.0001) continue;
        const x = dx / distance, y = dy / distance;
        const reach = dropReach(a, x, y) + dropReach(b, x, y);
        const separation = distance / reach;
        if (separation >= 1.36) continue;
        const proximity = 1 - smoothstep(separation, 0.88, 1.36);
        const compression = Math.max(0, 0.96 - separation);
        const normalSpeed = (b.velocity.x - a.velocity.x) * x + (b.velocity.y - a.velocity.y) * y;
        // A short-range attraction joins the tips. Compression and velocity then push them apart.
        const attraction = 1.35 * proximity * smoothstep(separation, 0.76, 1.07);
        const rebound = Math.max(0, 55 * compression * reach - 2.1 * normalSpeed)
                      * (1 - smoothstep(separation, 0.83, 1.02));
        const impulse = (rebound - attraction) * spread * dt;
        const share = 0.35 + 1.30 * b.radiusNow ** 2 / (a.radiusNow ** 2 + b.radiusNow ** 2);
        a.velocity.x -= x * impulse * share;
        a.velocity.y -= y * impulse * share;
        b.velocity.x += x * impulse * (2 - share);
        b.velocity.y += y * impulse * (2 - share);
        const tension = proximity * (0.32 - 0.14 * smoothstep(compression, 0, 0.44)) * spread;
        const influenceA = b.small ? Math.min(1, b.radiusNow / a.radiusNow) : 1;
        const influenceB = a.small ? Math.min(1, a.radiusNow / b.radiusNow) : 1;
        a.contactPull.x += x * tension * influenceA;
        a.contactPull.y += y * tension * influenceA;
        b.contactPull.x -= x * tension * influenceB;
        b.contactPull.y -= y * tension * influenceB;
        const pressure = 0.37 * proximity + 0.92 * compression;
        a.contact = Math.max(a.contact, pressure * influenceA);
        b.contact = Math.max(b.contact, pressure * influenceB);
      }
    }
    for (const drop of activeDrops) {
      drop.velocity.multiplyScalar(Math.exp(-3.3 * dt));
      drop.position.addScaledVector(drop.velocity, dt);
      const speed = drop.velocity.length();
      const flex = Math.sin(previousTime * 1.62 + drop.phase);
      const strain = clamp(speed * 0.49 + (drop.contact * 0.76 + 0.11 * flex) * spread, -0.14, 0.64);
      drop.strainSpeed = (drop.strainSpeed + (strain - drop.strain) * 42 * dt) * Math.exp(-3.9 * dt);
      drop.strain = clamp(drop.strain + drop.strainSpeed * dt, -0.19, 0.70);
      drop.stretch = drop.elongation * (0.46 + 0.54 * spread) + 0.66 * drop.strain;
      drop.contactPull.clampLength(0, 0.37);
      drop.pullVelocity.x += (drop.contactPull.x - drop.pull.x) * 76 * dt;
      drop.pullVelocity.y += (drop.contactPull.y - drop.pull.y) * 76 * dt;
      drop.pullVelocity.multiplyScalar(Math.exp(-5.2 * dt));
      drop.pull.addScaledVector(drop.pullVelocity, dt).clampLength(0, 0.40);
      const sway = drop.tilt + 0.33 * Math.sin(previousTime * 0.81 + drop.phase);
      const alignment = drop.contactPull.x * Math.cos(sway) + drop.contactPull.y * Math.sin(sway);
      const twist = drop.contactPull.y * Math.cos(sway) - drop.contactPull.x * Math.sin(sway);
      const heading = sway - 6.1 * alignment * twist;
      drop.angle += (heading - drop.angle) * (1 - Math.exp(-6.2 * dt));
      drop.axis.set(Math.cos(drop.angle), Math.sin(drop.angle));
    }
  }

  function update(opacity, copyAmount, spread, gather, time, globeMix = 0) {
    const visible = opacity >= 0.002;
    if (visible !== active) document.body.classList.toggle('mercury-lens-open', visible);
    uniforms.uMercuryOpacity.value = visible ? opacity : 0;
    uniforms.uMercuryCopy.value = 0;
    if (!visible) { active = false; return 0; }
    const motion = spread * (1 - 0.40 * gather);
    placeTargets(time, motion, active && time === previousTime);
    if (!active) {
      initializedCount = 0;
      previousTime = time;
    }
    for (let i = initializedCount; i < activeDrops.length; i++) {
      const drop = activeDrops[i];
      drop.position.copy(drop.target);
      drop.velocity.set(0, 0);
      drop.angle = drop.tilt;
      drop.axis.set(Math.cos(drop.angle), Math.sin(drop.angle));
      drop.pull.set(0, 0);
      drop.pullVelocity.set(0, 0);
      drop.strain = drop.strainSpeed = 0;
      drop.stretch = drop.elongation * (0.46 + 0.54 * motion);
    }
    initializedCount = activeDrops.length;
    active = true;
    let elapsed = clamp(time - previousTime, 0, 0.05);
    previousTime = time;
    while (elapsed > 0.00001) {
      const dt = Math.min(elapsed, 1 / 100);
      step(dt, motion);
      elapsed -= dt;
    }
    orb.x = (screenCenter.x - 0.5) * aspect;
    orb.y = screenCenter.y - 0.5;
    orb.w = smoothstep(gather, 0.38, 1);
    uniforms.uMercuryGlobeMix.value = uniforms.uMercuryCoast.value ? globeMix : 0;
    const convergence = smoothstep(gather, 0.06, 1);
    const fluid = 1 - convergence;
    const curl = 0.46 * Math.sin(Math.PI * convergence);
    const cos = Math.cos(curl) * fluid;
    const sin = Math.sin(curl) * fluid;
    for (let i = 0; i < activeDrops.length; i++) {
      const drop = activeDrops[i];
      const flex = Math.sin(time * 1.62 + drop.phase);
      const sidePull = drop.pull.y * drop.axis.x - drop.pull.x * drop.axis.y;
      const endPull = drop.pull.dot(drop.axis);
      const taper = clamp(drop.taper + 0.33 * endPull + 0.086 * flex * spread, -0.44, 0.44);
      const bend = drop.bend + 0.75 * sidePull + 0.13 * flex * spread;
      const dx = drop.position.x - orb.x, dy = drop.position.y - orb.y;
      const x = orb.x + dx * cos - dy * sin;
      const y = orb.y + dx * sin + dy * cos;
      const radius = T.MathUtils.lerp(drop.radiusNow, drop.radius * orb.z / widestDrop, orb.w);
      uniforms.uMercuryDrops.value[i].set(x, y, radius, drop.stretch * fluid);
      uniforms.uMercuryShape.value[i].set(drop.axis.x, drop.axis.y, taper * fluid, bend * fluid);
      uniforms.uMercuryContact.value[i].set(drop.pull.x * fluid, drop.pull.y * fluid, drop.pull.length() * fluid);
    }
    uniforms.uMercuryTime.value = time;
    if (copyAmount > 0.002) {
      const bounds = content.getBoundingClientRect();
      const signature = [bounds.left, bounds.top, bounds.width, bounds.height].join('/');
      if (signature !== inkLayout) { inkLayout = signature; inkDirty = true; }
      if (inkDirty) renderInk();
      if (inkReady) uniforms.uMercuryCopy.value = copyAmount * smoothstep(opacity, 0.02, 0.30);
    }
    return uniforms.uMercuryCopy.value;
  }

  function alignGlobe(view, projection, radius) {
    const {elements} = view;
    uniforms.uMercuryGlobe.value.set(elements[12], elements[13], elements[14], radius);
    uniforms.uMercuryGlobeBasis.value.setFromMatrix4(view).transpose();
    uniforms.uMercuryFov.value = 1 / projection.elements[5];
  }

  return {uniforms, layout, update, alignGlobe, setGlobeRadius: radius => { orb.z = radius; }};
}
