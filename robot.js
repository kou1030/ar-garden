'use strict';
// Original procedural robot geometry. All coordinates are in local model space.
window.RoboLab = (() => {
 const T=AFRAME.THREE;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const mat=(color,metalness=.25)=>new T.MeshStandardMaterial({color,metalness,roughness:.45});
 function part(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
 function orb(parent,material,r,x=0,y=0,z=0){return part(parent,new T.SphereGeometry(r,16,12),material,x,y,z);}
 function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 function ellipsoid(parent, material, radii, x=0, y=0, z=0) {
  const mesh = orb(parent, material, 1, x, y, z);
  mesh.scale.set(...radii);
  return mesh;
 }
 function armor(parent, material, outline, depth, x=0, y=0, z=0, bevel=.025) {
  const shape = new T.Shape();
  outline.forEach(([px, py], index) => index ? shape.lineTo(px, py) : shape.moveTo(px, py));
  shape.closePath();
  const geometry = new T.ExtrudeGeometry(shape, {
   depth, bevelEnabled:true, bevelSegments:2, steps:1,
   bevelSize:bevel, bevelThickness:bevel
  });
  geometry.translate(0,0,-depth/2);
  return part(parent,geometry,material,x,y,z);
 }
 function housing(parent, material, w,h,d,x,y,z) {
  const a=w/2,b=h/2,c=Math.min(a,b)*.32;
  return armor(parent,material,[[-a+c,-b],[a-c,-b],[a,-b+c],[a,b-c],[a-c,b],[-a+c,b],[-a,b-c],[-a,-b+c]],d,x,y,z,c*.48);
 }
 function cylinder(parent, material, radius, length, x,y,z, axis='y') {
  const mesh=part(parent,new T.CylinderGeometry(radius,radius,length,20),material,x,y,z);
  if(axis==='x')mesh.rotation.z=Math.PI/2;
  if(axis==='z')mesh.rotation.x=Math.PI/2;
  return mesh;
 }
 function buildHelmet() {
  const root=new T.Group();
  const shell=mat(0xbdbdbd,.32), alloy=mat(0x6c6c6c,.32), black=mat(0x121212,.12);
  const bone=mat(0xcacaca,.2), recess=mat(0x040404,0);
  const lamp=new T.MeshStandardMaterial({color:0xdedede,emissive:0xbfbfbf,emissiveIntensity:.45});
  const skull=group(root);
  // A shaped cranium and cheekbones sit behind the moving armor.
  ellipsoid(skull,black,[.53,.59,.24],0,.015,-.17);
  ellipsoid(skull,bone,[.415,.41,.16],0,.163,-.012);
  housing(skull,alloy,.39,.35,.16,0,-.25,-.025);
  ellipsoid(skull,bone,[.13,.15,.10],0,-.06,.102);
  armor(skull,recess,[[0,.095],[-.062,-.075],[.062,-.075]],.021,0,-.054,.225,.008);
  for(const side of [-1,1]) {
   ellipsoid(skull,bone,[.151,.105,.11],side*.267,-.073,.067);
   const socket=ellipsoid(skull,recess,[.14,.106,.046],side*.185,.174,.153);
   socket.rotation.z=side*-.16;
   ellipsoid(skull,lamp,[.035,.035,.017],side*.185,.172,.192);
   const brow=ellipsoid(skull,bone,[.17,.052,.065],side*.18,.271,.125);
   brow.rotation.z=side*-.11;
   cylinder(skull,alloy,.103,.12,side*.39,-.13,.035,'x');
   cylinder(skull,black,.062,.036,side*.462,-.13,.035,'x');
   const strut=housing(skull,alloy,.044,.26,.073,side*.298,-.244,.086);
   strut.rotation.z=side*-.38;
  }
  housing(skull,recess,.325,.115,.04,0,-.225,.131);
  const jaw=group(skull,0,-.26,.05);
  housing(jaw,bone,.37,.115,.14,0,-.096,0);
  for(let i=0;i<8;i++) {
   const x=(i-3.5)*.043, curve=Math.abs(x)*.15;
   housing(skull,bone,.032,.061,.055,x,-.18-curve,.177-curve);
   housing(jaw,bone,.032,.048,.053,x,-.033+curve,.117-curve);
  }
  housing(root,alloy,.55,.095,.17,0,.515,-.045);
  const doors=[];
  for(const side of [-1,1]){
   cylinder(root,shell,.133,.105,side*.495,.123,-.012,'x');
   cylinder(root,black,.073,.025,side*.558,.123,-.012,'x');
   const hinge=group(root,side*.47,0,.24);
   const contour=[[0,.40],[-.11,.51],[-.40,.54],[-.464,.43],[-.464,-.455],[-.28,-.48],[-.09,-.345],[0,-.045]];
   const panel=contour.map(([x,y])=>[side*x,y]);
   armor(hinge,shell,panel,.103,0,0,0,.019);
   const inlay=[[-.063,.186],[-.126,.269],[-.436,.233],[-.436,.076],[-.136,.092]];
   armor(hinge,black,inlay.map(([x,y])=>[side*x,y]),.014,0,0,.064,.014);
   const slit=housing(hinge,lamp,.224,.025,.01,-side*.277,.158,.087);
   slit.rotation.z=side*.085;
   const cheek=armor(hinge,alloy,[[-.13,-.13],[-.37,-.23],[-.40,-.42],[-.23,-.39]].map(([x,y])=>[side*x,y]),.027,0,0,.063,.01);
   cheek.rotation.y=side*.035;
   for(let i=0;i<3;i++) housing(hinge,black,.098,.013,.014,-side*(.20+i*.031),-.222-i*.048,.091);
   cylinder(hinge,black,.019,.014,-side*.11,.344,.068,'z');
   doors.push({hinge,side});
  }
  let opened=0;
  return {root, update(_time,dt,target) {
   opened+=(target-opened)*(1-Math.exp(-dt*10));
   for(const {hinge,side} of doors) {
    hinge.rotation.y=side*opened*1.72;
    hinge.position.x=side*(.47+.06*opened);
   }
   jaw.position.y=-.26-.035*opened;
  }};
 }
 function buildRobot(){
  const root=new T.Group(), body=group(root);
  const shell=mat(0xc4c4c4,.27), dark=mat(0x202020,.16), steel=mat(0x676767,.36);
  const glow=new T.MeshStandardMaterial({color:0xffffff,emissive:0xd2d2d2,emissiveIntensity:.4});
  const head=group(body,0,1.24,0);
  ellipsoid(head,dark,[.325,.255,.265]);
  housing(head,shell,.55,.35,.218,0,.036,.126);
  housing(head,dark,.459,.145,.035,0,.048,.255);
  for(const side of [-1,1]){
   housing(head,glow,.087,.024,.024,side*.108,.055,.286);
   cylinder(head,steel,.109,.111,side*.306,.031,.002,'x');
   cylinder(head,dark,.055,.039,side*.376,.031,.002,'x');
  }
  housing(head,shell,.43,.12,.205,0,-.137,.102);
  housing(head,dark,.22,.018,.018,0,-.127,.228);
  cylinder(body,steel,.097,.18,0,.977,0);
  housing(body,dark,.48,.39,.40,0,.722,0);
  housing(body,shell,.54,.31,.235,0,.755,.146);
  housing(body,steel,.37,.31,.19,0,.713,-.225);
  cylinder(body,dark,.093,.04,0,.769,.293,'z');
  cylinder(body,glow,.054,.041,0,.769,.318,'z');
  housing(body,steel,.35,.16,.34,0,.469,0);
  const arms=[],legs=[];
  for(const side of [-1,1]){
   const arm=group(body,side*.385,.852,0);
   ellipsoid(arm,steel,[.145,.13,.146]);
   housing(arm,shell,.235,.157,.237,side*.022,.006,.009);
   housing(arm,dark,.133,.237,.183,0,-.146,0);
   ellipsoid(arm,steel,[.107,.085,.095],0,-.249,0);
   housing(arm,shell,.166,.193,.215,0,-.342,.01);
   ellipsoid(arm,dark,[.09,.075,.089],0,-.463,.024);
   arms.push(arm);
   const leg=group(body,side*.147,.44,0);
   housing(leg,steel,.163,.23,.205,0,-.096,0);
   ellipsoid(leg,dark,[.097,.078,.092],0,-.205,.01);
   housing(leg,shell,.172,.17,.213,0,-.281,.03);
   housing(leg,dark,.203,.08,.318,0,-.394,.069);
   housing(leg,shell,.185,.077,.249,0,-.344,.108);
   legs.push(leg);
  }
  root.rotation.y=-.43;
  return {root,update(t,{moving=false,jump=0}={}) {
   const stride=moving?Math.sin(t*11):0;
   body.position.y=jump+(moving?Math.abs(stride)*.04:Math.sin(t*2)*.008);
   legs[0].rotation.x=stride*.37;
   legs[1].rotation.x=-stride*.37;
   arms[0].rotation.x=-stride*.30;
   arms[1].rotation.x=stride*.30;
  }};
 }
 function mouthAmount(result){
  if(!result)return 0;
  const jaw=result.blendshapes?.categories?.find(c=>c.categoryName==='jawOpen')?.score;
  let raw=jaw;
  if(!Number.isFinite(raw)){
   const p=result.metricLandmarks;if(!p?.[14]||!p[13]||!p[61]||!p[291])return 0;
   const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));const width=dist(p[61],p[291]);if(width<1e-6)return 0;
   raw=dist(p[13],p[14])/width;
  }
  return clamp((raw-.055)*3.36,0,1);
 }
 function el(tag,attrs,parent){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
 function scene(){const s=document.createElement('a-scene');s.setAttribute('embedded','');s.setAttribute('xr-mode-ui','enabled: false');s.setAttribute('device-orientation-permission-ui','enabled: false');s.setAttribute('renderer','alpha: true; antialias: true; colorManagement: true');return s;}
 function lights(s){
  el('a-entity',{light:'type: hemisphere; color: #ffffff; groundColor: #555555; intensity: 0.85'},s);
  el('a-entity',{light:'type: directional; color: #ffffff; intensity: 1.55',position:'-3 5 4'},s);
  el('a-entity',{light:'type: directional; color: #ffffff; intensity: 0.9',position:'2 2 -4'},s);
 }
 function load(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error('ライブラリを読み込めません。通信を確認してください。'));document.head.appendChild(s);});}
 function stop(){document.querySelectorAll('video').forEach(v=>v.srcObject?.getTracks().forEach(t=>t.stop()));}
 addEventListener('pagehide',stop);document.querySelectorAll('[data-exit]').forEach(a=>a.addEventListener('click',stop));
 return {T,clamp,buildRobot,buildHelmet,mouthAmount,el,scene,lights,load,stop};
})();
