import * as T from './three.module.js';

export function createEngravedLand(polygons, project, spherePosition, fold) {
  const flat = [];
  const spherical = [];
  for (const [coast, ...holes] of polygons) {
    const ring = coordinates => coordinates.map(([lon, lat]) => new T.Vector2(lon, lat));
    const outer = ring(coast);
    const inner = holes.map(ring);
    const triangles = T.ShapeUtils.triangulateShape(outer, inner);
    const points = outer.concat(...inner);
    for (const triangle of triangles) {
      for (const index of triangle) {
        const {x: lon, y: lat} = points[index];
        flat.push(...project(lon, lat));
        spherical.push(...spherePosition(lon, lat));
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(flat, 3));
  geometry.setAttribute('spherePosition', new T.Float32BufferAttribute(spherical, 3));
  const opacity = {value: 0};
  const material = new T.ShaderMaterial({
    uniforms: {uFold: fold, uOpacity: opacity},
    vertexShader: `
      attribute vec3 spherePosition;
      uniform float uFold;
      varying vec2 vMap;
      void main() {
        vMap = position.xy;
        vec3 folded = mix(position, spherePosition, uFold);
        folded.z += sin(uFold * 3.14159265) * 0.012 * position.x * position.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(folded, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity;
      varying vec2 vMap;
      void main() {
        float field = 0.5 + 0.25 * sin(vMap.x * 0.17 + vMap.y * 0.24)
          + 0.25 * cos(vMap.y * 0.32 - vMap.x * 0.09);
        float stroke = dot(vMap, vec2(0.64, 0.77)) / 0.55;
        float distanceToStroke = abs(fract(stroke + 0.5) - 0.5);
        float aa = clamp(fwidth(stroke) * 0.50, 0.025, 0.20);
        float hatch = (1.0 - smoothstep(0.045, 0.045 + aa, distanceToStroke))
          * (1.0 - smoothstep(0.48, 0.90, fwidth(stroke)));
        float accent = 1.0 - step(0.5, mod(floor(stroke + 0.5), 5.0));
        vec3 graphite = mix(vec3(0.012, 0.022, 0.030), vec3(0.026, 0.040, 0.047), field);
        vec3 engraving = vec3(0.073, 0.118, 0.128) * (0.42 + 0.44 * field + 0.18 * accent);
        gl_FragColor = vec4(graphite + hatch * engraving, uOpacity);
      }
    `,
    transparent: true, depthWrite: false, side: T.DoubleSide
  });
  const mesh = new T.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2.5;
  return {mesh, opacity};
}
