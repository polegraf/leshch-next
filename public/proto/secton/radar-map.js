import * as T from './three.module.js';
import {geographicFilm, limePointPalette, radarSweep, waterRamp} from './shader-style.js?v=43';
import {glassAtmosphere} from './glass-style.js?v=12';

// Broad ridges give the schematic landforms a topographic silhouette.
const ridges = [
  [-113, 45, 29, 7.5, 117, 0.96], [-102, 25, 16, 6.8, 113, 0.37],
  [-69, -22, 32, 6.0, 103, 1.06], [-48, -16, 16, 9.0, 132, 0.42],
  [-42, 71, 18, 12, 82, 0.65], [16, 48, 13, 6.7, -17, 0.59],
  [-7, 29, 13, 6.0, 17, 0.45], [38, 1, 22, 9.0, 81, 0.76],
  [27, -24, 14, 8.0, 32, 0.42], [83, 33, 24, 8.2, -9, 1.07],
  [104, 51, 23, 10, 22, 0.53], [140, 63, 21, 8.5, -28, 0.47],
  [143, -21, 15, 8.5, 113, 0.59], [107, 18, 13, 6.7, 110, 0.41]
].map(([lon, lat, length, width, angle, height]) => {
  const bearing = T.MathUtils.degToRad(angle);
  return {lon, lat, length, width, height, x: Math.cos(bearing), y: Math.sin(bearing)};
});

function elevation(lon, lat, coast, interior) {
  if (coast <= 0.53) return 0;
  const x = lon + 1.3 * Math.sin(lat * 0.14 + lon * 0.055);
  const y = lat + 0.9 * Math.sin(lon * 0.14 - lat * 0.085);
  let height = 0.29 + 0.055 * Math.cos(lon * 0.075 + lat * 0.10);
  for (const ridge of ridges) {
    const dx = x - ridge.lon;
    const dy = y - ridge.lat;
    const along = (dx * ridge.x + dy * ridge.y) / ridge.length;
    const across = (dy * ridge.x - dx * ridge.y) / ridge.width;
    height += ridge.height * 0.42 * Math.exp(-0.58 * (along * along + across * across));
  }
  const shoreFalloff = T.MathUtils.smoothstep(coast, 0.53, 0.97);
  const foothills = 0.76 + 0.24 * T.MathUtils.smoothstep(interior, 0.40, 0.92);
  return Math.min(1, height * 0.78 * shoreFalloff * foothills);
}

function blurCoverage(source, width, height, radius) {
  const horizontal = new Float32Array(source.length);
  const output = new Float32Array(source.length);
  const span = radius * 2 + 1;
  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += source[row + (x + width) % width];
    for (let x = 0; x < width; x++) {
      horizontal[row + x] = sum / span;
      sum += source[row + (x + radius + 1) % width]
           - source[row + (x - radius + width) % width];
    }
  }
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += horizontal[Math.max(0, y) * width + x];
    for (let y = 0; y < height; y++) {
      output[y * width + x] = sum / span;
      sum += horizontal[Math.min(y + radius + 1, height - 1) * width + x]
           - horizontal[Math.max(y - radius, 0) * width + x];
    }
  }
  return output;
}

function createCoastField(polygons) {
  const canvas = document.createElement('canvas');
  const width = canvas.width = 1536;
  const height = canvas.height = 768;
  const context = canvas.getContext('2d', {alpha: false, willReadFrequently: true});
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#fff';
  for (const polygon of polygons) {
    context.beginPath();
    for (const ring of polygon) {
      for (const [index, [longitude, latitude]] of ring.entries()) {
        const x = (longitude + 180) / 360 * width;
        const y = (90 - latitude) / 180 * height;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
    }
    context.fill('evenodd');
  }

  const rgba = context.getImageData(0, 0, width, height).data;
  const coverage = new Float32Array(width * height);
  for (let i = 0; i < coverage.length; i++) coverage[i] = rgba[i * 4];
  // Two scales preserve the main coast shapes and round out the contour field.
  const shore = blurCoverage(blurCoverage(coverage, width, height, 4), width, height, 4);
  const basin = blurCoverage(blurCoverage(shore, width, height, 17), width, height, 17);
  const pixels = new Uint8Array(coverage.length * 4);
  for (let row = 0; row < height; row++) {
    const latitude = 90 - (row + 0.5) * 180 / height;
    for (let column = 0; column < width; column++) {
      const index = row * width + column;
      const longitude = (column + 0.5) * 360 / width - 180;
      const altitude = elevation(longitude, latitude, shore[index] / 255, basin[index] / 255);
      const packed = Math.round(altitude * 65535);
      pixels[index * 4] = Math.round(shore[index]);
      pixels[index * 4 + 1] = Math.round(basin[index]);
      pixels[index * 4 + 2] = packed >> 8;
      pixels[index * 4 + 3] = packed & 255;
    }
  }
  const texture = new T.DataTexture(pixels, width, height, T.RGBAFormat);
  texture.flipY = true;
  texture.wrapS = T.RepeatWrapping;
  texture.minFilter = texture.magFilter = T.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const reliefSampling = `
  vec4 sampleRelief(vec2 geography) {
    vec2 texCoord = (geography + vec2(180.0, 90.0)) / vec2(360.0, 180.0);
    return texture2D(uCoastField, texCoord);
  }
  float unpackElevation(vec4 field) {
    return dot(field.ba, vec2(256.0, 1.0)) / 257.0;
  }
`;

const atlasSwell = `
  float atlasSwell(vec2 geography) {
    vec2 angle = radians(geography);
    vec3 direction = vec3(cos(angle.y) * cos(angle.x), sin(angle.y), -cos(angle.y) * sin(angle.x));
    float a = dot(direction, vec3(8.7, 8.3, -6.4)) + 1.21 * sin(direction.z * 6.8 + 0.62);
    float b = dot(direction, vec3(-11.8, 6.1, 9.7)) + 0.87 * sin(direction.x * 8.2 - 0.43);
    float c = dot(direction, vec3(16.0, -13.3, -10.3));
    return 0.5 + 0.5 * (0.58 * sin(a) + 0.30 * cos(b) + 0.12 * sin(c));
  }
`;

export function createRadarMap(sheet, landPolygons, fold, time, contacts, style, radarUniforms) {
  const terminal = style === 'terminal';
  const chrome = style === 'chrome';
  const glass = style === 'glass' || chrome;
  const particleStudy = style === 'particles' || glass;
  const radar = style === 'radar' || particleStudy;
  const atlas = style === 'atlas' || terminal || radar;
  const uniforms = {
    ...(particleStudy ? radarUniforms : {}),
    uCoastField: {value: createCoastField(landPolygons)},
    uFold: fold,
    uTime: time,
    uOpacity: {value: 0},
    uPatterns: {value: 0},
    uRoutes: {value: 0},
    uScaleY: {value: 1},
    uDotPitch: {value: 1},
    uContacts: {value: contacts.map(({x, y}) => new T.Vector2(x, y))}
  };
  const material = new T.ShaderMaterial({
    uniforms,
    defines: {
      CONTACT_COUNT: contacts.length,
      ...(atlas ? {NIGHT_ATLAS: 1} : {}),
      ...(terminal ? {TERMINAL_MAP: 1} : {}),
      ...(radar ? {RADAR_CHART: 1} : {}),
      ...(particleStudy ? {PARTICLE_STUDY: 1} : {}),
      ...(glass ? {GLASS_STUDY: 1} : {}),
      ...(chrome ? {CHROME_STUDY: 1} : {})
    },
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    forceSinglePass: true,
    vertexShader: `
      attribute vec3 flatPosition;
      uniform sampler2D uCoastField;
      uniform float uFold, uPatterns;
      varying vec2 vGeo, vMap;
      varying vec3 vSurface;
      #ifdef PARTICLE_STUDY
        varying vec3 vGlobePosition;
        varying vec4 vClipPosition;
      #endif
      ${reliefSampling}
      ${atlasSwell}

      void main() {
        vGeo = vec2(uv.x * 360.0 - 180.0, 90.0 - uv.y * 180.0);
        vMap = flatPosition.xy;
        #ifdef PARTICLE_STUDY
          vGlobePosition = position;
        #endif
        vec3 folded = mix(flatPosition, position, uFold);
        vec4 relief = sampleRelief(vGeo);
        float height = unpackElevation(relief);
        float unfold = uPatterns * (1.0 - smoothstep(0.04, 0.40, uFold));
        #if defined(TERMINAL_MAP) || defined(RADAR_CHART)
          folded.z += height * 1.65 * unfold;
        #elif defined(NIGHT_ATLAS)
          float swell = atlasSwell(vGeo) * smoothstep(0.52, 0.95, relief.r);
          folded.z += (1.20 * height + 2.45 * swell) * unfold;
          folded.y += 0.64 * swell * unfold;
        #else
          folded += vec3(-0.38, 1.85, 2.0) * height * unfold;
        #endif
        folded.z += sin(uFold * 3.14159265) * 0.012 * vMap.x * vMap.x + 0.045;
        vSurface = folded;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(folded, 1.0);
        #ifdef PARTICLE_STUDY
          vClipPosition = gl_Position;
        #endif
      }
    `,
    fragmentShader: `
      uniform sampler2D uCoastField;
      uniform float uTime, uOpacity, uPatterns, uRoutes, uScaleY, uDotPitch;
      uniform vec2 uContacts[CONTACT_COUNT];
      varying vec2 vGeo, vMap;
      varying vec3 vSurface;
      ${reliefSampling}
      ${atlasSwell}
      ${waterRamp}
      ${limePointPalette}
      #ifdef PARTICLE_STUDY
        uniform vec2 uRadarCenter;
        uniform float uRadarPhase, uRadarStrength, uRadarSize, uAspect;
        varying vec3 vGlobePosition;
        varying vec4 vClipPosition;
        ${geographicFilm}
        ${radarSweep}
      #endif
      #ifdef GLASS_STUDY
        ${glassAtmosphere}
      #endif

      float lineProfile(float distance, float pixels) {
        float width = max(pixels, 0.0001);
        return 1.0 - smoothstep(0.21, 1.0, abs(distance) / width);
      }

      float contourBands(vec2 geo, float height) {
        // Broad bends keep the bands evenly distributed over plains and ridges.
        float phase = dot(geo, vec2(0.10, 0.37))
                    + 1.65 * sin(dot(geo, vec2(0.067, 0.023)))
                    + 0.72 * sin(dot(geo, vec2(0.034, -0.052)))
                    + height * 0.85;
        float pixel = length(vec2(dFdx(phase), dFdy(phase)));
        float distance = phase - floor(phase + 0.5);
        return lineProfile(distance, pixel * 1.06) * (1.0 - smoothstep(0.30, 0.62, pixel));
      }

      float atlasDots(vec2 chart, float radius) {
        vec2 grid = chart / uDotPitch;
        float pixel = max(length(dFdx(grid)), length(dFdy(grid)));
        grid.x += 0.5 * mod(floor(grid.y + 0.5), 2.0);
        float distance = length(fract(grid + 0.5) - 0.5);
        float aa = max(0.025, pixel * 0.48);
        float core = 1.0 - smoothstep(radius - aa, radius + aa, distance);
        float halo = 1.0 - smoothstep(radius, 0.50, distance);
        return (core * 0.80 + halo * 0.20) * (1.0 - smoothstep(0.48, 0.85, pixel));
      }

      #ifdef TERMINAL_MAP
        float terminalSea(vec2 geo) {
          vec2 p = geo * vec2(0.61, 0.70);
          float tide = uTime * 0.24;
          vec2 warp = vec2(sin(p.y * 0.10 + tide * 0.30), sin(p.x * 0.071 - tide * 0.28));
          p += warp * vec2(8.2, 5.0);
          return sin(p.x * 0.080 + p.y * 0.10 + tide * 0.75) * 3.45
               + cos(p.x * 0.055 - p.y * 0.14 - tide * 0.51) * 2.5
               + sin(p.x * 0.155 + p.y * 0.11 - tide * 0.61) * 0.98;
        }

        float seaContour(float height) {
          float level = height / 0.62;
          float index = floor(level + 0.5);
          float major = 1.0 - step(0.5, mod(index, 4.0));
          float pixel = fwidth(level);
          float aa = min(0.25, pixel * mix(0.67, 0.94, major));
          float line = 1.0 - smoothstep(0.021, 0.022 + aa, abs(level - index));
          return line * mix(0.15, 0.48, major) * (1.0 - smoothstep(0.33, 0.85, pixel));
        }
      #endif

      void main() {
        vec4 field = sampleRelief(vGeo);
        float shore = field.r - 0.5;
        float shorePixel = max(0.010, fwidth(shore));
        float land = smoothstep(-shorePixel * 0.5, shorePixel * 0.5, shore);
        float height = unpackElevation(field);
        vec3 normal = normalize(cross(dFdx(vSurface), dFdy(vSurface)));
        float light = smoothstep(-0.13, 0.89, dot(normal, normalize(vec3(-0.58, 0.68, 0.46))));
        #if defined(PARTICLE_STUDY)
          float sweep = radarSweepAngle(uRadarPhase);
          vec2 phase = geographicFoldPhase(vGlobePosition, sweep * 0.48);
          vec2 ribbons = geographicFoldRims(phase) * (1.0 - 0.36 * uRadarStrength);
          vec2 chart = vMap * vec2(1.0, uScaleY);
          vec2 warp = vec2(0.85 * sin(phase.y + 0.42 * cos(phase.x)), 1.46 * sin(phase.x));
          float beam = 0.0, wakeLight = 0.0;
          if (uRadarStrength > 0.0) {
            vec2 screen = 0.5 + 0.5 * vClipPosition.xy / vClipPosition.w;
            vec2 contact = radarPoint(screen, uRadarCenter, uAspect);
            float radius = length(contact);
            float age = radarSweepAge(sweep, radarBearing(contact));
            float mask = uRadarStrength * smoothstep(0.025, 0.09, radius)
                       * (1.0 - smoothstep(uRadarSize * 0.88, uRadarSize + 0.06, radius));
            beam = radarFreshTrace(age, sweep) * mask;

            // Each wave curves outward behind the beam and fades with its angular distance.
            float energy = mask * radarWakeWeight(age, sweep);
            float wake = age * 20.0 - radius * 18.0 + 0.72 * sin(phase.x);
            float crest = pow(0.5 + 0.5 * cos(wake), 4.0) * energy;
            float echo = pow(0.5 + 0.5 * sin(wake), 4.0) * energy;
            ribbons = min(vec2(1.0), max(ribbons, vec2(beam, 0.0)) + vec2(0.94 * crest, 0.86 * echo));
            wakeLight = crest + 0.20 * echo;
            vec2 radial = contact / max(0.001, radius);
            vec2 tangent = vec2(radial.y, -radial.x);
            warp += (0.73 * radial + tangent) * (2.20 * sin(wake) * energy);
          }
          vec2 lattice = chart + warp * mix(1.0, 0.48, land);
          float seaFade = smoothstep(-76.0, -48.0, vGeo.y) * (1.0 - smoothstep(69.0, 87.0, vGeo.y));
          #ifdef GLASS_STUDY
            float sweepLight = clamp(0.68 * beam + 1.15 * wakeLight, 0.0, 1.0);
            float softLight = 0.5 + 0.5 * cos(phase.x * 0.63 + 0.18 * warp.y);
            float landGlaze = land * (0.41 + 0.14 * softLight + 0.23 * sweepLight);
            float seaGlaze = (1.0 - land) * seaFade * (0.20 + 0.12 * softLight + 0.32 * sweepLight);
            vec3 landTone = mix(vec3(0.036, 0.092, 0.15), vec3(0.18, 0.34, 0.44), 0.30 * softLight + 0.64 * sweepLight + 0.04 * height);
            vec3 seaTone = mix(vec3(0.009, 0.030, 0.076), vec3(0.11, 0.33, 0.69), softLight * 0.18 + sweepLight * 0.67);
            vec3 prisma = glassSpectrum(0.69 + 0.19 * sin(phase.x * 0.72) - 0.26 * wakeLight);
            seaTone += prisma * ribbons.y * wakeLight * 0.35;
            landTone += prisma * sweepLight * 0.14;
            float pattern = (landGlaze + seaGlaze) * uPatterns;
            vec3 patternColor = (landTone * landGlaze + seaTone * seaGlaze) * uPatterns;
            float coastline = lineProfile(shore, shorePixel * 1.23) * (0.14 + 0.13 * sweepLight);
            vec3 coastInk = vec3(0.24, 0.40, 0.50);
            vec3 landInk = vec3(0.027, 0.046, 0.069);
            float landOpacity = 0.22;
            #ifdef CHROME_STUDY
              vec3 film = chromeFilm(0.90 - 0.24 * sin(phase.x * 0.63) - 0.28 * wakeLight);
              landTone = mix(vec3(0.030, 0.030, 0.073), vec3(0.25, 0.28, 0.47), sweepLight);
              seaTone = vec3(0.008, 0.014, 0.049) + film * wakeLight * ribbons.y * 0.41;
              patternColor = (landTone * landGlaze + seaTone * seaGlaze) * uPatterns;
              coastInk = vec3(0.37, 0.36, 0.61);
              landInk = vec3(0.021, 0.022, 0.045);
            #endif
          #else
          float landDots = atlasDots(lattice, mix(0.17, 0.225, ribbons.x))
                         * land * (0.26 + height * 0.17 + 0.42 * ribbons.x + 0.075 * ribbons.y + 0.18 * beam + 0.25 * wakeLight);
          float seaDots = atlasDots(lattice * 0.88, mix(0.14, 0.215, ribbons.x))
                        * (1.0 - land) * seaFade * (0.08 + 0.43 * ribbons.x + 0.21 * ribbons.y + 0.24 * beam + 0.36 * wakeLight);
          vec3 landTone = mix(vec3(0.09, 0.46, 0.66), vec3(0.27, 0.86, 1.0), ribbons.x);
          vec3 seaTone = mix(vec3(0.054, 0.14, 0.57), vec3(0.53, 0.063, 0.89), 0.84 * ribbons.y);
          seaTone = mix(seaTone, vec3(0.11, 0.52, 0.95), 0.76 * ribbons.x);
          float pattern = (landDots + seaDots) * uPatterns;
          vec3 patternColor = (landTone * landDots + seaTone * seaDots) * uPatterns;
          float coastline = lineProfile(shore, shorePixel * 0.88) * (0.21 + 0.09 * ribbons.x);
          vec3 coastInk = vec3(0.21, 0.48, 0.64);
          vec3 landInk = vec3(0.024, 0.060, 0.096);
          float landOpacity = 0.32;
          #endif
        #elif defined(RADAR_CHART)
          vec2 chart = vMap * vec2(1.0, uScaleY);
          float interior = smoothstep(0.13, 0.48, height);
          float illumination = 0.27 + 0.27 * light + 0.42 * interior;
          float pattern = atlasDots(chart, 0.22) * land * mix(0.26, 0.54, illumination) * uPatterns;
          vec3 patternColor = mix(vec3(0.10, 0.27, 0.62), vec3(0.21, 0.65, 0.96), illumination) * pattern;
          float coastline = lineProfile(shore, shorePixel * 0.89) * (0.25 + 0.11 * illumination);
          vec3 coastInk = vec3(0.24, 0.53, 0.83);
          vec3 landInk = vec3(0.022, 0.051, 0.101);
          float landOpacity = 0.36;
        #elif defined(TERMINAL_MAP)
          vec2 chart = vMap * vec2(1.0, uScaleY);
          float rim = 1.0 - smoothstep(0.48, 0.95, field.g);
          float reliefLight = smoothstep(0.10, 0.47, height);
          float lighting = clamp(0.24 + light * 0.45 + reliefLight * 0.25, 0.0, 1.0);
          float accent = clamp(0.40 + reliefLight * 0.48 + rim * 0.16, 0.0, 1.0);
          vec3 landDotsInk = limePointColor(lighting, accent);
          float landDots = atlasDots(chart, 0.23) * land * mix(0.40, 0.80, lighting);
          float coastline = lineProfile(shore, shorePixel * 0.91) * (0.16 + 0.19 * lighting);
          vec3 coastInk = limePointColor(lighting, 0.88);
          vec3 landInk = mix(vec3(0.029, 0.046, 0.015), vec3(0.087, 0.122, 0.037), lighting);
          float landOpacity = 0.43;

          float seaHeight = terminalSea(vGeo);
          float waterLight = smoothstep(-4.8, 4.2, seaHeight);
          float seaFade = smoothstep(-62.0, -48.0, vGeo.y) * (1.0 - smoothstep(71.0, 89.0, vGeo.y));
          float offshore = 1.0 - smoothstep(-0.11, -0.008, shore);
          vec2 waterGrid = chart * 0.74 + vec2(0.0, seaHeight * 0.071) * uDotPitch;
          float seaDots = atlasDots(waterGrid, 0.21) * mix(0.23, 0.43, waterLight);
          float seaLines = seaContour(seaHeight);
          float seaPattern = (seaDots * (1.0 - seaLines) + seaLines) * seaFade * offshore;
          float pattern = (landDots + seaPattern) * uPatterns;
          vec3 patternColor = (landDotsInk * landDots + waterColor(waterLight) * seaPattern) * uPatterns;
        #elif defined(NIGHT_ATLAS)
          vec2 coastGradient = vec2(dFdx(shore), dFdy(shore));
          vec2 coastNormal = coastGradient / max(length(coastGradient), 0.0001);
          float edgeLight = 0.57 + 0.43 * dot(coastNormal, vec2(-0.60, -0.80));
          float coastline = lineProfile(shore, shorePixel * 0.95) * (0.045 + 0.115 * edgeLight);
          vec3 coastInk = mix(vec3(0.25, 0.36, 0.59), vec3(0.35, 0.66, 0.98), edgeLight);
          float rim = (1.0 - smoothstep(0.46, 0.91, field.g));
          float swell = smoothstep(0.12, 0.87, atlasSwell(vGeo));
          float reliefLight = smoothstep(0.12, 0.49, height);
          float ridge = clamp(0.12 + 0.73 * swell + 0.13 * reliefLight + 0.08 * rim, 0.0, 1.0);
          float shine = smoothstep(0.52, 0.96, ridge) * (0.65 + 0.35 * light);
          vec3 blue = mix(waterColor(ridge), vec3(0.19, 0.79, 1.0), shine);
          float radius = mix(0.205, mix(0.257, 0.335, ridge), land);
          float dots = atlasDots(vMap * vec2(1.0, uScaleY), radius) * uPatterns;
          float landDots = dots * land * mix(0.47, 1.0, smoothstep(0.12, 0.89, ridge));
          float seaFade = smoothstep(-61.0, -43.0, vGeo.y) * (1.0 - smoothstep(67.0, 88.0, vGeo.y));
          float seaDots = dots * (1.0 - land) * mix(0.075, 0.15, field.g) * seaFade;
          float pattern = landDots + seaDots;
          vec3 patternColor = blue * (1.0 + 0.18 * shine) * landDots + vec3(0.09, 0.18, 0.40) * seaDots;
          vec3 landInk = mix(vec3(0.017, 0.020, 0.064), vec3(0.035, 0.075, 0.165), ridge);
          float landOpacity = 0.34;
        #else
          float coastline = lineProfile(shore, shorePixel * 0.89) * 0.25;
          vec3 coastInk = vec3(0.39, 0.71, 0.99);
          float inland = smoothstep(0.012, 0.16, shore);
          float pattern = contourBands(vGeo, height) * 0.42 * inland * uPatterns;
          vec3 lineInk = mix(vec3(0.20, 0.43, 0.79), vec3(0.26, 0.55, 0.89), light);
          vec3 patternColor = lineInk * pattern;
          vec3 landInk = mix(vec3(0.023, 0.053, 0.109), vec3(0.037, 0.083, 0.158), light);
          float landOpacity = 0.37;
        #endif

        float contacts = 0.0;
        for (int i = 0; i < CONTACT_COUNT; ++i) {
          vec2 local = (vMap - uContacts[i]) * vec2(1.0, uScaleY);
          float radius = length(local);
          float pixel = fwidth(radius);
          float phase = fract(uTime * 0.29 + float(i) * 0.16);
          float echo = lineProfile(radius - mix(1.03, 2.35, phase), pixel)
                     * (1.0 - phase) * smoothstep(0.0, 0.18, phase);
          float lock = lineProfile(radius - 1.10, pixel * 1.13);
          float glow = 1.0 - smoothstep(0.28, 1.97, radius);
          #ifdef NIGHT_ATLAS
            contacts = max(contacts, lock * 0.44 + echo * 0.33 + glow * 0.17);
          #else
            contacts = max(contacts, lock * 0.68 + echo * 0.43 + glow * 0.18);
          #endif
        }

        float lime = uRoutes * contacts;
        float inks = pattern + coastline + lime;
        float landFill = land * landOpacity * uPatterns * (1.0 - min(1.0, inks));
        float alpha = inks + landFill;
        vec3 color = patternColor
                   + coastInk * coastline
                   + vec3(0.76, 0.98, 0.36) * lime
                   + landInk * landFill;
        gl_FragColor = vec4(color / max(0.001, alpha), min(1.0, alpha) * uOpacity);
      }
    `
  });

  const mesh = new T.Mesh(sheet, material);
  mesh.renderOrder = 0;
  mesh.frustumCulled = false;
  return {mesh, uniforms};
}

// The water recedes in perspective underneath the geographic sheet.
export const chartWaterLayer = `
  ${waterRamp}

  float chartWaterHeight(vec2 p, float time) {
    p += vec2(sin(p.y * 0.10 + time * 0.30), sin(p.x * 0.07 - time * 0.28)) * vec2(8.3, 5.5);
    return sin(p.x * 0.080 + p.y * 0.10 + time * 0.75) * 3.8
         + cos(p.x * 0.055 - p.y * 0.14 - time * 0.51) * 2.5
         + sin(p.x * 0.16 + p.y * 0.11 - time * 0.61) * 1.1;
  }

  vec3 chartWater(vec2 chart, float time) {
    float distance = 0.72 - chart.y;
    float reach = max(0.19, 0.23 + distance * 1.44);
    vec2 plane = vec2((chart.x - 0.49) * 94.0 / reach, 39.0 / reach);
    float height = chartWaterHeight(plane, time * 0.24);
    float level = height / 0.63;
    float levelIndex = floor(level + 0.5);
    float major = 1.0 - step(0.5, mod(levelIndex, 4.0));
    float pixel = fwidth(level);
    float line = 1.0 - smoothstep(0.024, 0.026 + min(0.22, pixel * 0.75), abs(level - levelIndex));
    line *= (1.0 - smoothstep(0.42, 0.92, pixel)) * mix(0.095, 0.37, major);
    vec2 lattice = plane / 1.67 + vec2(0.0, height * 0.086);
    float dotPixel = max(length(dFdx(lattice)), length(dFdy(lattice)));
    float radius = length(fract(lattice + 0.5) - 0.5);
    float aa = max(dotPixel * 0.40, 0.009);
    float dots = (1.0 - smoothstep(0.135 - aa, 0.135 + aa, radius))
               * (1.0 - smoothstep(0.40, 1.02, dotPixel));
    float ridge = smoothstep(-4.7, 4.35, height);
    float fade = smoothstep(0.02, 0.26, distance) * (1.0 - smoothstep(0.58, 0.74, distance));
    return waterColor(ridge) * (line + dots * mix(0.14, 0.32, ridge)) * fade;
  }
`;
