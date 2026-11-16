'use strict';
// Original procedural robot geometry. All coordinates are in local model space.
window.RoboLab = (() => {
 const T=AFRAME.THREE, colors={mint:0x8fffe3,amber:0xffbe68,violet:0xc0a4ff};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const mat=(color,metalness=.25)=>new T.MeshStandardMaterial({color,metalness,roughness:.45});
 function part(parent,geometry,material,x=0,y=0,z=0){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);parent.add(m);return m;}
 function box(parent,material,w,h,d,x=0,y=0,z=0){return part(parent,new T.BoxGeometry(w,h,d),material,x,y,z);}
 function orb(parent,material,r,x=0,y=0,z=0){return part(parent,new T.SphereGeometry(r,16,12),material,x,y,z);}
 function group(parent,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
 function buildHelmet(){
  const root=new T.Group(),shell=mat(0xd5e3e7),dark=mat(0x132330),steel=mat(0x60798a,.7),gold=mat(0xd4b37c,.65);
  const glow=new T.MeshStandardMaterial({color:colors.mint,emissive:colors.mint,emissiveIntensity:.85,roughness:.3});
  box(root,dark,.90,1.05,.29,0,0,-.09); // recessed mechanical interior
  box(root,steel,1.05,.10,.35,0,.57,0);box(root,steel,1.05,.10,.35,0,-.56,0);
  for(const s of [-1,1]){box(root,shell,.15,.85,.39,s*.56,0,-.06);orb(root,glow,.085,s*.65,.12,0);box(root,steel,.04,.29,.05,s*.42,.73,-.04);orb(root,glow,.06,s*.42,.9,-.04);}
  const core=part(root,new T.OctahedronGeometry(.22),glow,0,-.03,.15);
  const ring=part(root,new T.TorusGeometry(.29,.026,8,32),gold,0,-.03,.12);
  const gears=[];
  for(const [x,y,r] of [[-.28,.32,.12],[.28,-.3,.13],[.28,.32,.09],[-.28,-.3,.09]]){
   const g=group(root,x,y,.09);part(g,new T.TorusGeometry(r,.025,6,16),steel);orb(g,glow,.035);
   for(let i=0;i<8;i++){const a=i*Math.PI/4;const tooth=box(g,gold,.04,.055,.045,Math.cos(a)*r,Math.sin(a)*r,.01);tooth.rotation.z=a;}
   gears.push(g);
  }
  const doors=[];
  for(const s of [-1,1]){
   const hinge=group(root,s*.5,0,.28);const cx=-s*.25;
   box(hinge,shell,.49,1.04,.10,cx,0,0);
   box(hinge,dark,.40,.34,.035,cx,.19,.07);
   box(hinge,glow,.19,.07,.04,cx,.2,.1);
   box(hinge,steel,.32,.035,.03,cx,-.31,.075);box(hinge,steel,.25,.035,.03,cx,-.39,.075);
   for(const y of [-.44,.44])orb(hinge,gold,.025,cx+s*.15,y,.07);
   doors.push({hinge,s});
  }
  let opened=0;
  return {root,glow,setColor(name){glow.color.setHex(colors[name]);glow.emissive.setHex(colors[name]);},update(t,dt,target){opened+=(target-opened)*(1-Math.exp(-dt*10));for(const {hinge,s} of doors)hinge.rotation.y=s*opened*1.4;core.rotation.y=t;core.rotation.z=Math.sin(t)*.2;ring.rotation.z=-t*.3;gears.forEach((g,i)=>g.rotation.z=t*(i%2?1:-1));glow.emissiveIntensity=.65+opened*.9;},get amount(){return opened;}};
 }
 function buildRobot(){
  const root=new T.Group(),body=group(root),shell=mat(0xcbdde2),dark=mat(0x1e3444),steel=mat(0x6b8794,.65);
  const helmet=buildHelmet();helmet.root.scale.setScalar(.6);helmet.root.position.y=1.12;body.add(helmet.root);
  box(body,shell,.48,.40,.32,0,.57,0);box(body,dark,.30,.23,.04,0,.59,.19);orb(body,helmet.glow,.08,0,.59,.23);
  const arms=[],legs=[];
  for(const s of [-1,1]){const a=group(body,s*.35,.73,0);orb(a,steel,.10);box(a,shell,.14,.29,.16,0,-.16,0);orb(a,dark,.10,0,-.34,.015);arms.push(a);
   const l=group(body,s*.16,.36,0);box(l,steel,.15,.25,.16,0,-.11,0);box(l,shell,.22,.13,.30,0,-.28,.055);legs.push(l);}
  return {root,helmet,update(t,dt,{moving=false,jump=0,wave=0,open=0}={}){body.position.y=jump+(moving?Math.abs(Math.sin(t*11))*.035:Math.sin(t*2)*.012);legs.forEach((l,i)=>l.rotation.x=moving?Math.sin(t*11+i*Math.PI)*.42:0);arms[0].rotation.x=moving?Math.sin(t*11)*.35:0;arms[1].rotation.x=moving?-Math.sin(t*11)*.35:0;arms[1].rotation.z=wave?(-2.1+Math.sin(t*16)*.35):0;helmet.update(t,dt,open);}};
 }
 function mouthAmount(result,sensitivity=1.2){
  if(!result)return 0;
  const jaw=result.blendshapes?.categories?.find(c=>c.categoryName==='jawOpen')?.score;
  let raw=jaw;
  if(!Number.isFinite(raw)){
   const p=result.metricLandmarks;if(!p?.[14]||!p[13]||!p[61]||!p[291])return 0;
   const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));const width=dist(p[61],p[291]);if(width<1e-6)return 0;
   raw=dist(p[13],p[14])/width;
  }
  return clamp((raw-.055)*2.8*sensitivity,0,1);
 }
 function el(tag,attrs,parent){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
 function scene(){const s=document.createElement('a-scene');s.setAttribute('embedded','');s.setAttribute('xr-mode-ui','enabled: false');s.setAttribute('device-orientation-permission-ui','enabled: false');s.setAttribute('renderer','alpha: true; antialias: true; colorManagement: true');return s;}
 function lights(s){el('a-entity',{light:'type: ambient; color: #d2e5f5; intensity: 1.3'},s);el('a-entity',{light:'type: directional; color: #fff3dc; intensity: 2',position:'-2 4 4'},s);}
 function load(url){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=url;s.onload=resolve;s.onerror=()=>reject(new Error('ライブラリを読み込めません。通信を確認してください。'));document.head.appendChild(s);});}
 function stop(){document.querySelectorAll('video').forEach(v=>v.srcObject?.getTracks().forEach(t=>t.stop()));}
 addEventListener('pagehide',stop);document.querySelectorAll('[data-exit]').forEach(a=>a.addEventListener('click',stop));
 return {T,clamp,buildRobot,buildHelmet,mouthAmount,el,scene,lights,load,stop};
})();
