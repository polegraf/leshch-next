import * as T from './three.module.js';

const glassBands = `
  float glassBand(float distance, float width) {
    float offset = distance / width;
    return exp(-offset * offset);
  }

  vec3 glassSpectrum(float phase) {
    float h = fract(phase);
    vec3 coral = vec3(1.03, 0.11, 0.035);
    vec3 gold = vec3(1.04, 0.66, 0.13);
    vec3 aqua = vec3(0.045, 0.93, 0.79);
    vec3 blue = vec3(0.050, 0.16, 1.03);
    vec3 lilac = vec3(0.40, 0.105, 0.96);
    vec3 rose = vec3(1.04, 0.11, 0.44);
    if (h < 0.16) return mix(coral, gold, smoothstep(0.0, 0.16, h));
    if (h < 0.32) return mix(gold, aqua, smoothstep(0.16, 0.32, h));
    if (h < 0.56) return mix(aqua, blue, smoothstep(0.32, 0.56, h));
    if (h < 0.71) return mix(blue, lilac, smoothstep(0.56, 0.71, h));
    if (h < 0.91) return mix(lilac, rose, smoothstep(0.71, 0.91, h));
    return mix(rose, coral, smoothstep(0.91, 1.0, h));
  }

  #ifdef CHROME_STUDY
  vec3 chromeFilm(float phase) {
    float f = fract(phase);
    vec3 violet = vec3(0.46, 0.085, 1.08);
    vec3 cobalt = vec3(0.028, 0.15, 1.22);
    vec3 cyan = vec3(0.11, 0.84, 1.09);
    vec3 pearl = vec3(1.17, 1.02, 0.71);
    vec3 rose = vec3(1.03, 0.23, 0.83);
    if (f < 0.24) return mix(violet, cobalt, smoothstep(0.0, 0.24, f));
    if (f < 0.51) return mix(cobalt, cyan, smoothstep(0.24, 0.51, f));
    if (f < 0.67) return mix(cyan, pearl, smoothstep(0.51, 0.67, f));
    if (f < 0.81) return mix(pearl, rose, smoothstep(0.67, 0.81, f));
    return mix(rose, violet, smoothstep(0.81, 1.0, f));
  }
  #endif
`;

export const glassAtmosphere = `
  ${glassBands}
  vec3 glassBackdrop(vec2 uv, vec2 center, float aspect, float time) {
    vec2 p = (uv - center) * vec2(aspect, 1.0);
    float drift = time * 0.19;
    vec2 blue = (p - vec2(0.08 + 0.08 * sin(drift), 0.14 + 0.11 * cos(drift * 0.82))) / vec2(0.48, 0.37);
    vec2 teal = (p - vec2(0.17 + 0.13 * cos(drift * 0.68), -0.20 + 0.09 * sin(drift))) / vec2(0.37, 0.25);
    vec2 warm = (p - vec2(0.33 + 0.10 * sin(drift * 0.83), -0.06 + 0.11 * cos(drift))) / vec2(0.34, 0.27);
    float fade = smoothstep(0.055, 0.82, uv.x);
    vec3 color = vec3(0.0051, 0.0058, 0.0071);
    color += vec3(0.003, 0.004, 0.008) * exp(-dot(blue, blue) * 1.6) * fade;
    color += vec3(0.001, 0.005, 0.007) * exp(-dot(teal, teal) * 1.9) * fade;
    color += vec3(0.005, 0.002, 0.002) * exp(-dot(warm, warm) * 2.0) * fade;
    #ifdef CHROME_STUDY
      vec2 offset = p - vec2(-0.04, 0.05);
      float light = exp(-dot(offset * vec2(1.9, 2.2), offset * vec2(1.9, 2.2)));
      color = vec3(0.0015, 0.0018, 0.0039) + vec3(0.0026, 0.0034, 0.013) * light;
    #endif
    return color;
  }
`;

export const glassLight = `
  ${glassBands}
  uniform sampler2D uGlassField;
  uniform vec2 uGlassSize;

  float glassRim(vec3 normal, vec3 eye) {
    return pow(1.0 - clamp(dot(normal, eye), 0.0, 1.0), 3.8);
  }

  vec3 opticalStudioLight(vec3 ray, float time) {
    float pivot = 0.083 * sin(time * 0.38);
    float key = glassBand(ray.x + 0.44 - pivot, 0.095) * glassBand(ray.y - 0.55, 0.56);
    float strip = glassBand(ray.y - 0.23 - 0.27 * ray.x, 0.052) * glassBand(ray.x - 0.35, 0.79);
    float cyan = glassBand(ray.x + 0.65 + 0.32 * ray.y, 0.16) * smoothstep(-0.67, 0.27, ray.y);
    float soft = glassBand(ray.y + 0.42 + 0.34 * ray.x, 0.25) * glassBand(ray.x - 0.35, 0.42);
    return vec3(0.69, 0.89, 1.08) * key + vec3(1.08, 0.96, 1.05) * strip
         + vec3(0.025, 0.54, 0.78) * cyan + vec3(0.22, 0.075, 0.11) * soft;
  }

  #ifdef CHROME_STUDY
  vec3 chromeLights(vec3 ray, float time, float incidence, float saturation, float overheadStrength) {
    float drift = time * 0.23;
    float shift = 0.105 * sin(drift);
    // Long softboxes and black flags give the reflected silhouette hard and soft edges.
    float band = ray.y + 0.28 * ray.x + 0.16 * ray.x * ray.x - 0.12 * ray.z - shift;
    float top = exp(-pow(abs((band - 0.61) / 0.20), 4.0)) * smoothstep(-0.55, -0.13, ray.z - 0.25 * ray.x);
    float seam = glassBand(band - 0.785, 0.035) * smoothstep(-0.77, -0.28, ray.z);
    float side = ray.x - 0.31 * ray.y + 0.13 * ray.z + shift;
    float tall = exp(-pow(abs((side + 0.70) / 0.16), 3.0)) * glassBand(ray.y + 0.06, 0.65);
    float low = glassBand(ray.y - 0.42 * ray.x + 0.60, 0.14) * glassBand(ray.z + 0.24, 0.46);
    float pin = glassBand(ray.x - 0.37 + shift, 0.084) * glassBand(ray.y - 0.30, 0.044)
              * smoothstep(-0.15, 0.27, ray.z);
    float darkFlag = 1.0 - 0.94 * glassBand(side - 0.12, 0.19) * glassBand(band - 0.31, 0.41);
    float phase = 0.19 + 0.52 * incidence + 0.50 * ray.x - 0.34 * band + 0.085 * sin(drift + ray.z * 2.6);
    vec3 prism = mix(vec3(0.17, 0.22, 1.04), chromeFilm(phase), saturation);
    vec3 lilac = vec3(0.37, 0.18, 0.94);
    vec3 ice = vec3(0.68, 0.82, 1.07);
    vec3 white = vec3(1.10, 1.08, 1.17);
    vec3 overhead = mix(prism, white, smoothstep(-0.16, 0.86, ray.x) * 0.88 * overheadStrength);
    vec3 edge = mix(prism, ice, 0.68);
    return (top * overhead * mix(0.78, 1.17, overheadStrength) + seam * white * (1.53 * overheadStrength)
          + tall * mix(lilac, ice, 0.44) * 0.65
          + low * prism * 0.98) * darkFlag + pin * white * 1.90 + edge * 0.010;
  }
  #endif

  vec3 glassReflection(vec3 ray, float time, float saturation) {
    #ifdef CHROME_STUDY
      vec3 reflected = chromeLights(ray, time, 0.37, saturation, 1.0);
    #else
      vec3 reflected = opticalStudioLight(ray, time);
    #endif
    return mix(vec3(dot(reflected, vec3(0.24, 0.67, 0.09))), reflected, saturation);
  }

  vec3 glassTransmission(vec2 screen, vec2 bend, vec2 dispersion) {
    vec2 uv = clamp(screen + bend, 0.002, 0.998);
    return vec3(texture2D(uGlassField, clamp(uv + dispersion, 0.002, 0.998)).r,
                texture2D(uGlassField, uv).g,
                texture2D(uGlassField, clamp(uv - dispersion, 0.002, 0.998)).b);
  }

  vec4 shadeGlass(vec3 normal, vec3 eye, float time, float saturation, float overheadStrength) {
    float incidence = clamp(dot(normal, eye), 0.0, 1.0);
    float rim = glassRim(normal, eye);
    vec3 ray = refract(-eye, normal, 0.68);
    vec2 aspect = vec2(uGlassSize.y / uGlassSize.x, 1.0);
    vec2 bend = (ray.xy + eye.xy) * aspect;
    vec3 through = glassTransmission(gl_FragCoord.xy / uGlassSize, bend * 0.32, bend * (0.023 + 0.038 * rim));
    #ifdef CHROME_STUDY
      vec3 reflectedRay = reflect(-eye, normal);
      vec3 studio = chromeLights(reflectedRay, time, incidence, saturation, overheadStrength);
      float drift = time * 0.25;
      float grazing = glassBand(incidence - 0.024, 0.038);
      float travel = ray.y + 0.71 * ray.x + 0.15 * sin(ray.x * 4.5 - drift);
      float prismBand = glassBand(travel + 0.17, 0.11) * glassBand(incidence - 0.39, 0.33);
      float flank = smoothstep(-0.71, 0.65, reflectedRay.y + 0.37 * reflectedRay.x);
      vec3 spectral = chromeFilm(0.26 + 1.32 * travel + 0.56 * incidence + 0.19 * reflectedRay.z);
      vec3 tint = mix(vec3(0.050, 0.071, 0.26), vec3(0.51, 0.59, 0.87), flank);
      vec3 color = vec3(0.0019, 0.0027, 0.012) + through * (0.11 + 0.19 * (1.0 - rim))
                 + studio * (0.74 + 0.51 * rim) + spectral * prismBand * (0.42 + 0.38 * flank) * saturation
                 + tint * grazing * (0.27 + 0.52 * flank);
      return vec4(color, 1.0);
    #else
    vec3 reflection = glassReflection(reflect(-eye, normal), time, saturation);
    float drift = time * 0.28;
    float field = ray.y + 0.73 * ray.x + 0.23 * ray.x * ray.x - 0.12 * sin(drift + ray.x * 2.7);
    float pool = glassBand(normal.x + 0.22 * normal.y - 0.19 - 0.10 * sin(drift), 0.69);
    vec3 spectral = vec3(0.020, 0.085, 0.48) * glassBand(field - 0.17, 0.17)
                  + vec3(0.08, 0.61, 0.044) * glassBand(field - 0.066, 0.037)
                  + vec3(0.31, 0.91, 1.08) * glassBand(field + 0.004, 0.056)
                  + vec3(1.36, 0.092, 0.011) * glassBand(field + 0.117, 0.082)
                  + vec3(1.19, 0.45, 0.033) * glassBand(field + 0.23, 0.14)
                  + vec3(0.79, 0.047, 0.30) * glassBand(field + 0.385, 0.13)
                  + vec3(0.17, 0.052, 0.63) * glassBand(field + 0.54, 0.17);
    float coolSide = 1.0 - smoothstep(-0.4, 0.34, normal.x + 0.33 * normal.y + 0.16 * sin(drift * 0.82));
    vec3 coolFilm = mix(vec3(0.037, 0.074, 0.44), vec3(0.10, 0.71, 0.91), glassBand(field - 0.22, 0.27));
    coolFilm = mix(coolFilm, vec3(0.87, 0.049, 0.42), glassBand(field + 0.31, 0.21));
    spectral = mix(spectral, coolFilm * glassBand(field - 0.04, 0.56), coolSide * 0.83);
    spectral = mix(vec3(0.055, 0.27, 0.55) * glassBand(field + 0.11, 0.26), spectral, saturation);
    float edge = glassBand(incidence - 0.057, 0.065);
    vec3 edgeTint = mix(vec3(0.12, 0.73, 0.92), vec3(0.86, 0.83, 0.95), smoothstep(-0.35, 0.67, normal.x + 0.35 * normal.y));
    vec3 color = through * (0.79 - 0.35 * rim) + reflection * (0.18 + 0.61 * rim)
               + spectral * pool * (0.66 + 0.25 * rim) + edgeTint * edge * 0.37;
    return vec4(color, 0.48 + 0.33 * rim + 0.16 * pool * glassBand(field + 0.15, 0.25));
    #endif
  }

  vec4 shadeGlass(vec3 normal, vec3 eye, float time, float saturation) {
    return shadeGlass(normal, eye, time, saturation, 1.0);
  }

  vec4 shadeGlassGlobe(vec3 normal, vec3 eye, vec3 geography, vec4 field, float time) {
    float land = smoothstep(0.44, 0.61, field.r);
    float coast = (1.0 - smoothstep(0.028, 0.15, abs(field.r - 0.50)));
    float light = smoothstep(-0.39, 0.90, dot(normal, normalize(vec3(-0.51, 0.65, 0.62))));
    float contour = sin(dot(geography, vec3(10.0, 17.0, -7.0)) + 1.21 * sin(geography.z * 7.0) - time * 0.65);
    float ripple = 0.5 + 0.5 * sin(dot(geography, vec3(-28.0, 45.0, 34.0)) - time * 1.16 + contour * 0.76);
    float satin = (0.5 + 0.5 * contour) * 0.70 + 0.30 * ripple;
    float topography = dot(field.ba, vec2(256.0, 1.0)) / 257.0;
    #ifdef CHROME_STUDY
      vec3 perturb = vec3(0.010 * ripple, 0.015 * contour, -0.009 * ripple) * (1.0 - land);
      vec3 polished = normalize(normal + perturb);
      vec4 finish = shadeGlass(polished, eye, time, 0.94, 0.26);
      float facing = max(0.0, dot(normal, eye));
      float turn = atan(normal.y, normal.x);
      float drift = time * 0.29;
      float edge = glassBand(facing - 0.052, 0.046);
      float mantle = glassBand(facing - 0.20 - 0.027 * sin(2.0 * turn - drift), 0.081);
      float highlight = glassBand(sin(turn + 0.59 + 0.22 * sin(drift)), 0.42);
      vec3 prism = chromeFilm(turn / 6.2831853 + 0.56 + 0.061 * sin(drift));
      vec3 rimTint = mix(prism, vec3(0.74, 0.84, 1.12), 0.42 + 0.50 * highlight);
      vec3 sea = vec3(0.0022, 0.0054, 0.021) * (0.61 + 0.39 * satin);
      vec3 terrain = mix(vec3(0.017, 0.020, 0.056), vec3(0.079, 0.097, 0.18), 0.70 * light + 0.29 * topography);
      vec3 globe = mix(sea, terrain, land) + finish.rgb * mix(0.73, 0.44, land);
      globe += rimTint * (edge * (0.20 + 0.33 * highlight) + mantle * (0.07 + 0.095 * highlight));
      globe += vec3(0.16, 0.20, 0.39) * coast * 0.28;
      return vec4(globe, 0.94 + 0.06 * glassRim(normal, eye));
    #else
    vec3 water = mix(vec3(0.002, 0.012, 0.029), vec3(0.011, 0.036, 0.085), light * (0.39 + 0.61 * satin));
    vec3 continents = mix(vec3(0.020, 0.055, 0.078), vec3(0.105, 0.191, 0.239), light * 0.79 + 0.15 * topography);
    vec4 shell = shadeGlass(normal, eye, time, 0.94);
    float rim = glassRim(normal, eye);
    float band = glassBand(dot(normal, vec3(0.58, 0.38, 0.37)) - 0.03 + 0.16 * sin(time * 0.43), 0.48);
    float refraction = (0.22 + 0.62 * band + 0.23 * rim) * mix(1.0, 0.72, land);
    vec3 color = mix(water, continents, land) * 0.83 + shell.rgb * refraction;
    color += vec3(0.15, 0.31, 0.42) * coast * (0.29 + 0.44 * light) * 0.37;
    float edge = glassBand((1.0 - rim) - 0.12, 0.15);
    color += glassSpectrum(0.42 + 0.34 * normal.x - 0.30 * normal.y + 0.10 * sin(time * 0.28)) * edge * 0.13;
    return vec4(color, 0.65 + 0.30 * rim);
    #endif
  }
`;

export function createGlassGlobe(coast, time, optics, chrome = false) {
  return new T.ShaderMaterial({
    defines: chrome ? {CHROME_STUDY: 1} : {},
    uniforms: {...optics, uGlobeCoast: {value: coast}, uTime: time, uOpacity: {value: 0}},
    transparent: true,
    depthWrite: true,
    side: T.DoubleSide,
    forceSinglePass: true,
    vertexShader: `
      varying vec3 vNormal, vEye, vGeo;
      varying vec2 vCoast;
      void main() {
        vec4 view = modelViewMatrix * vec4(position, 1.0);
        vGeo = normalize(position);
        vNormal = normalMatrix * vGeo;
        vEye = -view.xyz;
        vCoast = vec2(uv.x, 1.0 - uv.y);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform sampler2D uGlobeCoast;
      uniform float uTime, uOpacity;
      varying vec3 vNormal, vEye, vGeo;
      varying vec2 vCoast;
      ${glassLight}
      void main() {
        vec3 normal = normalize(vNormal), eye = normalize(vEye);
        if (dot(normal, eye) < 0.0 || uOpacity < 0.002) discard;
        vec4 color = shadeGlassGlobe(normal, eye, normalize(vGeo), texture2D(uGlobeCoast, vCoast), uTime);
        gl_FragColor = vec4(color.rgb, color.a * uOpacity);
      }
    `
  });
}
