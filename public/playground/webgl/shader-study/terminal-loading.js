import * as T from '../three.module.js';

const oilVertex = `
varying float vLevel, vTop;
varying vec2 vSurface, vDotPlane;
void main() {
  vLevel = position.y + 0.5;
  vTop = max(0.0, normal.y);
  vSurface = position.xz;
  // Measure from the tank floor so existing dots stay put as the volume rises.
  float height = vLevel * length(modelMatrix[1].xyz);
  vDotPlane = vec2(mix(position.x, position.z, abs(normal.x)), mix(height, position.z, abs(normal.y)));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const oilFragment = `
uniform float uOpacity, uTime;
varying float vLevel, vTop;
varying vec2 vSurface, vDotPlane;
void main() {
  float surfaceLight = smoothstep(0.0, 1.0, vLevel);
  vec3 body = mix(vec3(0.006, 0.047, 0.094), vec3(0.012, 0.084, 0.159), surfaceLight);
  float sheen = pow(0.5 + 0.5 * sin(vSurface.x * 1.9 + vSurface.y * 3.1
    + 0.55 * sin(vSurface.y * 2.8) - uTime * 0.78), 6.0);
  vec3 color = body + vec3(0.024, 0.084, 0.127) * (vTop * (0.30 + 0.70 * sheen));

  vec2 cells = vDotPlane / 0.25;
  float footprint = length(fwidth(cells));
  float dotAA = clamp(footprint * 0.17, 0.015, 0.10);
  float radius = length(fract(cells) - 0.5);
  float core = 1.0 - smoothstep(0.16 - dotAA, 0.30 + dotAA, radius);
  float halo = 1.0 - smoothstep(0.24, 0.46, radius);
  float stipple = mix(core + 0.14 * halo, 0.19, smoothstep(0.58, 1.12, footprint));
  color += vec3(0.074, 0.61, 0.96) * stipple * (0.67 + 0.24 * surfaceLight + 0.13 * vTop);

  float aa = clamp(fwidth(vLevel), 0.004, 0.09);
  float waterline = smoothstep(1.0 - aa * 0.92, 1.0, vLevel) * (1.0 - vTop);
  color += vec3(0.14, 0.70, 1.0) * waterline;
  gl_FragColor = vec4(color, uOpacity);
}`;

export const loadingBeats = {
  pulseStart: 0.32,
  pulseArrival: 1.48,
  fillStart: 1.96,
  fillEnd: 7.60,
  holdEnd: 8.60,
  end: 9.44
};

export function createTerminalLoading(vessel, world, berthZ, particleStudy = false) {
  const tanks = new T.Group();
  vessel.add(tanks);
  const tankWidth = 4.95;
  const tankDepth = 6.25;
  const tankBase = 2.05;
  const tankHeight = 5.15;
  const outlineShape = new T.BoxGeometry(tankWidth, tankHeight, tankDepth);
  const outlineGeometry = new T.EdgesGeometry(outlineShape);
  outlineShape.dispose();
  const liquidGeometry = new T.BoxGeometry(tankWidth - 0.23, 1, tankDepth - 0.26);
  const rimGeometry = new T.BufferGeometry().setFromPoints(
    [[-1,-1],[1,-1],[1,1],[-1,1],[-1,-1]].map(([x,z]) =>
      new T.Vector3(x * (tankWidth - 0.23) * 0.5, 0, z * (tankDepth - 0.26) * 0.5)
    )
  );
  const outlines = new T.LineBasicMaterial({color: particleStudy ? 0x79bbdf : 0x8caa76, transparent: true, depthWrite: false});
  const oilOpacity = {value: 0};
  const oilTime = {value: 0};
  const oil = new T.ShaderMaterial({
    uniforms: {uOpacity: oilOpacity, uTime: oilTime}, vertexShader: oilVertex, fragmentShader: oilFragment,
    transparent: true, depthWrite: false
  });
  const cells = [-8,-2.6,2.8,8.2,13.6].map(x => {
    const frame = new T.LineSegments(outlineGeometry, outlines);
    frame.position.set(x, tankBase + tankHeight * 0.5, 0);
    frame.renderOrder = 5;
    const liquid = new T.Mesh(liquidGeometry, oil);
    liquid.position.x = x;
    liquid.renderOrder = 4;
    const rim = new T.LineBasicMaterial({
      color: 0x73e4ff, transparent: true, depthWrite: false, blending: T.AdditiveBlending
    });
    const fluidLine = new T.Line(rimGeometry, rim);
    fluidLine.position.x = x;
    fluidLine.renderOrder = 7;
    tanks.add(frame, liquid, fluidLine);
    return {liquid, fluidLine};
  });

  const transfer = new T.Group();
  world.add(transfer);
  const feed = new T.CatmullRomCurve3([
    [-4, 0.1, -10.65], [-2.4, -0.82, -8.4], [0, -0.92, -7.1],
    [0.15, 1.55, -5.8], [0.85, 4.0, -3.6], [1.07, 4.35, -1.55],
    [1.2, 4.65, berthZ - 2.1], [1.35, 5.20, berthZ - 0.5]
  ].map(point => new T.Vector3(...point)));
  const pipeUniforms = {
    uOpacity: {value: 0}, uHead: {value: -0.13}, uPulse: {value: 0},
    uFlow: {value: 0}, uTime: {value: 0}
  };
  const pipe = new T.Mesh(new T.TubeGeometry(feed, 64, 0.16, 9, false), new T.ShaderMaterial({
    uniforms: pipeUniforms,
    vertexShader: `
      varying vec2 vTube;
      void main(){
        vTube = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uOpacity, uHead, uPulse, uFlow, uTime;
      varying vec2 vTube;
      void main(){
        float delta = vTube.x - uHead;
        float spread = mix(8.0, 23.0, step(0.0, delta));
        float packet = exp(-pow(delta * spread, 2.0)) * uPulse;
        float current = pow(0.5 + 0.5 * cos(6.2831853 * (2.35 * vTube.x - 1.03 * uTime)), 7.0);
        float transferLight = max(packet, (0.25 + 0.75 * current) * uFlow);
        float lit = 0.58 + 0.42 * abs(cos(vTube.y * 6.28318));
        vec3 resting = vec3(0.045, 0.16, 0.25) * lit;
        vec3 cyan = vec3(0.14, 0.78, 1.0);
        gl_FragColor = vec4(mix(resting, cyan, transferLight), uOpacity * (0.32 + 0.67 * transferLight));
      }
    `,
    transparent: true, depthWrite: false
  }));
  pipe.renderOrder = 6;
  transfer.add(pipe);
  const manifold = new T.Mesh(
    new T.TorusGeometry(0.53, 0.075, 7, 26),
    new T.MeshBasicMaterial({color: 0x68deff, transparent: true, depthWrite: false})
  );
  manifold.rotation.x = -Math.PI * 0.5;
  manifold.position.copy(feed.getPoint(1));
  manifold.renderOrder = 7;
  transfer.add(manifold);

  const order = [4,2,0,1,3];
  const stagger = 0.52;
  const riseDuration = loadingBeats.fillEnd - loadingBeats.fillStart - stagger * (cells.length - 1);
  function update(elapsed, opening, dock, time = elapsed) {
    const {pulseStart, pulseArrival, fillStart, fillEnd, holdEnd, end} = loadingBeats;
    const hoseVisibility = T.MathUtils.smoothstep(elapsed, 0.08, 0.32)
      * (1 - T.MathUtils.smoothstep(elapsed, holdEnd, end)) * dock;
    const travel = T.MathUtils.clamp((elapsed - pulseStart) / (pulseArrival - pulseStart), 0, 1);
    const arrival = T.MathUtils.smoothstep(elapsed, pulseArrival - 0.14, pulseArrival + 0.05)
      * (1 - T.MathUtils.smoothstep(elapsed, pulseArrival + 0.13, fillStart));
    tanks.visible = opening > 0.025;
    transfer.visible = hoseVisibility > 0.025;
    outlines.opacity = opening * (particleStudy ? 0.46 : 0.33);
    oilOpacity.value = opening * 0.94;
    oilTime.value = time;
    pipeUniforms.uOpacity.value = hoseVisibility;
    pipeUniforms.uHead.value = T.MathUtils.lerp(-0.13, 1.0, travel);
    pipeUniforms.uPulse.value = 1 - T.MathUtils.smoothstep(elapsed, pulseArrival, pulseArrival + 0.2);
    pipeUniforms.uFlow.value = T.MathUtils.smoothstep(elapsed, pulseArrival, fillStart + 0.17)
      * (1 - T.MathUtils.smoothstep(elapsed, fillEnd - 0.18, holdEnd));
    pipeUniforms.uTime.value = time;
    manifold.material.opacity = hoseVisibility * (0.18 + 0.70 * arrival + 0.15 * opening);
    let total = 0;
    for (let index = 0; index < cells.length; index++) {
      const {liquid, fluidLine} = cells[index];
      const start = fillStart + stagger * order[index];
      const level = T.MathUtils.smootherstep(elapsed, start, start + riseDuration);
      total += level;
      const height = 0.035 + (tankHeight - 0.40) * level;
      liquid.visible = fluidLine.visible = level > 0.002;
      fluidLine.material.opacity = opening * T.MathUtils.smoothstep(level, 0.003, 0.055) * 0.94;
      liquid.scale.y = height;
      liquid.position.y = tankBase + 0.12 + height * 0.5;
      fluidLine.position.y = tankBase + 0.13 + height;
    }
    return Math.floor(100 * total / cells.length);
  }
  update(0, 0, 0);
  return update;
}
