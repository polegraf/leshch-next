import * as T from '../three.module.js';
import {limePointPalette, particleLook, waterRamp} from './shader-style.js?v=32';

const stages = [
  ['Sourcing', 'Producers & refineries'],
  ['Supply', 'Structuring & storage'],
  ['Shipping', 'Charter & delivery'],
  ['End Market', 'Delivery to buyers']
];
const products = [
  ['Crude Oil', 'drop', 0x455cda],
  ['Naphtha', 'loop', 0x61c5fb],
  ['Diesel Fuel', 'capsule', 0x428aff],
  ['Gasoline', 'bloom', 0x70a7ff],
  ['Fuel Oil', 'strata', 0x4f86f7]
];

function makeShelf(title, items, showSubtitle) {
  const shelf = document.createElement('ul');
  shelf.className = 'inventory-shelf';
  shelf.setAttribute('aria-label', title);
  const slots = items.map(([label, subtitle]) => {
    const item = document.createElement('li');
    item.className = 'inventory-slot';
    const viewport = document.createElement('div');
    viewport.className = 'inventory-viewport';
    viewport.setAttribute('aria-hidden', 'true');
    const caption = document.createElement('div');
    caption.className = 'inventory-caption';
    const name = document.createElement('b');
    name.textContent = label;
    caption.append(name);
    if (showSubtitle) {
      const description = document.createElement('small');
      description.textContent = subtitle;
      caption.append(description);
    }
    item.append(viewport, caption);
    shelf.append(item);
    return viewport;
  });
  return {shelf, slots};
}

const modelVertex = `
  uniform float uTime;
  varying vec3 vLocal, vNormal, vObjectNormal;
  varying vec2 vUv;
  #ifdef PARTICLE_PRODUCT
    varying vec2 vFilm;
    varying float vFold;
    varying vec3 vView;
  #endif
  void main() {
    vLocal = position;
    vNormal = normalize(normalMatrix * normal);
    vObjectNormal = normal;
    vUv = uv;
    vec3 p = position;
    #ifdef PARTICLE_PRODUCT
      float angle = 6.2831853 * uv.x;
      float shear = sin(2.0 * angle + uv.y * 4.8 - uTime * 0.61);
      float curl = sin(angle - uv.y * 5.7 + uTime * 0.72 + 0.77 * shear);
      vFilm = uv + vec2(0.049 * shear, 0.068 * curl);
      vFold = sin(6.2831853 * vFilm.x + 10.6 * vFilm.y - uTime * 0.82);
      p += normal * (0.077 * vFold + 0.043 * curl);
      p.xz += vec2(0.034 * shear, 0.053 * curl) * sin(uv.y * 3.14159265);
    #endif
    vec4 view = modelViewMatrix * vec4(p, 1.0);
    #ifdef PARTICLE_PRODUCT
      vView = view.xyz;
    #endif
    gl_Position = projectionMatrix * view;
  }
`;

function equipmentMaterial(opacity, time, particleStudy) {
  return new T.ShaderMaterial({
    uniforms: {uOpacity: opacity, uTime: time},
    defines: particleStudy ? {PARTICLE_STUDY: 1} : {},
    vertexShader: modelVertex,
    fragmentShader: `
      uniform float uOpacity, uTime;
      varying vec3 vLocal, vNormal, vObjectNormal;
      ${limePointPalette}
      ${particleLook}
      float dotGrid(vec2 point) {
        vec2 grid = point / 0.53;
        float pixel = max(length(dFdx(grid)), length(dFdy(grid)));
        float distance = length(fract(grid + 0.5) - 0.5);
        return (1.0 - smoothstep(0.12, 0.24 + 0.36 * pixel, distance))
             * (1.0 - smoothstep(0.53, 1.3, pixel));
      }
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 axes = pow(abs(normalize(vObjectNormal)), vec3(4.0));
        axes /= max(dot(axes, vec3(1.0)), 0.001);
        vec3 film = vLocal;
        #ifdef PARTICLE_STUDY
          film = particleCoordinates(vLocal, uTime * 0.79);
        #endif
        float point = dot(axes, vec3(dotGrid(film.yz), dotGrid(film.xz), dotGrid(film.xy)));
        float light = 0.24 + 0.76 * max(0.0, dot(normal, vec3(-0.44, 0.63, 0.64)));
        vec3 ink = limePointColor(light, light);
        float rim = pow(1.0 - abs(normal.z), 2.4);
        #ifdef PARTICLE_STUDY
          float wave = particleCrests(film, uTime * 0.79);
          ink = particleInk(light, wave);
          float ribbon = smoothstep(0.30, 0.99, wave);
          vec3 color = ink * (0.045 + 0.10 * light + 0.23 * rim + point * (0.56 + ribbon * 0.71));
          gl_FragColor = vec4(color, uOpacity * (0.43 + 0.21 * ribbon + 0.34 * point));
        #else
        vec3 color = vec3(0.016, 0.038, 0.029) + ink * (0.045 + 0.10 * light + 0.66 * point + 0.13 * rim);
        gl_FragColor = vec4(color, uOpacity);
        #endif
        #include <colorspace_fragment>
      }
    `,
    side: T.DoubleSide,
    transparent: true,
    forceSinglePass: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });
}

function productMaterial(tint, opacity, time, particleStudy) {
  return new T.ShaderMaterial({
    uniforms: {uTint: {value: new T.Color(tint)}, uOpacity: opacity, uTime: time},
    defines: particleStudy ? {PARTICLE_PRODUCT: 1} : {},
    vertexShader: modelVertex,
    fragmentShader: `
      uniform vec3 uTint;
      uniform float uOpacity, uTime;
      varying vec3 vLocal, vNormal;
      varying vec2 vUv;
      #ifdef PARTICLE_PRODUCT
        varying vec2 vFilm;
        varying float vFold;
        varying vec3 vView;
      #endif
      ${waterRamp}
      ${particleLook}
      void main() {
        vec3 normal = normalize(vNormal);
        float light = smoothstep(-0.6, 0.95, dot(normal, vec3(-0.51, 0.6, 0.61)));
        float rim = pow(1.0 - abs(normal.z), 2.6);
        vec2 lattice = vUv * vec2(57.0, 30.0);
        #ifdef PARTICLE_PRODUCT
          lattice = vFilm * vec2(60.0, 32.0);
        #endif
        lattice.x += 0.5 * mod(floor(lattice.y), 2.0);
        float distance = length(fract(lattice) - 0.5);
        float point = 1.0 - smoothstep(0.09, 0.29, distance);
        #ifdef PARTICLE_PRODUCT
          vec3 sheetNormal = normalize(cross(dFdx(vView), dFdy(vView)) + vec3(1e-9));
          float caustic = pow(1.0 - abs(sheetNormal.z), 2.9);
          float fold = smoothstep(-0.25, 0.97, vFold);
          float crest = clamp(0.17 + 0.61 * fold + 0.39 * caustic, 0.0, 1.0);
          float ribbon = smoothstep(0.42, 0.95, crest);
          float ridge = pow(max(0.0, vFold), 9.0) * (0.36 + 0.64 * caustic);
          float width = clamp(0.20 * fwidth(distance), 0.015, 0.085);
          point = 1.0 - smoothstep(0.12 - width, 0.28 + width, distance);
          vec3 ink = mix(particleInk(caustic, crest), uTint, 0.10);
          vec3 color = ink * (0.025 + 0.27 * caustic + 0.19 * ribbon + point * (0.64 + 1.18 * ribbon));
          color += vec3(0.055, 0.65, 1.0) * ridge * (0.16 + 0.41 * point);
          float alpha = (0.09 + 0.26 * ribbon + 0.39 * point + 0.35 * caustic + ridge * 0.15) * uOpacity;
          gl_FragColor = vec4(color, alpha * (gl_FrontFacing ? 1.0 : 0.63));
        #else
        float ridge = clamp(0.22 + 0.53 * light + 0.12 * sin(vLocal.y * 7.0 + vLocal.x * 2.0), 0.0, 1.0);
        vec3 ink = mix(waterColor(ridge), uTint, 0.39);
        vec3 color = ink * (0.065 + 0.16 * light + point * (0.74 + 0.72 * light) + 0.27 * rim);
        gl_FragColor = vec4(color, uOpacity);
        #endif
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    side: particleStudy ? T.DoubleSide : T.FrontSide,
    forceSinglePass: true
  });
}

function lathe(profile) {
  const curve = new T.SplineCurve(profile.map(([x, y]) => new T.Vector2(x, y)));
  const vertices = curve.getPoints(52).map(point => new T.Vector2(Math.max(0, point.x), point.y));
  return new T.LatheGeometry(vertices, 96);
}

function shape(kind) {
  if (kind === 'drop') {
    return lathe([[0, -0.97], [0.43, -0.86], [0.68, -0.57], [0.69, -0.20],
      [0.50, 0.24], [0.25, 0.67], [0, 1.06]]);
  }
  if (kind === 'loop') {
    const loop = new T.TorusGeometry(0.65, 0.22, 24, 100);
    const vertices = loop.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const twist = Math.atan2(y, x);
      vertices.setXYZ(i, x * 1.12, y * 0.93, z + 0.31 * Math.sin(twist * 2));
    }
    loop.computeVertexNormals();
    return loop;
  }
  if (kind === 'capsule') {
    return lathe([[0, -0.95], [0.38, -0.90], [0.55, -0.68], [0.54, -0.58],
      [0.45, -0.53], [0.45, 0.53], [0.54, 0.58], [0.55, 0.68], [0.38, 0.90], [0, 0.95]])
      .rotateZ(-0.29);
  }
  if (kind === 'strata') {
    return lathe([[0, -0.72], [0.45, -0.67], [0.64, -0.52], [0.61, -0.37],
      [0.80, -0.20], [0.75, -0.04], [0.86, 0.14], [0.77, 0.30], [0.54, 0.53], [0, 0.61]]);
  }
  const bloom = new T.SphereGeometry(0.85, 96, 56);
  const vertices = bloom.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
    const angle = Math.atan2(z, x);
    const swell = 1.0 + 0.21 * Math.cos(angle * 3.0 + y * 3.6) * (1.0 - y * y);
    vertices.setXYZ(i, x * swell, y * (1.07 - 0.12 * x), z * swell);
  }
  bloom.computeVertexNormals();
  return bloom;
}

export function createTradeInventory(cycleNodes, introduction, particleStudy = false) {
  const panel = document.createElement('aside');
  panel.className = 'trade-inventory';
  panel.setAttribute('aria-labelledby', 'inventoryTitle');
  panel.setAttribute('aria-hidden', 'true');
  const heading = document.createElement('div');
  heading.className = 'inventory-heading';
  const title = document.createElement('h2');
  title.id = 'inventoryTitle';
  title.textContent = 'Full Trade Cycle';
  const intro = document.createElement('p');
  intro.textContent = introduction;
  heading.append(title, intro);
  const trade = makeShelf('Trade stages', stages, true);
  const cargo = makeShelf('Hydrocarbons', products, false);
  cargo.shelf.classList.add('inventory-cargo');
  const cargoTitle = document.createElement('h3');
  cargoTitle.textContent = 'Hydrocarbons';
  panel.append(heading, trade.shelf, cargoTitle, cargo.shelf);
  document.body.append(panel);

  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 2000);
  camera.position.z = 750;
  const opacity = {value: 0};
  const clock = {value: 0};
  const equipment = equipmentMaterial(opacity, clock, particleStudy);
  const outline = new T.LineBasicMaterial({
    color: particleStudy ? 0x89cfff : 0xc1ef70, transparent: true, opacity: 0, depthWrite: false
  });
  const entries = [...trade.slots, ...cargo.slots].map((slot, index) => {
    const frame = new T.Group();
    const turntable = new T.Group();
    frame.rotation.x = index < stages.length ? 0.34 : 0.13;
    frame.add(turntable);
    scene.add(frame);
    return {slot, frame, turntable, size: 1, phase: index * 1.47 - 0.45, velocity: index % 2 ? -0.37 : 0.42};
  });

  function mount(entry, object) {
    const bounds = new T.Box3().setFromObject(object);
    const center = bounds.getCenter(new T.Vector3());
    const size = bounds.getSize(new T.Vector3());
    object.position.sub(center);
    entry.size = Math.max(size.x, size.y, size.z);
    entry.turntable.add(object);
    needsLayout = true;
  }

  function addEquipment(index) {
    const source = cycleNodes[index];
    if (!source.children.length || entries[index].turntable.children.length) return;
    const symbol = new T.Group();
    for (const part of source.children) {
      const layer = part.isLineSegments
        ? new T.LineSegments(part.geometry, outline)
        : new T.Mesh(part.geometry, equipment);
      if (part.isLineSegments) layer.renderOrder = 2;
      symbol.add(layer);
    }
    mount(entries[index], symbol);
  }

  let needsLayout = true;
  for (let index = 0; index < stages.length; index++) addEquipment(index);
  products.forEach(([, kind, tint], index) => {
    mount(entries[stages.length + index], new T.Mesh(shape(kind), productMaterial(tint, opacity, clock, particleStudy)));
  });

  function layout() {
    const width = window.innerWidth, height = window.innerHeight;
    camera.left = -width * 0.5;
    camera.right = width * 0.5;
    camera.top = height * 0.5;
    camera.bottom = -height * 0.5;
    camera.updateProjectionMatrix();
    for (const [index, entry] of entries.entries()) {
      const bounds = entry.slot.getBoundingClientRect();
      const allotted = Math.min(bounds.width * 0.76, bounds.height * (index === 2 ? 1.30 : 0.80));
      entry.frame.position.set(bounds.x + bounds.width * 0.5 - width * 0.5,
        height * 0.5 - bounds.y - bounds.height * 0.5, 0);
      entry.frame.scale.setScalar(allotted / entry.size);
    }
    needsLayout = false;
  }
  const observer = new ResizeObserver(() => { needsLayout = true; });
  observer.observe(panel);
  entries.forEach(({slot}) => observer.observe(slot));
  window.addEventListener('resize', () => { needsLayout = true; });

  let visible = false;
  function update(amount, time) {
    const showing = amount > 0.002;
    if (showing !== visible) {
      visible = showing;
      panel.classList.toggle('visible', showing);
      panel.setAttribute('aria-hidden', String(!showing));
    }
    if (!showing) return;
    panel.style.opacity = String(amount);
    opacity.value = amount;
    clock.value = time;
    outline.opacity = amount * (particleStudy ? 0.39 : 0.72);
    if (needsLayout) layout();
    entries.forEach(({turntable, phase, velocity}) => {
      turntable.rotation.y = phase + time * velocity;
    });
  }

  function draw(renderer) {
    if (!visible) return;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(scene, camera);
    renderer.autoClear = true;
  }

  return {update, draw, setVessel: () => addEquipment(2)};
}
