import * as T from '../three.module.js';
import {toCreasedNormals} from '../BufferGeometryUtils.js';
import {surfaceVertex, surfaceFragment, limePointPalette, particleLook, equipmentPalette, loadingCutaway, radarTransition, createWater, oceanMaterial, limeLandMaterial, tintGlobeSurface} from './shader-style.js?v=32';
import {createTerminalLoading, loadingBeats} from './terminal-loading.js?v=1.8';
import {createEngravedLand} from './land-engraving.js?v=2';
import {createRadarMap, chartWaterLayer} from './radar-map.js?v=29';
import {createTradeInventory} from './trade-inventory.js?v=15';
import {createParticleFlow, createTradeMorph} from './particle-flow.js?v=16';
const $=s=>document.querySelector(s),canvas=$('#scene'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const previewParams=new URLSearchParams(location.search);
const landStyle=previewParams.get('land');
const engravingPreview=landStyle==='engraving';
const mapStyle=previewParams.get('map');
const radarMapEnabled=!engravingPreview&&mapStyle!=='points';
const terminalMap=mapStyle==='terminal';
const radarChartPreview=radarMapEnabled&&mapStyle==='radar';
const particlePreview=radarMapEnabled&&mapStyle==='particles';
const inventoryPreview=radarMapEnabled&&(mapStyle==='inventory'||particlePreview);
const layeredChartPreview=radarChartPreview||inventoryPreview;
const atlasPreview=radarMapEnabled&&(mapStyle==='atlas'||terminalMap||layeredChartPreview);
document.body.classList.toggle('atlas-study',atlasPreview);
document.body.classList.toggle('inventory-study',inventoryPreview);
document.body.classList.toggle('particle-study',particlePreview);
const limeDotsPreview=landStyle==='dots'||(!landStyle&&radarMapEnabled);
const cyan=0x86b5d3,lime=particlePreview?0x9bdfff:0xc8f85b;
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('#error').hidden=false;$('#loader')?.classList.add('done');throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x000000,0);
const scene=new T.Scene(),camera=new T.PerspectiveCamera(37,1,.1,1200),world=new T.Group();scene.add(world);
const globeScreenCenter=new T.Vector2(.57,.52);
const radarUniforms={
 uRadarCenter:{value:globeScreenCenter},uRadarPhase:{value:1},uRadarStrength:{value:0},
 uRadarSize:{value:.32},uAspect:{value:1}
};
const worldHeading=-.06;
let time=0,progress=0,paused=reduced,auto=false,angle=0,angleTarget=0,pitch=0,pitchTarget=0,drag=false,lastX=0,lastY=0,last=performance.now(),ready=false,xray=false,stage=-1,autopos=0;
const shared={uTime:{value:0},uScan:{value:80},uReveal:{value:0},uXray:{value:0},uLoadingGrid:{value:0}};
const portShared={uTime:shared.uTime,uScan:{value:80},uReveal:{value:0},uXray:shared.uXray,uLoadingGrid:{value:0}};
const pixelScale = {value: innerHeight * renderer.getPixelRatio() * 0.5};
function surfaceMaterial(uniforms, vesselFinish=false, loadingGrid=false) {
  const defines={};
  if(vesselFinish)defines.VESSEL_FINISH=1;
  if(loadingGrid)defines.LOADING_GRID_PASS=1;
  if(particlePreview)defines.PARTICLE_STUDY=1;
  return new T.ShaderMaterial({
    uniforms, defines, vertexShader: surfaceVertex, fragmentShader: surfaceFragment,
    side: loadingGrid?T.FrontSide:T.DoubleSide, transparent:loadingGrid||particlePreview, depthWrite:!loadingGrid,
    forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
  });
}
function edgeMaterial(uniforms,opacity=.55,vesselFinish=false) {
 return new T.ShaderMaterial({
  uniforms:{...uniforms,uOpacity:{value:opacity}},transparent:true,depthWrite:false,
  defines:{...(vesselFinish?{VESSEL_FINISH:1}:{}),...(particlePreview?{PARTICLE_STUDY:1}:{})},
  vertexShader:`
    varying vec3 vP;
    varying float vDepth;
    void main(){
      vP=position;
      vec4 view=modelViewMatrix*vec4(position,1.0);
      vDepth=-view.z;
      gl_Position=projectionMatrix*view;
    }
  `,
  fragmentShader:`
    uniform float uTime,uScan,uReveal,uOpacity,uXray,uLoadingGrid;
    varying vec3 vP;
    varying float vDepth;
    ${limePointPalette}
    ${loadingCutaway}
    ${particleLook}
    ${equipmentPalette}
    void main(){
      if(vP.x>uScan)discard;
      float band=exp(-pow((vP.x-sin(uTime*0.22)*32.0)*0.55,2.0));
      float highlight=clamp(smoothstep(-3.0,9.0,vP.y)*0.74+band*0.49,0.0,1.0);
      vec3 lime=limePointColor(0.86,highlight);
      float visibility=uXray>0.5?0.45:1.0;
      if(insideLoadingCutaway(vP,uLoadingGrid))visibility*=0.37;
      float intensity=uOpacity*0.86+band*0.22;
      #ifdef VESSEL_FINISH
        float deck=smoothstep(7.65,8.55,vP.y);
        float hatch=deck*(1.0-smoothstep(3.65,4.55,abs(vP.z)));
        intensity=uOpacity*(mix(0.71,0.33,deck)+0.11*hatch)+band*0.08;
        lime*=vec3(0.77,0.82,0.81);
      #endif
      #ifdef PARTICLE_STUDY
        float wave=particleWave(vP,uTime);
        lime=equipmentBlue(highlight,wave);
        float crestLight=smoothstep(.27,.98,wave);
        float bead=smoothstep(.45,1.,.5+.5*sin(dot(vP,vec3(1.,1.3,.8))*13.));
        lime=mix(lime,vec3(.42,.93,1.),.35*bead*crestLight);
        intensity*=(.20+.70*crestLight)*mix(.42,1.45,bead);
      #endif
      float fog=exp(-vDepth*0.0025);
      gl_FragColor=vec4(lime,intensity*uReveal*fog*visibility);
    }
  `
 });
}
const vessel=new T.Group();vessel.position.y=-3.2;world.add(vessel);
let vesselSurface,vesselEdges,vesselLoadingGrid;
async function loadVessel(){const buffers=await Promise.all(['vessel-surface.bin','vessel-edges.bin'].map(async n=>{const r=await fetch('../'+n);if(!r.ok)throw Error('Geometry '+r.status);return r.arrayBuffer();}));
 const geo=new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(buffers[0]),3));
 toCreasedNormals(geo,T.MathUtils.degToRad(48));
 geo.computeBoundingSphere();
 vesselSurface=new T.Mesh(geo,surfaceMaterial(shared,true));vessel.add(vesselSurface);
 vesselLoadingGrid=new T.Mesh(geo,surfaceMaterial(shared,true,true));
 vesselLoadingGrid.visible=false;
 vesselLoadingGrid.renderOrder=6;
 vessel.add(vesselLoadingGrid);
 const edges=new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(buffers[1]),3));edges.computeBoundingSphere();vesselEdges=new T.LineSegments(edges,edgeMaterial(shared,.46,true));vesselEdges.renderOrder=2;vessel.add(vesselEdges);setupCycleVessel(geo,edges);
 inventory?.setVessel();
 ready=true;$('#loader')?.classList.add('done');}
loadVessel().catch(e=>{console.error(e);$('#loader')?.classList.add('done');$('#error').hidden=false;});
// Terminal: build physical shapes and consolidate into just two draw calls.
const solid=[],normals=[],edge=[];
function addGeometry(g,x,y,z,rx=0,ry=0,rz=0) {
  const matrix=new T.Matrix4().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz)),new T.Vector3(1,1,1));
  g.applyMatrix4(matrix);
  const edges=new T.EdgesGeometry(g,22);
  for(const value of edges.attributes.position.array)edge.push(value);
  const {position,normal}=g.attributes;
  for(let i=0;i<(g.index?.count??position.count);i++) {
    const index=g.index?g.index.getX(i):i;
    solid.push(position.getX(index),position.getY(index),position.getZ(index));
    normals.push(normal.getX(index),normal.getY(index),normal.getZ(index));
  }
  g.dispose();
  edges.dispose();
}
function box(x,y,z,w,h,d){addGeometry(new T.BoxGeometry(w,h,d),x,y,z);}
function pipe(points,r=.12){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');addGeometry(new T.TubeGeometry(curve,Math.max(8,points.length*6),r,6,false),0,0,0);}
function ring(x,y,z,r){for(let i=0;i<64;i++){let a=i/64*Math.PI*2,b=(i+1)/64*Math.PI*2;edge.push(x+r*Math.cos(a),y,z+r*Math.sin(a),x+r*Math.cos(b),y,z+r*Math.sin(b));}}
function rail(x1,z1,x2,z2,y){edge.push(x1,y,z1,x2,y,z2);let len=Math.hypot(x2-x1,z2-z1),n=Math.ceil(len/1.5);for(let i=0;i<=n;i++){let t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;edge.push(x,y-.7,z,x,y,z);}}
box(0,-3.5,-20,63,1.1,27);box(0,-2.8,-5.5,59,1,4);
for(let x=-28;x<=28;x+=4){addGeometry(new T.CylinderGeometry(.24,.3,5,8),x,-5.5,-5.5);box(x,-2.15,-3.2,1,.35,.45);}
rail(-29,-3.5,29,-3.5,-1.6);rail(-29,-7.5,29,-7.5,-1.6);
for(let row=0;row<2;row++)for(let col=0;col<3;col++){
 let x=-20+col*16,z=-15-row*14,r=5;box(x,-2.75,z,11,.5,11);addGeometry(new T.CylinderGeometry(r,r,7.8,48,1),x,1.35,z);addGeometry(new T.ConeGeometry(r,.8,48),x,5.65,z);ring(x,5.3,z,r+.15);ring(x,6.05,z,r-.3);
 for(let y=-2.1;y<5;y+=1.25)ring(x,y,z,r+.025);
 for(let i=0;i<24;i++){let a=i/24*Math.PI*2;edge.push(x+(r-.3)*Math.cos(a),5.45,z+(r-.3)*Math.sin(a),x+(r-.3)*Math.cos(a),6.05,z+(r-.3)*Math.sin(a));}
 // External access ladder, rail and individual rungs.
 for(let dx of [-.25,.25])edge.push(x+dx,-2.3,z+r+.25,x+dx,6.25,z+r+.25);
 for(let y=-2.2;y<6.2;y+=.4)edge.push(x-.25,y,z+r+.25,x+.25,y,z+r+.25);
 pipe([[x,-1.6,z+r],[x,-1.6,z+r+1.2],[x,-1.6,-8.4],[25,-1.6,-8.4]],.12);
 box(x,5.65,z,.8,.3,.8);
}
for(let z of [-8.4,-9.2,-10]){pipe([[-28,-1.5,z],[28,-1.5,z],[29,-.5,z],[29,1,z-5]],.13);for(let x=-27;x<28;x+=4)box(x,-2,z,.5,1,.5);}
for(let x of [-16,0,16]){box(x,-.8,-5.5,1,2,1);pipe([[x,-1,-8.4],[x,1,-6],[x,3,-5],[x+1,4,-3],[x+1,3,0]],.2);addGeometry(new T.CylinderGeometry(.45,.45,.18,12),x,2,-5);}
box(25,-.8,-22,8,4,8);box(25,1.5,-22,9,.4,9);rail(21,-18,29,-18,2.2);
for(let x of [22,25,28]){addGeometry(new T.CylinderGeometry(.65,.65,10,20),x,3,-31);ring(x,8,-31,.8);pipe([[x,8,-31],[x,9,-31],[x+1,9,-31]],.12);}
const port=new T.Group();world.add(port);
function geometry(data){const g=new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(data,3));g.computeBoundingSphere();return g;}
const portGeo=geometry(solid).setAttribute('normal',new T.Float32BufferAttribute(normals,3));const portSurface=new T.Mesh(portGeo,surfaceMaterial(portShared));const portEdges=new T.LineSegments(geometry(edge),edgeMaterial(portShared,.53));portEdges.renderOrder=2;port.add(portSurface,portEdges);
// Both layers sample the same animated water surface.
const {group: flow, uniforms: water} = createWater(shared.uTime, pixelScale, particlePreview);
world.add(flow);
const particleFlow=particlePreview?createParticleFlow(shared.uTime,pixelScale):null;
if(particleFlow)world.add(particleFlow.points);
const radar=new T.Group();radar.position.y=-3.5;world.add(radar);
function path(points,color=cyan,opacity=.3,parent=radar){const m=new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});const o=new T.Line(new T.BufferGeometry().setFromPoints(points.map(p=>new T.Vector3(...p))),m);parent.add(o);return o;}
const radarBlue=0x68adf2,radarDim=0x4879ae;
for(let r of [12,24,36,48]){const pts=[];for(let i=0;i<=256;i++){const a=i/256*Math.PI*2;pts.push([Math.cos(a)*r,0,Math.sin(a)*r]);}path(pts,r===36?radarBlue:radarDim,r===36?.23:.13);}
for(let i=0;i<120;i++){let a=i/120*Math.PI*2,r=i%5===0?47:47.6;path([[Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(a)*48,0,Math.sin(a)*48]],i%5===0?radarBlue:radarDim,.27);}
for(let a=0;a<Math.PI*2;a+=Math.PI/2)path([[Math.cos(a)*9,0,Math.sin(a)*9],[Math.cos(a)*49,0,Math.sin(a)*49]],radarDim,.2);
const sweep=new T.Group();radar.add(sweep);for(let i=0;i<24;i++){let a=i*.009;path([[0,.03,0],[Math.cos(a)*48,.03,Math.sin(a)*48]],radarBlue,i/24*.13,sweep);}
const radarLines=[];
radar.traverse(object=>{if(object.isLine)radarLines.push([object.material,object.material.opacity]);});
const berthZ=3.2;
const updateTerminalLoading=createTerminalLoading(vessel,world,berthZ,particlePreview);
const loadMeter=$('#terminalLoading'),loadLabel=$('#loadingValue'),loadLevel=$('#loadingLevel');
let sailingProgress=0,loadingElapsed=reduced?loadingBeats.fillEnd:0,lastFill=-1;
// The supply chain expands into four physical nodes, then into a geographic network.
const cycleGroup=new T.Group();cycleGroup.position.set(0,1,-4);world.add(cycleGroup);
const cycleUniforms={uTime:shared.uTime,uScan:{value:100},uReveal:{value:1},uXray:{value:0},uLoadingGrid:{value:0}};
const cycleNodes=[],cycleMat=[];
function cycleShape(parts,x,scale=1){const verts=[],lines=[];for(const [kind,pos,size] of parts){let g=kind==='cyl'?new T.CylinderGeometry(size[0],size[0],size[1],24):new T.BoxGeometry(...size);g.translate(...pos);const e=new T.EdgesGeometry(g,22);for(const v of e.attributes.position.array)lines.push(v);const ng=g.toNonIndexed();for(const v of ng.attributes.position.array)verts.push(v);g.dispose();ng.dispose();e.dispose();}let group=new T.Group();group.position.x=x;group.scale.setScalar(scale);let g=geometry(verts);g.computeVertexNormals();const face=new T.Mesh(g,surfaceMaterial(cycleUniforms)),em=edgeMaterial(cycleUniforms,.52),lineMesh=new T.LineSegments(geometry(lines),em);lineMesh.renderOrder=2;group.add(face,lineMesh);cycleGroup.add(group);cycleMat.push(em);cycleNodes.push(group);return group;}
cycleShape([['box',[0,-2,0],[15,1,11]],['box',[-3,0,1],[8,3,5]],['cyl',[-5,5,-2],[.7,12]],['cyl',[-1,7,-2],[.9,16]],['cyl',[3,4,-2],[.6,10]],['box',[4,0,2],[4,3,5]],['box',[-1,2,1],[13,.3,.4]]],-35,.9);
cycleShape([['box',[0,-2,0],[15,1,11]],['cyl',[-4,1,0],[3,6]],['cyl',[4,1,0],[3,6]],['box',[0,-1,5],[13,.4,.4]]],-11,.9);
const cycleShipHolder=new T.Group();cycleShipHolder.position.set(13,-2,0);cycleShipHolder.scale.setScalar(.33);cycleGroup.add(cycleShipHolder);cycleNodes.push(cycleShipHolder);
function setupCycleVessel(geo,edges){const fill=new T.Mesh(geo,surfaceMaterial(cycleUniforms,true));const em=edgeMaterial(cycleUniforms,.46,true);const lines=new T.LineSegments(edges,em);lines.renderOrder=2;cycleShipHolder.add(fill,lines);cycleMat.splice(2,0,em);}
cycleShape([['box',[0,-2,0],[16,1,11]],['box',[0,.5,0],[12,5,7]],['box',[0,3.2,0],[13,.4,8]],['box',[-3,1,3.55],[3,2,.2]],['box',[3,1,3.55],[3,2,.2]],['cyl',[6,4,-3],[.4,10]]],37,.9);
const inventory=inventoryPreview&&!particlePreview?createTradeInventory(cycleNodes,$('#mapCycle .intro').textContent):null;
if(particlePreview) {
 const title='Secton at a Glance';
 $('#mapCycle h2').textContent=title;
 $('#terminal .discover').firstChild.textContent=title+' ';
}
const tradeMorph=particlePreview?createTradeMorph($('#mapCycle .copy'),pixelScale,globeScreenCenter):null;
const terminalCopy=particlePreview?$('#terminal .copy'):null;
const globeCopy=particlePreview?$('#globe .copy'):null;
const chainLine=path([[-35,-1,4],[-35,-1,9],[-11,-1,9],[-11,-1,4],[-11,-1,9],[13,-1,9],[13,-1,4],[13,-1,9],[37,-1,9],[37,-1,4]],lime,.65,cycleGroup);
const chainPulse=new T.Mesh(new T.SphereGeometry(.25,12,12),new T.MeshBasicMaterial({color:lime}));cycleGroup.add(chainPulse);
const selectionRings=[];
for(const x of [-35,-11,13,37]){let pts=[];for(let i=0;i<=96;i++){let a=i/96*Math.PI*2;pts.push([x+10*Math.cos(a),-2.25,Math.sin(a)*8]);}selectionRings.push(path(pts,lime,.2,cycleGroup));}
let activeStep=0,manualStepUntil=0;
const stepDescriptions=['Работа с производителями и нефтеперерабатывающими заводами.','Поиск источников, структурирование условий и организация поставки.','Планирование маршрутов и управление физической доставкой.','Исполнение обязательств и поставка на конечные рынки.'];
function selectStep(n,manual=false){activeStep=n;if(manual)manualStepUntil=time+8;document.querySelectorAll('[data-step]').forEach((b,i)=>b.classList.toggle('selected',i===n));$('#stepDescription').textContent=stepDescriptions[n];}
document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>selectStep(+b.dataset.step,true));
// Globe: actual Natural Earth shorelines, a geographic graticule and illustrative connections.
const globeRoot=new T.Group();globeRoot.position.set(7,4,-6);world.add(globeRoot);const earth=new T.Group();globeRoot.add(earth);const R=27;
function globePoint(lat,lon,r=R){let p=lat*Math.PI/180,l=lon*Math.PI/180;return new T.Vector3(r*Math.cos(p)*Math.cos(l),r*Math.sin(p),-r*Math.cos(p)*Math.sin(l));}
const earthSurface=new T.Mesh(new T.SphereGeometry(R,96,64),new T.MeshBasicMaterial({color:0x0a1020}));earth.add(earthSurface);
if(atlasPreview) {
 earthSurface.material.transparent=true;
 earthSurface.renderOrder=-1;
}
const earthMaterials=[];
function geoLine(points,color=cyan,opacity=.2,parent=earth){const o=path(points.map(p=>p.toArray()),color,opacity,parent);o.material.userData.base=opacity;earthMaterials.push(o.material);return o;}
for(let lat=-75;lat<=75;lat+=7.5){let pts=[];for(let lon=-180;lon<=180;lon+=2)pts.push(globePoint(lat,lon,R+.02));geoLine(pts,cyan,lat===0?.32:.13);}
for(let lon=-180;lon<180;lon+=10){let pts=[];for(let lat=-90;lat<=90;lat+=2)pts.push(globePoint(lat,lon,R+.025));geoLine(pts,cyan,.14);}
// Offset wavy parallels suggest ocean flow without claiming bathymetric measurements.
for(let j=-24;j<=24;j++){let pts=[];for(let k=-180;k<=180;k+=2){const lat=j*3+Math.sin(k*.07+j*.2)*1.15;pts.push(globePoint(lat,k,R+.055));}geoLine(pts,0x699f98,.13);}
let oceanDots,engravedLand,staticLandDots,radarMap,landEcho;
function createCoastRelief(inland,columns,rows){
  // Propagate the distance to the shore through each landmass, including across the date line.
  for(const step of [1,-1,1,-1]) {
    for(let y=0;y<rows;y++) {
      const row=step===1?y:rows-1-y;
      const rowStart=row*columns;
      const previousRow=rowStart-step*columns;
      for(let x=0;x<columns;x++) {
        const column=step===1?x:columns-1-x;
        const index=rowStart+column;
        if(!inland[index])continue;
        const beside=(column-step+columns)%columns;
        const across=(column+step+columns)%columns;
        let distance=Math.min(inland[index],inland[rowStart+beside]+1);
        if(y>0)distance=Math.min(distance,inland[previousRow+column]+1,
          inland[previousRow+beside]+Math.SQRT2,inland[previousRow+across]+Math.SQRT2);
        inland[index]=distance;
      }
    }
  }
  function sampleRow(row,lon){
    const x=T.MathUtils.euclideanModulo((lon+180)*columns/360-(row%2)*.5,columns);
    const column=Math.floor(x);
    const offset=row*columns;
    return T.MathUtils.lerp(inland[offset+column],inland[offset+(column+1)%columns],x-column);
  }
  return (lon,lat)=>{
    const y=T.MathUtils.clamp((lat+88)*(rows-1)/176,0,rows-1);
    const below=Math.floor(y),above=Math.min(below+1,rows-1);
    const distance=T.MathUtils.lerp(sampleRow(below,lon),sampleRow(above,lon),y-below);
    const rise=1-Math.exp(-distance/12);
    const interior=1-Math.exp(-distance/34);
    const detail=heightField(lon,lat)*.042*T.MathUtils.smoothstep(distance,5,21);
    return .48*rise+.52*interior+detail;
  };
}
function terrainLight(lon,lat,height){
  const slopeX=(height(lon+1.55,lat)-height(lon-1.55,lat))*4.55;
  const slopeY=(height(lon,lat+1.55)-height(lon,lat-1.55))*4.55;
  const direct=(.64*slopeX-.47*slopeY+.60)/Math.hypot(slopeX,slopeY,1);
  return T.MathUtils.clamp(.09+.78*direct+.10*height(lon,lat),0,1);
}
function sampleLimeLand(isLand,height) {
  const points=[];
  const mapStyles=[];
  const filmInsets=particlePreview?[]:null;
  // Crossfade between the sheet and globe grids while the map folds.
  const spacingByView=particlePreview?[[1.16,0],[.99,1]]:[[.9,0],[.75,1]];
  for(const [spacing,globeOnly] of spacingByView) {
    const rows=Math.floor(176/spacing)+1;
    const columns=Math.round(360/spacing);
    const longitudeStep=360/columns;
    for(let row=0;row<rows;row++) {
      for(let column=0;column<columns;column++) {
        const gridLon=-180+(column+.25+(row%2)*.5)*longitudeStep;
        const gridLat=-88+row*spacing;
        const lon=gridLon+.16*longitudeStep*Math.sin(column*17.71+row*29.25);
        const lat=gridLat+.17*spacing*Math.cos(column*27.17+row*19.67);
        if(!isLand(lon,lat))continue;
        points.push(...globePoint(lat,lon,R+.09).toArray());
        if(filmInsets)filmInsets.push(T.MathUtils.smoothstep(height(lon,lat),.04,.57));
        if(globeOnly){
          mapStyles.push(0,0,.60,1);
          continue;
        }
        const flatLon=gridLon+.10*Math.sin(gridLat*.44);
        const flatLat=gridLat+.09*Math.sin(gridLon*.28+gridLat*.41);
        const shiftedOnLand=isLand(flatLon,flatLat);
        mapStyles.push(
          shiftedOnLand?T.MathUtils.degToRad(flatLon-lon)*mapWidthRadius:0,
          shiftedOnLand?T.MathUtils.degToRad(flatLat-lat)*mapRadius:0,
          terrainLight(lon,lat,height),
          0
        );
      }
    }
  }
  const land=geometry(points).setAttribute('mapStyle',new T.Float32BufferAttribute(mapStyles,4));
  if(filmInsets)land.setAttribute('filmInset',new T.Float32BufferAttribute(filmInsets,1));
  return land;
}
function sampleMapPoints(isLand) {
  const [columns, rows] = particlePreview ? [402, 198] : [516, 250];
  const coastFalloff = particlePreview ? 10.5 : 13;
  const distance = new Uint8Array(columns * rows);
  const inland = limeDotsPreview?new Float32Array(columns*rows):null;
  const landPoints = [];
  const north = row => -88 + row * 176 / (rows - 1);
  const east = (column, row) => -180 + (column + (row % 2) * 0.5) * 360 / columns;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const lon = east(column, row);
      const lat = north(row);
      const index=row*columns+column;
      if (!isLand(lon,lat)) distance[index]=15;
      else if (inland) inland[index]=180;
      else landPoints.push(...globePoint(lat,lon,R+.09).toArray());
    }
  }

  // Build a coastal falloff so waves flatten beside land, including at the map seam.
  for (const step of [1, -1]) {
    for (let y = 0; y < rows; y++) {
      const row = step === 1 ? y : rows - 1 - y;
      for (let x = 0; x < columns; x++) {
        const column = step === 1 ? x : columns - 1 - x;
        const index = row * columns + column;
        const horizontal = row * columns + (column - step + columns) % columns;
        distance[index] = Math.min(distance[index], distance[horizontal] + 1);
        if (y > 0) distance[index] = Math.min(distance[index], distance[index - step * columns] + 1);
      }
    }
  }

  const oceanPoints = [];
  const offshore = [];
  const sheetOnly = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const depth = distance[row * columns + column];
      if (!depth) continue;
      oceanPoints.push(...globePoint(north(row), east(column, row), R + 0.11).toArray());
      offshore.push(T.MathUtils.smoothstep(depth, 1, coastFalloff));
      sheetOnly.push(0);
    }
  }
  // Keep the expanded polar water dense on the flat map as it unfolds.
  for(const [start,end,rowCount] of [[southOceanLat,southOceanStart,19],[northOceanStart,90,20]]) {
    for(let row=0;row<rowCount;row++) {
      const lat=T.MathUtils.lerp(start,end,(row+.5)/rowCount);
      for(let column=0;column<columns;column++) {
        const lon=east(column,row);
        if(isLand(lon,lat))continue;
        oceanPoints.push(...globePoint(lat,lon,R+.11).toArray());
        offshore.push(1);
        sheetOnly.push(1);
      }
    }
  }
  return {
    ocean: geometry(oceanPoints)
      .setAttribute('offshore',new T.Float32BufferAttribute(offshore,1))
      .setAttribute('sheetOnly',new T.Float32BufferAttribute(sheetOnly,1)),
    land: inland?sampleLimeLand(isLand,createCoastRelief(inland,columns,rows)):geometry(landPoints)
  };
}

async function loadLand(){
 const res=await fetch('../land.geojson');
 if(!res.ok)throw Error('Coastline '+res.status);
 const data=await res.json();
 const landPolygons=data.features.flatMap(({geometry})=>
  geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates
 );
 const coast=[],polys=[];
 for(const [ring,...holes] of landPolygons) {
  polys.push({ring,minX:Math.min(...ring.map(p=>p[0])),maxX:Math.max(...ring.map(p=>p[0])),minY:Math.min(...ring.map(p=>p[1])),maxY:Math.max(...ring.map(p=>p[1]))});
  for(const contour of [ring,...holes]) {
   for(let i=1;i<contour.length;i++){
    coast.push(...globePoint(contour[i-1][1],contour[i-1][0],R+.12).toArray(),...globePoint(contour[i][1],contour[i][0],R+.12).toArray());
   }
  }
 }
 const shorelineMaterial=new T.LineBasicMaterial({color:particlePreview?0x6c9be8:0xc2e0db,transparent:true,opacity:.83,depthWrite:false});
 shorelineMaterial.userData.base=.83;
 shorelineMaterial.userData.flatBackdrop=true;
 earthMaterials.push(shorelineMaterial);
 const shoreline=new T.LineSegments(geometry(coast),shorelineMaterial);
 shoreline.renderOrder=3;
 earth.add(shoreline);
 const inside=(x,y,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 const isLand=(lon,lat)=>polys.some(p=>lon>=p.minX&&lon<=p.maxX&&lat>=p.minY&&lat<=p.maxY&&inside(lon,lat,p.ring));
 const landAt=point=>isLand(
  Math.atan2(-point.z,point.x)*180/Math.PI,
  Math.asin(point.y/point.length())*180/Math.PI
 );
 // Trim isolines in short sections to follow bays, peninsulas and islands.
 const start=new T.Vector3(),end=new T.Vector3(),previous=new T.Vector3(),current=new T.Vector3();
 for(const layer of topoLayers) {
  const positions=layer.geometry.attributes.position;
  const clipped=[];
  for(let i=0;i<positions.count;i+=2) {
   start.fromBufferAttribute(positions,i);
   end.fromBufferAttribute(positions,i+1);
   previous.copy(start);
   let previousOnLand=landAt(previous);
   for(let part=1;part<=3;part++) {
    current.lerpVectors(start,end,part/3);
    const currentOnLand=landAt(current);
    if(previousOnLand&&currentOnLand)clipped.push(...previous.toArray(),...current.toArray());
    previous.copy(current);
    previousOnLand=currentOnLand;
   }
  }
  layer.geometry.dispose();
  layer.geometry=geometry(clipped);
  foldRegistered.delete(layer);
  layer.visible=true;
 }
 const samples=sampleMapPoints(isLand);
 const material=oceanMaterial(shared.uTime,pixelScale,foldUniform,mapHalfWidth,particlePreview);
 const sea=new T.Points(samples.ocean,material);
 sea.renderOrder=1;
 registerFold(sea);
 oceanDots=material.uniforms.uOpacity;
 const landTexture=limeDotsPreview?limeLandMaterial(pixelScale,foldUniform,shared.uTime,particlePreview):new T.PointsMaterial({
  color:0x506673,size:.07,transparent:true,opacity:.15,depthWrite:false
 });
 if(limeDotsPreview) {
  staticLandDots=landTexture.uniforms.uOpacity;
 }else {
  landTexture.userData.base=.15;
  landTexture.userData.landPattern=true;
  earthMaterials.push(landTexture);
 }
 const land=new T.Points(samples.land,landTexture);
 earth.add(land,sea);
 if(particlePreview&&limeDotsPreview) {
  registerFold(land);
  land.renderOrder=3;
  landEcho=new T.Points(samples.land,limeLandMaterial(pixelScale,foldUniform,shared.uTime,true,true));
  landEcho.frustumCulled=false;
  landEcho.renderOrder=1;
  landEcho.visible=false;
  foldRegistered.add(landEcho);
  earth.add(landEcho);
 }
 if(radarMapEnabled) {
  registerFold(earthSurface);
  radarMap=createRadarMap(sheet,landPolygons,foldUniform,shared.uTime,
   passageMarks.map(mark=>flatten(mark.userData.geo)),particlePreview?'particles':inventoryPreview?'radar':mapStyle,radarUniforms);
  if(particlePreview) {
   const coast=radarMap.uniforms.uCoastField.value;
   tintGlobeSurface(earthSurface.material,coast);
   tradeMorph.setGlobeCoast(coast);
  }
  earth.add(radarMap.mesh);
 }
 if(engravingPreview) {
  engravedLand=createEngravedLand(
   landPolygons,
   (lon,lat)=>[T.MathUtils.degToRad(lon)*mapWidthRadius,flatMapY(lat),.055],
   (lon,lat)=>globePoint(lat,lon,R+.07).toArray(),
   foldUniform
  );
  earth.add(engravedLand.mesh);
 }
}
loadLand().catch(e=>{console.error(e);console.error('The coastline data could not load. Reload the page to try again.');});
const markets=[{name:'Марокко',lat:33.97,lon:-6.85,region:'africa'},{name:'Турция',lat:39.93,lon:32.86,region:'asia'},{name:'Бразилия',lat:-15.79,lon:-47.88,region:'latin'},{name:'Парагвай',lat:-25.26,lon:-57.57,region:'latin'},{name:'Аргентина',lat:-34.6,lon:-58.38,region:'latin'},{name:'Малайзия',lat:3.14,lon:101.69,region:'asia'},{name:'Сингапур',lat:1.35,lon:103.82,region:'asia'},{name:'Пакистан',lat:33.69,lon:73.05,region:'asia'},{name:'Индия',lat:28.61,lon:77.21,region:'asia'}];
const dubai=globePoint(25.2,55.27,R+.25);const hub=new T.Mesh(new T.SphereGeometry(.36,16,16),new T.MeshBasicMaterial({color:lime}));hub.position.copy(dubai);earth.add(hub);
const hubRings=new T.Group();hubRings.renderOrder=5;hubRings.position.copy(dubai);hubRings.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dubai.clone().normalize());earth.add(hubRings);
for(let r of [.8,1.5,2.3]){let pts=[];for(let i=0;i<=96;i++){let a=i/96*Math.PI*2;pts.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,0));}geoLine(pts,lime,.6,hubRings);}
const connections=[];let globeRotationTarget=-2.39,globeRotation=-2.39;
for(const market of markets){const end=globePoint(market.lat,market.lon,R+.2),start=dubai.clone(),a=start.clone().normalize(),b=end.clone().normalize(),omega=a.angleTo(b);let pts=[];for(let i=0;i<=100;i++){let t=i/100;const dir=a.clone().multiplyScalar(Math.sin((1-t)*omega)).add(b.clone().multiplyScalar(Math.sin(t*omega))).divideScalar(Math.sin(omega)).normalize();pts.push(dir.multiplyScalar(R+.3+Math.sin(Math.PI*t)*Math.min(8,omega*5)));}const arc=geoLine(pts,lime,.56);const pin=new T.Mesh(new T.SphereGeometry(.19,10,10),new T.MeshBasicMaterial({color:lime}));pin.position.copy(end);earth.add(pin);const runner=new T.Mesh(new T.SphereGeometry(.13,8,8),new T.MeshBasicMaterial({color:0xe5ffb9}));earth.add(runner);connections.push({market,arc,pin,runner,points:pts});}

const dubaiWorld=new T.Vector3(),projectedHub=new T.Vector3();

// Keep the globe's original graticule and parallels faint.
for(const child of earth.children) {
 if(child.isLine&&child.material.userData.base!==undefined&&!child.material.userData.maritime) {
  child.material.userData.base*=.13;
  child.material.userData.flatBackdrop=true;
 }
}
const topoLayers=[],topoMinor=[],topoMajor=[];
const contourScale=1.55;
const columns=372,rows=180;
const stepX=360/columns,stepY=174/rows;
const firstLevel=-2.7,levelSpacing=.235;
const lastLevel=Math.floor((2.7-firstLevel)/levelSpacing);
function heightField(lon,lat) {
 const x=lon*contourScale;
 const y=lat*contourScale;
 return Math.sin(x*.052+Math.sin(y*.038)*2.3)+.74*Math.cos(y*.105+Math.sin(x*.025)*2)
  +.47*Math.sin(x*.097+y*.068)+.22*Math.cos(x*.15-y*.13);
}
const contourSamples=Array.from({length:rows+1},(_,row)=>
 Array.from({length:columns+1},(_,column)=>heightField(-180+column*stepX,-87+row*stepY)));
for(let row=0;row<rows;row++) {
 for(let column=0;column<columns;column++) {
  const samples=[
   contourSamples[row][column],contourSamples[row][column+1],
   contourSamples[row+1][column+1],contourSamples[row+1][column]
  ];
  const first=Math.max(0,Math.ceil((Math.min(...samples)-firstLevel)/levelSpacing));
  const last=Math.min(lastLevel,Math.floor((Math.max(...samples)-firstLevel)/levelSpacing));
  if(first>last)continue;
  const x=-180+column*stepX,y=-87+row*stepY;
  const corners=[[x,y],[x+stepX,y],[x+stepX,y+stepY],[x,y+stepY]];
  for(let index=first;index<=last;index++) {
   const level=firstLevel+index*levelSpacing;
   const cuts=[];
   for(let from=0;from<4;from++) {
    const to=(from+1)%4;
    if((samples[from]>level)===(samples[to]>level))continue;
    const t=(level-samples[from])/(samples[to]-samples[from]);
    const lon=T.MathUtils.lerp(corners[from][0],corners[to][0],t);
    const lat=T.MathUtils.lerp(corners[from][1],corners[to][1],t);
    cuts.push(globePoint(lat,lon,R+.075));
   }
   const output=index%4===0?topoMajor:topoMinor;
   for(let i=0;i+1<cuts.length;i+=2)output.push(...cuts[i].toArray(),...cuts[i+1].toArray());
  }
 }
}
for(const [data,color,opacity] of [[topoMinor,0x87a550,.27],[topoMajor,0xb9e26f,.56]]) {
 const material=new T.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false});
 material.userData.base=opacity;
 material.userData.landPattern=true;
 earthMaterials.push(material);
 const layer=new T.LineSegments(geometry(data),material);
 layer.renderOrder=2;
 layer.visible=false;
 topoLayers.push(layer);
 earth.add(layer);
}
// The detailed ship settles into the flat infographic, using the same model.
let flatSelection=0;
const flatDetails=['Sourcing and working with producers','Structuring terms and arranging supply','Managing physical delivery','Delivering into end markets'];
document.querySelectorAll('[data-flat-step]').forEach(b=>b.onclick=()=>{flatSelection=+b.dataset.flatStep;document.querySelectorAll('[data-flat-step]').forEach((q,i)=>q.classList.toggle('selected',i===flatSelection));$('#flatStepText').textContent=flatDetails[flatSelection];});
const legendShip=$('#legendShip');

// One geometry for the flat map and globe: every coastline and grid vertex folds continuously.
const foldUniform={value:0},foldRegistered=new WeakSet();
const mapRadius=R*.8;
const mapWidthRadius = mapRadius * 1.20;
const mapHalfWidth = Math.PI * mapWidthRadius;
const northOceanStart=84;
const southOceanStart=-57,southOceanLat=-61;
function flatMapY(latitude) {
  const north=T.MathUtils.smoothstep(latitude,northOceanStart,90);
  const south=1-T.MathUtils.smoothstep(latitude,southOceanLat,southOceanStart);
  return T.MathUtils.degToRad(latitude+11*(north-south))*mapRadius;
}
const mapNorth=flatMapY(90),mapSouth=flatMapY(southOceanLat);
function flatten(v){const r=v.length()||1;return new T.Vector3(Math.atan2(-v.z,v.x)*mapWidthRadius,flatMapY(T.MathUtils.radToDeg(Math.asin(clamp(v.y/r,-1,1)))),Math.max(0,r-R)*.8);}
function foldPoint(v,fold){const p=flatten(v);const result=p.clone().lerp(v,fold);result.z+=Math.sin(fold*Math.PI)*.012*p.x*p.x;return result;}
function registerFold(o){if(foldRegistered.has(o)||!o.geometry)return;foldRegistered.add(o);const g=o.geometry,p=g.attributes.position,flat=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){let v=flatten(new T.Vector3(p.getX(i),p.getY(i),p.getZ(i)));flat.set(v.toArray(),i*3);}g.setAttribute('flatPosition',new T.BufferAttribute(flat,3));o.frustumCulled=false;
 const m=o.material;if(m.isShaderMaterial)return;
 m.onBeforeCompile=shader=>{shader.uniforms.uFold=foldUniform;shader.vertexShader='attribute vec3 flatPosition; uniform float uFold;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed=mix(flatPosition,position,uFold); transformed.z+=sin(uFold*3.14159265)*.012*flatPosition.x*flatPosition.x;');};m.customProgramCacheKey=()=> 'secton-map-fold';m.needsUpdate=true;}
// A gridded sheet avoids a longitude seam when folding the earth surface.
const sheet=new T.PlaneGeometry(1,1,180,90),sp=sheet.attributes.position,suv=sheet.attributes.uv;
for(let i=0;i<sp.count;i++){const v=globePoint(90-suv.getY(i)*180,(suv.getX(i)-.5)*360);sp.setXYZ(i,v.x,v.y,v.z);}earthSurface.geometry.dispose();earthSurface.geometry=sheet;earthSurface.material.side=T.DoubleSide;
// Major structural seaborne corridors. Waypoint geometry is a schematic synthesis, not AIS tracks.
const H=[[26.5,52],[26.2,56.6],[24.4,58.8],[21.5,61.5]];
const I=[[18,65],[18.8,72.5]],M=[[12,67],[6,74],[3,80],[5,88],[6,95],[4,99],[1.3,103.8]],C=[[5,108],[13,113],[20,118],[25,122],[30,123],[30,122]],J=[[5,108],[15,117],[24,125],[30,133],[35,140]];
const RS=[[13,57],[11.6,46],[12.8,43.3],[20,38.5],[27,34.8],[29.8,32.6],[31.4,32.4]],MED=[[33,28],[35,18],[36,8],[36,-2],[35.7,-6]],EU=[[39,-11],[46,-12],[49,-7],[50,-4],[51,1],[52,3],[52,4]];
const capeViaChannel=[[-36,22],[-30,35],[-24,39.3],[-18,41.6],[-12.7,43.4],[-9.2,48],[-5,54]];
const capeEastOfMadagascar=[[-36,22],[-33.5,35],[-29.4,46],[-26.6,52.6],[-21.4,54.1],[-13,56.2],[-6,59]];
const CAPE=[[10,62],[-4,57],...capeViaChannel.slice().reverse(),[-35,8],[-27,-15]],WA=[[4,5],[1,-2],[-2,-9]],BRA=[[-23,-43],[-27,-30],[-34,-7],[-36,12]],GULF=[[29,-94],[26,-91],[23,-85],[24,-82],[26,-79]],ATL=[[33,-70],[43,-38],[49,-12]],PAN=[[23,-85],[15,-79],[10,-79.7],[9.35,-79.9],[8.9,-79.6],[6,-82],[4,-95],[10,-130],[25,-160],[30,-180],[33,-205],[35,-220]];
const defs=[];function route(name,cargo,source,...parts){defs.push({name,cargo,source,points:parts.flat()});}
route('Персидский залив — Индия','oil','eia-chokepoints',H,I);
route('Персидский залив — Китай','oil','eia-chokepoints',H,M,C);
route('Персидский залив — Япония и Корея','oil','eia-chokepoints',H,M,J);
route('Персидский залив — Европа / Суэц','oil','eia-chokepoints',H,RS,MED,EU);
route('Персидский залив — Европа / мыс Доброй Надежды','oil','eia-chokepoints',H,CAPE,[[0,-17],[24,-19],[36,-12]],EU);
route('Западная Африка — Европа','oil','eia-nigeria',WA,[[8,-16],[24,-19],[36,-12]],EU);
route('Западная Африка — Индия','oil','eia-nigeria',WA,[[-15,-4],[-31,7]],capeViaChannel,[[8,65]],I);
route('Западная Африка — Китай','oil','eia-nigeria',WA,[[-15,-4],[-31,7]],capeEastOfMadagascar,M,C);
route('Бразилия — Европа','oil','eia-brazil',[[-23,-43],[-8,-32],[13,-29],[34,-18]],EU);
route('Бразилия — Китай','oil','eia-brazil',BRA,capeEastOfMadagascar,[[0,65]],M,C);
route('Гайана — Европа','oil','eia-guyana',[[8,-57],[17,-49],[33,-30],[47,-14]],EU);
route('Гайана — побережье США','oil','eia-guyana',[[8,-57],[14,-66],[17,-78],[23,-85],[26,-91],[29,-94]]);
route('США — Европа','oil','eia-us-oil',GULF,ATL,EU);
route('США — Азия / мыс Доброй Надежды','oil','eia-chokepoints',GULF,[[16,-62],[-5,-33],[-25,-12]],capeEastOfMadagascar,M,C);
route('Северное море — европейские НПЗ','oil','eia-chokepoints',[[60,3],[57,2],[54,3],[52,4]]);
route('Балтика — Индия / Суэц','oil','eia-russia',[[60,28],[59,22],[56,18],[55,13],[55.5,11],[57.7,10.5],[58,6],[54,3],[51,1],[50,-4],[46,-12],[36,-8]],MED.slice().reverse(),[[31.4,32.4]],RS.slice().reverse(),[[16,59]],I);
route('Чёрное море — Средиземноморье','oil','eia-russia',[[44.6,37.8],[43,34],[41.2,29.1],[41,29],[40.7,28],[40.1,26],[38,25],[35,22],[36,14]]);
route('Чёрное море — Индия','oil','eia-russia',[[44.6,37.8],[43,34],[41.2,29.1],[41,29],[40.7,28],[40.1,26],[38,25],[34,28],[31.4,32.4]],RS.slice().reverse(),[[17,61]],I);
route('Дальний Восток России — Китай','oil','eia-russia',[[42.7,133],[40,134],[36,131],[33,127],[30,123],[30,122]]);
route('США — Латинская Америка','products','eia-us-oil',GULF,[[16,-65],[7,-48],[-8,-35],[-23,-43]]);
route('США — Европа / нефтепродукты','products','eia-us-oil',GULF,[[30,-73],[40,-42],[48,-13]],EU);
route('Индия — Европа / нефтепродукты','products','opec-trade',[[22.5,69],[17,64]],RS,MED,EU);
route('Индия — Восточная Африка','products','opec-trade',[[22.5,69],[14,63],[4,53],[-5,43],[-6.5,39.5]]);
route('Ближний Восток — Европа / нефтепродукты','products','eia-chokepoints',H,RS,MED,EU);
route('Сингапур — Восточная Азия / нефтепродукты','products','opec-trade',[[1.3,103.8]],C);
route('США — Европа / СПГ','lng','eia-lng',GULF,ATL,[[50,-10],[51,-4],[51,1],[52,4]]);
route('США — Азия / СПГ, Панама','lng','eia-chokepoints',[[29,-94],[26,-91]],PAN);
route('США — Азия / СПГ, мыс Доброй Надежды','lng','eia-lng',GULF,[[12,-55],[-9,-27],[-30,-4]],capeViaChannel,M,J);
route('Катар — Азия / СПГ','lng','gecf-lng',[[26,51.5]],H,M,J);
route('Катар — Европа / СПГ, Суэц','lng','eia-chokepoints',[[26,51.5]],H,RS,MED,EU);
route('Австралия — Северо-Восточная Азия / СПГ','lng','gecf-lng',[[-20,116],[-15,115],[-9,116],[-8.5,115.7],[-7.8,115.8],[-5,117],[1,120],[10,123],[22,127],[30,133],[35,140]]);
route('Малайзия — Северо-Восточная Азия / СПГ','lng','gecf-lng',[[3,113],[8,114],[17,119],[24,124],[31,134],[35,140]]);
route('Нигерия — Европа / СПГ','lng','gecf-lng',[[4,7],[2,-2],[6,-14],[23,-18],[36,-12]],EU);
route('Алжир — Средиземноморье / СПГ','lng','gecf-lng',[[36.8,3],[39,3],[42,5],[43,5]]);
route('Норвегия — Европа / СПГ','lng','eia-lng',[[71,24],[71,12],[66,4],[60,1],[55,2],[52,4]]);
route('Сахалин — Северо-Восточная Азия / СПГ','lng','gecf-lng',[[46.6,142.9],[44,144],[40,144],[35,140]]);
route('США — Азия / СУГ, Панама','lpg','eia-lpg',[[29,-94],[26,-91]],PAN);
route('Персидский залив — Азия / СУГ','lpg','eia-chokepoints',H,M,J);
const marinePaths=defs.map(d=>d.points);

const maritime=[];
for(let n=0;n<marinePaths.length;n++){const d=defs[n],pts=marinePaths[n].map(([lat,lon])=>new T.Vector3(lon,lat,0));const curve=new T.CurvePath();for(let i=1;i<pts.length;i++)curve.add(new T.LineCurve3(pts[i-1],pts[i]));const positions=[];const samples=[];for(let i=0;i<=160;i++){const p=curve.getPoint(i/160),v=globePoint(p.y,p.x,R+.25+n*.006);samples.push(v);positions.push(v);}const segments=[];for(let i=1;i<positions.length;i++){const a=positions[i-1],b=positions[i];if(Math.abs(Math.atan2(-a.z,a.x)-Math.atan2(-b.z,b.x))<Math.PI)segments.push(...a.toArray(),...b.toArray());}const isRefined=d.cargo==='products'||d.cargo==='lpg';const routeColor=particlePreview?(d.cargo==='lng'?0x84e5fd:isRefined?0x7cc4ff:0x5b8cf5):(d.cargo==='lng'?0xa2f0d6:isRefined?0xb3c99a:0xd1ed90);const routeMaterial=new T.LineBasicMaterial({color:routeColor,transparent:true,opacity:.48,depthWrite:false});routeMaterial.userData.base=d.cargo==='lng'?.59:(d.cargo==='products'||d.cargo==='lpg')?.50:.57;routeMaterial.userData.maritime=true;earthMaterials.push(routeMaterial);const line=new T.LineSegments(geometry(segments),routeMaterial);line.renderOrder=4;earth.add(line);
 const mini=new T.Group();const hull=[[-1.4,-.32,0],[1.05,-.32,0],[1.6,0,0],[1.05,.32,0],[-1.4,.32,0],[-1.4,-.32,0]];path(hull,lime,.95,mini);path([[-.9,-.28,0],[-.9,.28,0]],cyan,.8,mini);path([[-.6,-.12,0],[.9,-.12,0]],cyan,.75,mini);path([[-.6,.12,0],[.9,.12,0]],cyan,.75,mini);path([[-.3,-.2,0],[-.3,.2,0],[.3,.2,0],[.3,-.2,0]],cyan,.7,mini);mini.renderOrder=5;earth.add(mini);const dot=new T.Mesh(new T.SphereGeometry(.21,12,12),new T.MeshBasicMaterial({color:particlePreview?0xb5f4ff:0xe1ffa5,transparent:true,depthWrite:false}));dot.renderOrder=5;earth.add(dot);maritime.push({line,mini,dot,samples,phase:n*.32});}
const passageMarks=[[26.5,56.5,'Ормуз'],[2.5,101.5,'Малакка'],[30,32.5,'Суэц'],[12.6,43.3,'Баб-эль-Мандеб'],[9.1,-79.7,'Панама'],[-34,18,'Мыс Доброй Надежды'],[41.1,29,'Турецкие проливы'],[57.5,10.5,'Датские проливы']].map(([lat,lon,name])=>{const m=new T.Mesh(new T.SphereGeometry(.31,12,12),new T.MeshBasicMaterial({color:particlePreview?0xabdfff:0xe3ff9c,transparent:true,opacity:.92}));m.renderOrder=5;m.userData.geo=globePoint(lat,lon,R+.7);m.userData.name=name;earth.add(m);return m;});
let fold=0;

// Subtle postprocessing bloom, kept narrow to preserve precision linework.
const postScene=new T.Scene(),postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1),quad=new T.Mesh(new T.PlaneGeometry(2,2));postScene.add(quad);
const rt=new T.WebGLRenderTarget(1,1),blurA=new T.WebGLRenderTarget(1,1,{depthBuffer:false}),blurB=new T.WebGLRenderTarget(1,1,{depthBuffer:false});
const postVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const blur=new T.ShaderMaterial({uniforms:{image:{value:null},direction:{value:new T.Vector2()},threshold:{value:0}},vertexShader:postVertex,fragmentShader:`uniform sampler2D image;uniform vec2 direction;uniform float threshold;varying vec2 vUv;vec3 read(vec2 p){vec3 c=texture2D(image,p).rgb;return max(c-vec3(threshold),vec3(0.));}void main(){vec3 c=read(vUv)*.227027;c+=(read(vUv+direction*1.384615)+read(vUv-direction*1.384615))*.316216;c+=(read(vUv+direction*3.230769)+read(vUv-direction*3.230769))*.070270;gl_FragColor=vec4(c,1.);}`});
const composite=new T.ShaderMaterial({
  defines:{...(layeredChartPreview&&!particlePreview?{CHART_OVERLAY:1}:{}),...(particlePreview?{PARTICLE_STUDY:1}:{})},
  uniforms:{
    ...radarUniforms,
    image:{value:rt.texture},glow:{value:blurB.texture},
    uMapBounds:{value:new T.Vector4(0,0,1,1)},
    uMapFade:{value:0},
    uChartOpacity:{value:0},
    uChartTime:shared.uTime,
    uNavy:{value:new T.Color(particlePreview?0x02030a:0x030610)},
    uBlue:{value:new T.Color(particlePreview?0x060d1c:0x070e1d)},
    uHalo:{value:new T.Color(particlePreview?0x0a1a3a:0x0c1a32)}
  },
  vertexShader:postVertex,
  fragmentShader:`
    uniform sampler2D image, glow;
    uniform vec3 uNavy, uBlue, uHalo;
    uniform vec4 uMapBounds;
    uniform vec2 uRadarCenter;
    uniform float uMapFade, uRadarPhase, uRadarStrength, uRadarSize, uAspect;
    uniform float uChartOpacity,uChartTime;
    varying vec2 vUv;
    ${radarTransition}
    #ifdef PARTICLE_STUDY
      ${particleLook}
    #endif
    #ifdef CHART_OVERLAY
      ${chartWaterLayer}
    #endif

    void main(){
      vec2 center = (vUv - vec2(0.76, 0.48)) * vec2(1.55, 1.49);
      float halo = exp(-3.1 * dot(center, center));
      vec3 background = mix(uNavy, uBlue, smoothstep(0.0, 1.0, 0.27 + 0.72 * vUv.x - 0.30 * vUv.y));
      background = mix(background, uHalo, halo * 0.61);
      vec2 mapPoint = (vUv - uMapBounds.xy) / max(uMapBounds.zw - uMapBounds.xy, vec2(0.001));
      float sides = smoothstep(0.0, 0.06, mapPoint.x) * (1.0 - smoothstep(0.94, 1.0, mapPoint.x));
      float top = 1.0 - smoothstep(0.933, 1.0, mapPoint.y);
      float bottom = step(0.0, mapPoint.y);
      float visibility = mix(1.0, sides * top * bottom, uMapFade);
      #ifdef CHART_OVERLAY
        float chartMask = sides * top * smoothstep(0.0, 0.09, mapPoint.y) * uChartOpacity;
        if (uChartOpacity > 0.001) background += chartWater(mapPoint, uChartTime) * chartMask;
      #endif
      vec2 contact = radarPoint(vUv, uRadarCenter, uAspect);
      float strength = uRadarStrength;
      float sweep = radarSweepAngle(uRadarPhase);
      float bearing = 0.0, behind = 0.0, scope = 0.0;
      if (strength > 0.0) {
        bearing = radarBearing(contact);
        behind = radarSweepAge(sweep, bearing);
        scope = 1.0 - smoothstep(uRadarSize - 0.007, uRadarSize + 0.017, length(contact));
        float exposure = radarExposure(contact, sweep, uRadarPhase, uAspect);
        #ifdef PARTICLE_STUDY
          exposure = max(exposure, 0.81 * scope * radarFreshTrace(behind, sweep));
        #endif
        visibility *= mix(1.0, exposure, strength * 0.90);
      }
      vec4 foreground = texture2D(image, vUv) * visibility;
      vec3 color = background * (1.0 - foreground.a) + foreground.rgb;
      #ifdef PARTICLE_STUDY
        color += texture2D(glow, vUv).rgb * 0.75 * visibility;
      #else
        color += texture2D(glow, vUv).rgb * 0.42 * visibility;
      #endif
      if (strength > 0.0) {
        float persistence = 0.28 + 0.72 * exp(-behind * 1.45);
        float signal = dot(foreground.rgb, vec3(0.22, 0.55, 0.23));
        float echoMix = scope * 0.92 * strength;
        #ifdef PARTICLE_STUDY
          vec3 echo = background * 0.41 + vec3(0.19, 0.56, 0.97) * signal * persistence;
          vec3 dial = radarLight(contact, sweep, uRadarSize);
          float dialInk = max(dial.g, dial.r);
          float arcBand = 0.50 + 0.50 * sin(bearing * 2.2 - sweep * 0.89);
          vec3 radarColor = particleInk(0.69, arcBand) * dialInk;
          vec2 beadCell = fract(gl_FragCoord.xy / 3.0) - 0.5;
          float bead = 1.0 - smoothstep(0.16, 0.42, length(beadCell));
          radarColor *= mix(0.34, 1.55, bead);
          float fresh = max(radarFreshTrace(behind, sweep), radarWakeWeight(behind, sweep));
          echoMix *= 1.0 - 0.58 * fresh;
        #else
          vec3 echo = background * 0.36 + vec3(0.39, 0.78, 0.079) * signal * persistence;
          vec3 radarColor = radarLight(contact, sweep, uRadarSize);
        #endif
        color = mix(color, background, 0.56 * strength);
        color = mix(color, echo, echoMix);
        color += radarColor * strength;
      }
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }
  `
});
const mapFrame=$('#mapFrame');
const mapLegend=$('#flatCycle');
const footer=$('footer');
const bearingScale=$('#bearingScale');
for(let bearing=0;bearing<360;bearing+=30) {
  const mark=document.createElement('span');
  mark.textContent=String(bearing).padStart(3,'0');
  mark.style.setProperty('--bearing',bearing+'deg');
  bearingScale.append(mark);
}
const mapCorners=[
  new T.Vector3(-mapHalfWidth,mapNorth,0),
  new T.Vector3(mapHalfWidth,mapSouth,0)
];
const mapCamera=new T.Vector3();
const mapTarget=new T.Vector3();
const globeCameraHome=new T.Vector3();
const globeTarget=new T.Vector3();
const globeFramingCamera=particlePreview?camera.clone():null;
let radarRadiusLimit=Infinity;
let mapLegendHeight,mapBottom,mapScaleY,atlasDotPitch=1;
const atlasCopy=atlasPreview&&!inventoryPreview?Array.from(document.querySelectorAll('#mapCycle .copy, #routes .copy')):[];
function fitMap() {
  const gutter=atlasPreview?clamp(innerWidth*.037,13,60):clamp(innerWidth*.013,8,22);
  mapBottom=footer.getBoundingClientRect().top-9;
  mapLegendHeight=mapLegend.offsetHeight;
  const availableHeight=Math.max(80,mapBottom-mapLegendHeight);
  document.body.style.setProperty('--map-legend-top',`${availableHeight}px`);
  let chartWidth=innerWidth-2*gutter,chartHeight=availableHeight;
  let mapCenterX=innerWidth*.5,mapCenterY=availableHeight*.5;
  if(inventoryPreview) {
    chartWidth=innerWidth*1.14;
    chartHeight=Math.min(availableHeight*0.94,chartWidth/1.80);
    mapCenterX=innerWidth*.54;
    mapCenterY=availableHeight*.51;
    document.body.style.setProperty('--inventory-bottom',`${innerHeight-mapBottom+12}px`);
  }else if(atlasPreview) {
    const besideCopy=innerWidth>=1040;
    const chartLeft=besideCopy?Math.max(...atlasCopy.map(copy=>copy.offsetLeft+copy.offsetWidth))+14:gutter;
    const chartTop=besideCopy?79:Math.max(...atlasCopy.map(copy=>copy.offsetTop+copy.offsetHeight))+15;
    const chartRoom=Math.max(80,availableHeight-chartTop-12);
    const chartAspect=2.32;
    chartWidth=Math.min(innerWidth-chartLeft-gutter,chartRoom*chartAspect);
    chartHeight=chartWidth/chartAspect;
    mapCenterX=(chartLeft+innerWidth-gutter)*.5;
    mapCenterY=chartTop+(chartRoom-chartHeight)*.45+chartHeight*.5;
  }
  const scaleToWidth=chartWidth/(2*mapHalfWidth);
  mapScaleY=chartHeight/((mapNorth-mapSouth)*scaleToWidth);
  if(atlasPreview)atlasDotPitch=(particlePreview?4.45:terminalMap||layeredChartPreview?3.12:3.85)/scaleToWidth;
  const targetX=globeRoot.position.x+(innerWidth*.5-mapCenterX)/scaleToWidth;
  const targetY=globeRoot.position.y+(mapNorth+mapSouth)*.5*mapScaleY+(mapCenterY-innerHeight*.5)/scaleToWidth;
  const focalLength=innerHeight*.5/Math.tan(camera.fov*Math.PI/360);
  mapTarget.set(targetX,targetY,globeRoot.position.z);
  mapCamera.copy(mapTarget).z+=focalLength/scaleToWidth;
}
function fitGlobeFraming() {
  const mobile=innerWidth<650,tablet=innerWidth<1100;
  globeCameraHome.set(34,25,mobile?202:tablet?170:124);
  globeTarget.set(mobile?3:tablet?-8:-16,mobile?16:4,-6);
  if(!globeFramingCamera)return;
  globeFramingCamera.aspect=camera.aspect;
  globeFramingCamera.updateProjectionMatrix();
  globeFramingCamera.position.copy(globeCameraHome);
  globeFramingCamera.lookAt(globeTarget);
  globeFramingCamera.updateMatrixWorld();
  const projected=globeRoot.position.clone().applyAxisAngle(world.up,worldHeading).project(globeFramingCamera);
  globeScreenCenter.set(projected.x*.5+.5,projected.y*.5+.5);
  const x=globeScreenCenter.x*innerWidth,y=(1-globeScreenCenter.y)*innerHeight;
  bearingScale.style.setProperty('--bearing-x',`${x}px`);
  bearingScale.style.setProperty('--bearing-y',`${y}px`);
  const edge=Math.min(x,document.documentElement.clientWidth-x,y,innerHeight-y);
  radarRadiusLimit=Math.max(.04,(edge-28)/innerHeight);
}
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();composite.uniforms.uAspect.value=camera.aspect;const d=renderer.getPixelRatio();pixelScale.value=innerHeight*d*.5;rt.setSize(innerWidth*d,innerHeight*d);blurA.setSize(Math.max(1,innerWidth*d/2),Math.max(1,innerHeight*d/2));blurB.setSize(Math.max(1,innerWidth*d/2),Math.max(1,innerHeight*d/2));fitMap();fitGlobeFraming();}
function render(){renderer.setRenderTarget(rt);renderer.render(scene,camera);tradeMorph?.draw(renderer);quad.material=blur;blur.uniforms.image.value=rt.texture;blur.uniforms.direction.value.set(1/blurA.width,0);blur.uniforms.threshold.value=.12;renderer.setRenderTarget(blurA);renderer.render(postScene,postCamera);blur.uniforms.image.value=blurA.texture;blur.uniforms.direction.value.set(0,1/blurA.height);blur.uniforms.threshold.value=0;renderer.setRenderTarget(blurB);renderer.render(postScene,postCamera);quad.material=composite;renderer.setRenderTarget(null);renderer.render(postScene,postCamera);inventory?.draw(renderer);}
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp;function smoothstep(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}function stageHeight(){return $('section').offsetHeight;}
const lastScrollStage=inventoryPreview?4:5;
function progressAt(scrollStage){return clamp(inventoryPreview&&scrollStage>3?3+(scrollStage-3)*2:scrollStage,0,5);}
function scrollStageFor(scene){return inventoryPreview&&scene>3?3+(scene-3)/2:scene;}
addEventListener('resize',resize);resize();
document.fonts.ready.then(fitMap);
const initialAnchor=inventoryPreview&&location.hash==='#routes'?'#mapCycle':location.hash;
const linkedScene=Array.from(document.querySelectorAll('main > section'))
  .find(section=>'#'+section.id===initialAnchor);
if(linkedScene) {
  history.scrollRestoration='manual';
  addEventListener('load',()=>requestAnimationFrame(()=>{
    scrollTo({top:linkedScene.offsetTop,behavior:'instant'});
    progress=progressAt(scrollY/stageHeight());
  }),{once:true});
}
function syncAuto() {
 const button=$('#auto');
 button.setAttribute('aria-label',auto?'Stop autoplay':'Autoplay');
 if(particlePreview)button.textContent=auto?'□':'▷';
 else button.innerHTML=auto?'Stop <span>Ⅱ</span>':'Autoplay <span>▷</span>';
}
function stopAuto(){auto=false;syncAuto();}
function goto(i){
 stopAuto();
 angleTarget=0;
 pitchTarget=0;
 if(i===2)loadingElapsed=reduced&&paused?loadingBeats.fillEnd:0;
 scrollTo({top:scrollStageFor(i)*stageHeight(),behavior:reduced?'instant':'smooth'});
}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>goto(+b.dataset.go));
if(particlePreview) {
 const headings=Array.from(document.querySelectorAll('main > section :is(h1,h2)'));
 for(const button of document.querySelectorAll('nav [data-go]')) {
  button.setAttribute('aria-label',headings[Number(button.dataset.go)].textContent.replace(/\s+/g,' ').trim());
  button.textContent='';
 }
 for(const [id,symbol,label] of [['contour','◎','Outline'],['xray','◈','X-ray'],['reset','↺','Reset view']]) {
  const button=$('#'+id);
  button.textContent=symbol;
  button.setAttribute('aria-label',label);
  button.removeAttribute('title');
 }
}
function syncPause() {
 const button=$('#pause');
 if(particlePreview)button.textContent=paused?'▷':'Ⅱ';
 else button.innerHTML=paused?'Resume <b>▷</b>':'Pause <b>Ⅱ</b>';
 button.setAttribute('aria-label',paused?'Resume animation':'Pause animation');
}
syncPause();syncAuto();
$('#pause').onclick=()=>{paused=!paused;syncPause();};$('#auto').onclick=()=>{auto=!auto;if(auto){paused=false;syncPause();autopos=scrollY>=stageHeight()*(lastScrollStage-.02)?0:scrollY;}syncAuto();};
$('#reset').onclick=()=>{angleTarget=0;pitchTarget=0;};
function syncVesselView() {
 if(!vesselSurface)return;
 vesselLoadingGrid.visible=shared.uLoadingGrid.value>.002;
 const material=vesselSurface.material;
 const transparent=xray||particlePreview;
 if(material.transparent!==transparent||material.depthWrite===xray) {
   material.transparent=transparent;
   material.depthWrite=!xray;
   material.needsUpdate=true;
 }
 vesselEdges.material.depthTest=!xray;
}
function setXray(v) {
 xray=v;
 shared.uXray.value=+v;
 syncVesselView();
 portSurface.material.transparent=v||particlePreview;
 portSurface.material.depthWrite=!v;
 portSurface.material.needsUpdate=true;
 portEdges.material.depthTest=!v;
 $('#contour').classList.toggle('selected',!v);
 $('#xray').classList.toggle('selected',v);
 $('#contour').setAttribute('aria-pressed',String(!v));
 $('#xray').setAttribute('aria-pressed',String(v));
}
$('#contour').onclick=()=>setXray(false);$('#xray').onclick=()=>setXray(true);
canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);stopAuto();});canvas.addEventListener('pointermove',e=>{if(!drag)return;angleTarget+=(e.clientX-lastX)*.004;pitchTarget=clamp(pitchTarget+(e.clientY-lastY)*.09,-14,18);lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);addEventListener('wheel',stopAuto,{passive:true});addEventListener('touchstart',stopAuto,{passive:true});addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key))stopAuto();});
const names=['ENERGY FLOWS','VESSEL IN MOTION','MARINE LOGISTICS','FULL TRADE CYCLE','MARITIME ROUTES','GLOBAL REACH'],subs=['ENERGY IN MOTION','VESSEL AT SEA','TERMINAL · OIL LOADING','SUPPLY CHAIN','ILLUSTRATIVE TRADE LANES','AFRICA · ASIA · LATIN AMERICA'];
const loadingStartProgress=1.76,loadingEndProgress=2.29;
const radarStartProgress=particlePreview?2.30:2.10,radarEndProgress=3.0;
const radarSpeed=(radarEndProgress-radarStartProgress)*0.74;
const sphereStart=3.31,sphereEnd=4.55;
function animate(now){requestAnimationFrame(animate);const dt=clamp((now-last)/1000,0,.05);last=now;if(!paused)time+=dt;
 const height=stageHeight();
 if(auto&&ready&&!paused) {
   const terminalPosition=height*2;
   const end=height*lastScrollStage;
   const holdForLoading=!particlePreview&&autopos<=terminalPosition&&loadingElapsed<loadingBeats.end;
   const autoStage=progressAt(autopos/height);
   const crossing=smoothstep(radarStartProgress,radarStartProgress+.14,autoStage)*(1-smoothstep(2.86,radarEndProgress,autoStage));
   autopos=Math.min(autopos+dt*height*lerp(.052,.57,crossing),holdForLoading?terminalPosition:end);
   scrollTo({top:autopos,behavior:'instant'});
   if(autopos>=end)stopAuto();
 }
 const target=progressAt(scrollY/height);
 const next=lerp(progress,target,reduced?1:1-Math.exp(-dt*6));
 const crossingLoading=particlePreview&&!reduced&&progress<loadingEndProgress&&next>Math.max(progress,loadingStartProgress);
 const crossing=!reduced&&progress<radarEndProgress&&next>Math.max(progress,radarStartProgress);
 const crossingSphere=particlePreview&&!reduced&&progress<sphereEnd&&next>Math.max(progress,sphereStart);
 // Give each transition time to play even when navigation jumps ahead.
 if(crossingLoading)progress=Math.min(next,Math.max(progress,loadingStartProgress)+dt*.24);
 else if(crossing)progress=Math.min(next,Math.max(progress,radarStartProgress)+dt*radarSpeed);
 else if(crossingSphere)progress=Math.min(next,Math.max(progress,sphereStart)+dt*.89);
 else progress=next;
 angle=lerp(angle,angleTarget,.065);pitch=lerp(pitch,pitchTarget,.065);
 const reveal=smoothstep(.15,.93,progress),cycleIn=0,terminal=smoothstep(1.12,1.98,progress),mapIn=smoothstep(particlePreview?2.32:2.12,2.98,progress),cycle=0;
 const global=particlePreview?smoothstep(3.03,sphereStart,progress):smoothstep(4.12,4.97,progress);
 const toGlobe=smoothstep(sphereStart,sphereEnd,progress);
 const tradeEntrance=smoothstep(2.84,3.0,progress);
 const globeReveal=particlePreview?smoothstep(4.40,4.87,progress):1;
 const routesIn=particlePreview?smoothstep(4.58,4.96,progress):inventoryPreview?smoothstep(4.35,4.94,progress):smoothstep(3.12,3.95,progress);
 const inventoryAlpha=inventoryPreview?smoothstep(2.84,3.0,progress)*(1-smoothstep(3.78,4.35,progress)):0;
 inventory?.update(inventoryAlpha,time);
 tradeMorph?.update(tradeEntrance*(1-smoothstep(4.48,4.90,progress)),tradeEntrance*(1-smoothstep(3.34,4.03,progress)),toGlobe,time);
 if(terminalCopy) {
  const fade=smoothstep(2.21,2.38,progress);
  const pin=smoothstep(1.78,1.96,progress)*(1-fade);
  terminalCopy.style.translate=`0 ${(scrollY-2*height)*pin}px`;
  terminalCopy.style.opacity=String(1-fade);
 }
 if(globeCopy) {
  globeCopy.style.opacity=String(smoothstep(4.28,4.79,progress));
  globeCopy.style.translate=`0 ${Math.min(0,scrollY-lastScrollStage*height)}px`;
 }
 const seaShip=1-smoothstep(2.65,2.99,progress);
 shared.uTime.value=time;
 if(particleFlow) {
  const amount=1-smoothstep(.26,.93,progress);
  const compact=innerWidth<650;
  particleFlow.opacity.value=amount;
  particleFlow.points.visible=amount>.004;
  particleFlow.points.position.set(compact?4:14,compact?4:10,compact?-8:-10);
  const framing=compact?.65:lerp(.65,.79,smoothstep(1.02,1.57,innerWidth/innerHeight));
  particleFlow.points.scale.setScalar(framing*lerp(.69,1,amount));
 }
 shared.uReveal.value=seaShip;
 portShared.uReveal.value=terminal*(1-mapIn);
 portShared.uScan.value=lerp(-36,42,terminal);

 // Keep the approach readable when a navigation link jumps straight to a scene.
 const desiredSailing=Math.min(2,progress);
 if(reduced||progress>2.30)sailingProgress=desiredSailing;
 else if(ready&&!paused) {
   const distance=desiredSailing-sailingProgress;
   sailingProgress+=clamp(distance*(1-Math.exp(-dt*9)),-1.5*dt,.72*dt);
 }
 const shipProgress=particlePreview?lerp(sailingProgress,desiredSailing,smoothstep(1.37,1.88,progress)):sailingProgress;
 const course=clamp((shipProgress-.05)/1.88,0,1);
 const mooring=smoothstep(1.04,1.94,shipProgress);
 const departure=smoothstep(particlePreview?2.29:2.12,2.88,progress);
 vessel.visible=progress>.055&&seaShip>.001;
 vessel.position.set(
   -126*Math.pow(1-course,3.1)+departure*32,
   -3.2+Math.sin(time*.8)*lerp(.16,.035,mooring),
   berthZ
 );
 vessel.rotation.set(Math.sin(time*.44)*lerp(.004,.001,mooring),0,Math.sin(time*.67)*lerp(.006,.001,mooring));
 vessel.scale.setScalar(1-departure*.55);
 port.visible=terminal>.001&&mapIn<.999;port.position.y=-(1-terminal)*2;
 const radarFade=1-smoothstep(.27,.90,terminal);
 radar.visible=progress>.15&&cycle<.5&&mapIn<.8&&radarFade>.005;
 if(radar.visible)for(const [material,opacity] of radarLines)material.opacity=opacity*radarFade*(particlePreview?.61:1);
 sweep.rotation.y=-time*.27;radar.rotation.y=.1;
 water.uAmplitude.value=lerp(1.9,.49,reveal)*(1-terminal*.64);
 water.uOpacity.value=seaShip*(1-mapIn);
 water.uPointStrength.value=lerp(.92,.36,reveal);
 if(particlePreview)water.uOpacity.value*=lerp(.24,.85,smoothstep(.20,.86,progress));
 const wake=smoothstep(.19,.62,shipProgress)*(1-smoothstep(1.36,1.92,shipProgress));
 water.uWake.value.set(vessel.position.x-24,vessel.position.z,0,wake);
 flow.visible=water.uOpacity.value>.005;
 const dock=particlePreview?smoothstep(1.74,1.84,progress)*(1-smoothstep(2.23,2.29,progress))
   :smoothstep(1.945,1.985,sailingProgress)*smoothstep(1.78,1.91,progress)*(1-smoothstep(2.10,2.25,progress));
 if(particlePreview) {
  loadingElapsed=loadingBeats.end*clamp((progress-loadingStartProgress)/(loadingEndProgress-loadingStartProgress),0,1);
 }else if(dock<.002)loadingElapsed=reduced&&paused?loadingBeats.fillEnd:0;
 else if(dock>.80&&!paused&&ready)loadingElapsed=Math.min(loadingBeats.end,loadingElapsed+dt);
 const opening=dock*smoothstep(loadingBeats.pulseArrival-.08,loadingBeats.fillStart,loadingElapsed)
   *(1-smoothstep(loadingBeats.holdEnd,loadingBeats.end,loadingElapsed));
 const loadingApproach=reduced?0:dock*smoothstep(.03,loadingBeats.fillStart,loadingElapsed);
 shared.uLoadingGrid.value=opening;
 syncVesselView();
 const percent=updateTerminalLoading(loadingElapsed,opening,dock,time);
 loadMeter.style.opacity=String(dock);
 if(percent!==lastFill){
  lastFill=percent;
  loadLabel.textContent=percent+'%';
  loadLevel.style.transform='scaleX('+percent*.01+')';
 }
 cycleGroup.visible=cycle>.001;cycleUniforms.uReveal.value=cycle;cycleGroup.scale.setScalar(lerp(.65,1,cycleIn));cycleGroup.position.y=1;cycleGroup.rotation.y=-.17;
 if(!paused&&cycleGroup.visible&&time>manualStepUntil){const next=Math.floor(time*.23)%4;if(next!==activeStep)selectStep(next);}
 for(let i=0;i<4;i++){selectionRings[i].material.opacity=(i===activeStep?.72:.12)*cycle;if(cycleMat[i])cycleMat[i].uniforms.uOpacity.value=i===activeStep?.9:.4;}chainLine.material.opacity=cycle*.7;chainPulse.position.set(lerp(-35,37,(time*.09)%1),-1,9);chainPulse.visible=cycle>.5;
 globeRoot.visible=particlePreview?mapIn*(1-tradeEntrance)>.001||globeReveal>.001:mapIn>.001;
 const mapEntranceScale=lerp(.7,1,mapIn);
 fold=particlePreview?(progress>=3?1:0):global;
 const sheetScaleY=lerp(1,mapScaleY,mapIn*(1-fold));
 globeRoot.scale.set(mapEntranceScale,mapEntranceScale*sheetScaleY,mapEntranceScale);
 foldUniform.value=fold;globeRotation=lerp(globeRotation,globeRotationTarget,.035);earth.rotation.y=(globeRotation+angle*.7+Math.sin(time*.04)*.025)*fold;earth.rotation.x=0;
 for(const child of earth.children){if(child===earthSurface||child.isLine||child.isLineSegments||child.isPoints)registerFold(child);}
 const engravingWeight=engravedLand?1-smoothstep(.02,.20,fold):0;
 if(engravedLand) {
  engravedLand.opacity.value=mapIn*engravingWeight;
  engravedLand.mesh.visible=engravedLand.opacity.value>.001;
 }
 const radarWeight=radarMap?1-smoothstep(.05,.43,fold):0;
 const patternWeight=(1-radarWeight)*globeReveal;
 if(atlasPreview) {
  const oceanOpacity=smoothstep(.16,.73,fold)*globeReveal;
  earthSurface.visible=oceanOpacity>.001;
  earthSurface.material.opacity=oceanOpacity;
 }
 for(const mat of earthMaterials) {
  mat.opacity=mat.userData.base*mapIn*globeReveal;
  if(mat.userData.maritime)mat.opacity*=routesIn*(atlasPreview?1-.18*radarWeight:1);
  if(mat.userData.landPattern)mat.opacity*=limeDotsPreview?0:(1-engravingWeight)*(1-radarWeight);
  if(mat.userData.flatBackdrop)mat.opacity*=1-radarWeight;
 }
 if(staticLandDots)staticLandDots.value=mapIn*lerp(.84,.62,fold)*patternWeight;
 if(landEcho) {
  const amount=mapIn*smoothstep(.48,.93,fold)*globeReveal;
  landEcho.material.uniforms.uOpacity.value=amount;
  landEcho.visible=amount>.004;
 }
 if(radarMap) {
  const chartReveal=particlePreview?1-tradeEntrance:radarWeight*(1-.72*inventoryAlpha);
  radarMap.uniforms.uOpacity.value=smoothstep(particlePreview?2.33:2.14,2.80,progress)*chartReveal;
  radarMap.uniforms.uPatterns.value=particlePreview?smoothstep(2.40,2.88,progress):smoothstep(2.48,2.98,progress);
  radarMap.uniforms.uRoutes.value=routesIn;
  radarMap.uniforms.uScaleY.value=sheetScaleY;
  radarMap.uniforms.uDotPitch.value=atlasDotPitch;
  radarMap.mesh.visible=radarMap.uniforms.uOpacity.value>.001;
 }
 if(oceanDots)oceanDots.value=mapIn*lerp(.84,.98,fold)*patternWeight;
 for(const mark of passageMarks){
  mark.position.copy(foldPoint(mark.userData.geo,fold));
  mark.visible=routesIn>.2;
 }
 const showGlobePins=particlePreview?routesIn>.22:global>.65;
 for(let i=0;i<connections.length;i++){const c=connections[i];c.arc.material.opacity=0;c.pin.visible=showGlobePins;c.runner.visible=false;const t=(time*.12+i*.117)%1,index=t*100,lo=Math.floor(index),v=c.points[lo].clone().lerp(c.points[Math.min(lo+1,100)],index-lo);c.runner.position.copy(foldPoint(v,fold));c.pin.position.copy(foldPoint(globePoint(c.market.lat,c.market.lon,R+.2),fold));}
 hub.position.copy(foldPoint(dubai,fold));hubRings.position.copy(hub.position);hubRings.quaternion.identity().slerp(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),dubai.clone().normalize()),fold);
 hub.visible=hubRings.visible=particlePreview?showGlobePins:!inventoryPreview||fold>.66;
 for(const [index,ship] of maritime.entries()){
  const sampleIndex=((time*.023+ship.phase)%1)*160;
  const start=Math.floor(sampleIndex);
  const position=ship.samples[start].clone().lerp(ship.samples[start+1],sampleIndex-start);
  ship.dot.position.copy(foldPoint(position,fold));
  ship.mini.visible=false;
  if(!radarChartPreview&&routesIn>.25&&fold<.25&&index%4===0) {
   const direction=foldPoint(ship.samples[Math.min(start+2,160)],fold).sub(ship.dot.position);
   ship.mini.position.copy(ship.dot.position);
   ship.mini.rotation.z=Math.atan2(direction.y,direction.x);
   ship.mini.scale.setScalar(.6);
   ship.mini.visible=Math.abs(direction.x)<8;
  }
  ship.dot.visible=routesIn>.25&&!ship.mini.visible;
 }
 const mobile=innerWidth<650,tablet=innerWidth<1100;
 const seaFollow=smoothstep(.70,.99,sailingProgress)*(1-smoothstep(1.06,1.72,progress));
 const followX=-16*seaFollow,followZ=3.2*seaFollow;
 const cameraSwing=smoothstep(1.08,1.67,progress);
 const az=lerp(.92,1.12,cameraSwing)+angle+Math.sin(time*.045)*.018*(1-mooring);
 const radius=(mobile?105:tablet?lerp(91,128,terminal):lerp(78,112,terminal))*(1-(particlePreview?.105:.052)*loadingApproach);
 camera.position.set(Math.cos(az)*radius+followX,lerp(34,61,terminal)+pitch-(particlePreview?7.0:4.2)*loadingApproach,Math.sin(az)*radius+followZ);
 const baseTarget=new T.Vector3((tablet?0:-12)+followX-1.4*loadingApproach,mobile?19:tablet?12:4,-terminal*6+followZ);
 const cycleCam=new T.Vector3(Math.cos(.95+angle)*(mobile?205:tablet?185:146),64+pitch,Math.sin(.95+angle)*(mobile?205:tablet?185:146));camera.position.lerp(cycleCam,cycle);
 camera.position.lerp(mapCamera,mapIn).lerp(globeCameraHome,global);
 camera.position.y+=pitch*global;
 const viewTarget=baseTarget.lerp(new T.Vector3(mobile?0:tablet?0:-13,mobile?27:tablet?25:3,0),cycle).lerp(mapTarget,mapIn).lerp(globeTarget,global);
 camera.lookAt(viewTarget);
 world.rotation.y=worldHeading*(1-mapIn*(1-fold));
 camera.updateMatrixWorld();world.updateMatrixWorld(true);
 tradeMorph?.alignGlobe(camera,earth,R);
 if(particleFlow?.points.visible) {
   const center=particleFlow.points.position;
   world.localToWorld(center).project(camera);
   center.x=globeScreenCenter.x*2-1;
   center.y=globeScreenCenter.y*2-1;
   world.worldToLocal(center.unproject(camera));
 }
 const panelAlpha=smoothstep(2.45,2.98,progress)*(particlePreview?1-tradeEntrance:1-smoothstep(4.05,4.3,progress));
 composite.uniforms.uMapFade.value=panelAlpha;
 const chartOpacity=layeredChartPreview&&!particlePreview?panelAlpha*smoothstep(2.67,3.0,progress)*(1-.65*inventoryAlpha):0;
 composite.uniforms.uChartOpacity.value=chartOpacity;
 const radarPhase=reduced?1:clamp((progress-radarStartProgress)/(radarEndProgress-radarStartProgress),0,1);
 const radarStrength=smoothstep(.02,.25,radarPhase)*(1-smoothstep(.73,1,radarPhase));
 composite.uniforms.uRadarPhase.value=radarPhase;
 composite.uniforms.uRadarStrength.value=radarStrength;
 bearingScale.style.opacity=String(radarStrength);
 if(radarStrength>0) {
   const radarSize=Math.min(lerp(.27,.37,smoothstep(0,.7,radarPhase))*Math.min(1,camera.aspect/1.03),radarRadiusLimit);
   composite.uniforms.uRadarSize.value=radarSize;
   bearingScale.style.setProperty('--bearing-radius',`${radarSize*innerHeight+11}px`);
 }
 if(panelAlpha>0) {
  const [upper,lower]=mapCorners.map(v=>globeRoot.localToWorld(v.clone()).project(camera));
  const left=clamp((upper.x*.5+.5)*innerWidth,8,innerWidth-120);
  const right=clamp((lower.x*.5+.5)*innerWidth,left+120,innerWidth-8);
  composite.uniforms.uMapBounds.value.set(upper.x*.5+.5,lower.y*.5+.5,lower.x*.5+.5,upper.y*.5+.5);
  const top=Math.max(0,(-upper.y*.5+.5)*innerHeight);
  const bottom=atlasPreview?mapBottom:Math.min(mapBottom,(-lower.y*.5+.5)*innerHeight+mapLegendHeight);
  const legendInset=atlasPreview?clamp(innerWidth*.05,12,90):left;
  mapFrame.style.left=legendInset+'px';
  mapFrame.style.width=(atlasPreview?innerWidth-legendInset*2:right-left)+'px';
  mapFrame.style.top=top+'px';
  mapFrame.style.height=Math.max(mapLegendHeight,bottom-top)+'px';
 }
 mapFrame.style.opacity=String(panelAlpha);
 mapLegend.style.pointerEvents=panelAlpha>.7?'auto':'none';
 document.body.classList.toggle('anim-paused',paused);
 document.body.classList.toggle('shader-map-scene',progress>2.65&&progress<4.21);
 const blendToLegend=smoothstep(2.31,2.98,progress);
 if(!inventoryPreview&&blendToLegend>0&&vessel.visible) {
   const slot=$('#shipSlot').getBoundingClientRect();
   const depth=new T.Vector3().project(camera).z;
   const position=new T.Vector3((slot.left+slot.width*.5)/innerWidth*2-1,-(slot.top-44)/innerHeight*2+1,depth).unproject(camera);
   world.worldToLocal(position);
   vessel.position.lerp(position,blendToLegend);
   vessel.rotation.set(lerp(vessel.rotation.x,0,blendToLegend),0,lerp(vessel.rotation.z,0,blendToLegend));
   const desiredScale=(slot.width*.72)*(2*Math.tan(camera.fov*Math.PI/360)*camera.position.distanceTo(position)/innerHeight)/52;
   vessel.scale.setScalar(lerp(vessel.scale.x,desiredScale,blendToLegend));
 }
 legendShip.style.opacity=String(smoothstep(2.68,2.98,progress));
 earth.updateWorldMatrix(true,false);hub.getWorldPosition(dubaiWorld);projectedHub.copy(dubaiWorld).project(camera);const label=$('#dubaiLabel'),front=dubaiWorld.clone().sub(globeRoot.getWorldPosition(new T.Vector3())).dot(camera.position.clone().sub(globeRoot.getWorldPosition(new T.Vector3())))>0;label.style.opacity=String(mapIn>.85&&front&&hub.visible?1:0);label.style.left=clamp((projectedHub.x*.5+.5)*innerWidth+15,20,innerWidth-140)+'px';label.style.top=((-projectedHub.y*.5+.5)*innerHeight-20)+'px';
 const nearest=Math.round(progress),n=inventoryPreview&&nearest===4?3:nearest;
 if(n!==stage){stage=n;document.querySelectorAll('nav button').forEach((b,i)=>{b.classList.toggle('active',i===n);b.setAttribute('aria-current',i===n?'step':'false');});$('#objectName').textContent=names[n];$('#objectSub').textContent=subs[n];$('#stageTitle').textContent=names[n];}$('#bar').style.width=(progress*20)+'%';const toolsOpacity=smoothstep(.3,.8,progress)*(1-terminal);$('.scene-tools').style.opacity=String(toolsOpacity);$('.scene-tools').style.pointerEvents=toolsOpacity>.5?'auto':'none';render();}
requestAnimationFrame(animate);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();$('#error').hidden=false;});
