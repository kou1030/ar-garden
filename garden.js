'use strict';
// All geometry is original and generated locally. No external models or textures.
const $ = s => document.querySelector(s);
let scene, garden, marker, preview = false, found = false, lights = 0, paused = false, time = 'day';
const palette = {day:['#d7f0d2',.8,'#fff3c9',1.1,'#57beaf','DAYLIGHT / 木漏れ日の庭'],dusk:['#b69bce',.65,'#ffae78',1.3,'#ad91dc','TWILIGHT / 琥珀の風'],night:['#708ebd',.4,'#a5d7ff',.7,'#417bab','MOONLIGHT / 星の眠る泉']};
function entity(tag,attrs,parent){const e=document.createElement(tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);parent.appendChild(e);return e;}
function mesh(shape,pos,scale,color,parent=garden,extra={}){return entity('a-entity',{geometry:`primitive: ${shape}`,position:pos,scale,material:`color: ${color}; roughness: .85; flatShading: true`,...extra},parent);}
function buildGarden(){
 mesh('cylinder','0 -.19 0','1.05 .34 .88','#435d60',garden,{geometry:'primitive: cylinder; radius: 1; segmentsRadial: 9'});
 mesh('cone','0 -.55 0','.99 .58 .83','#344750',garden,{geometry:'primitive: cone; radiusBottom: .18; radiusTop: 1; segmentsRadial: 9'});
 mesh('cylinder','0 .01 0','1.07 .09 .90','#83a96f',garden,{geometry:'primitive: cylinder; radius: 1; segmentsRadial: 10'});
 const pond=mesh('cylinder','.25 .07 .13','.48 .025 .34','#57beaf',garden,{id:'pond',geometry:'primitive: cylinder; radius: 1; segmentsRadial: 40',material:'color: #57beaf; metalness: .35; roughness: .2'});
 for(let i=0;i<3;i++)mesh('torus','.25 .09 .13',`${.18+i*.12} ${.12+i*.08} .01`,'#d5f1cb',garden,{rotation:'-90 0 0',geometry:'primitive: torus; radius: 1; radiusTubular: .018; segmentsRadial: 6; segmentsTubular: 40',animation:`property: material.opacity; from: .15; to: .65; dur: ${1800+i*400}; dir: alternate; loop: true`,material:'color: #d5f1cb; transparent: true; opacity: .4'});
 for(const [x,z,s] of [[-.6,-.32,1],[.1,-.55,.85],[-.76,.22,.55],[.65,-.38,.65]]){let tree=entity('a-entity',{position:`${x} .07 ${z}`,scale:`${s} ${s} ${s}`},garden);mesh('cylinder','0 .28 0','.065 .56 .065','#82644a',tree);for(let j=0;j<3;j++)mesh('cone',`0 ${.5+j*.2} 0`,`${.31-j*.055} .48 ${.31-j*.055}`,['#356d59','#4c8967','#79ae7b'][j],tree,{geometry:'primitive: cone; radiusBottom: 1; segmentsRadial: 7'});}
 for(let i=0;i<11;i++){const a=i*2.399;mesh('dodecahedron',`${Math.cos(a)*.86} .09 ${Math.sin(a)*.66}`,'.10 .07 .09',i%2?'#c1c6a5':'#91a99b');}
 // A small bridge across the edge of the spring.
 for(let i=0;i<6;i++)mesh('box',`${-.04+i*.095} .145 .42`,'.085 .035 .26','#bca57b');
 const shrine=entity('a-entity',{position:'-.32 .09 .1'},garden);
 mesh('cylinder','0 .08 0','.20 .16 .20','#c3c9ae',shrine,{geometry:'primitive: cylinder; radius: 1; segmentsRadial: 6'});
 const crystal=entity('a-entity',{position:'0 .57 0',animation:'property: position; from: 0 .52 0; to: 0 .65 0; dir: alternate; loop: true; dur: 2200; easing: easeInOutSine'},shrine);
 mesh('octahedron','0 0 0','.17 .33 .17','#b1f6dc',crystal,{material:'color: #a0f4d7; emissive: #63cdb3; emissiveIntensity: .45; metalness: .2; roughness: .2',animation:'property: rotation; to: 0 360 0; dur: 11000; loop: true; easing: linear'});
 mesh('torus','0 .45 0','.27 .27 .27','#e9d9a1',shrine,{rotation:'75 0 0',geometry:'primitive: torus; radius: 1; radiusTubular: .018; segmentsRadial: 6; segmentsTubular: 40'});
 for(let i=0;i<12;i++){let a=i*2.399;mesh('sphere',`${Math.cos(a)*.75} ${.25+(i%4)*.13} ${Math.sin(a)*.6}`,'.016 .016 .016','#e9ffc8',garden,{class:'spark',material:'shader: flat; color: #e9ffc8',animation:`property: position; to: ${Math.cos(a+.3)*.75} ${.45+(i%4)*.13} ${Math.sin(a+.3)*.6}; dur: ${1800+i*180}; dir: alternate; loop: true; easing: easeInOutSine`});}
 const blooms=entity('a-entity',{id:'blooms',visible:false},garden);
 for(let i=0;i<15;i++){let a=i*2.4,x=Math.cos(a)*(.55+i%3*.1),z=Math.sin(a)*.63;mesh('cylinder',`${x} .13 ${z}`,'.012 .15 .012','#6b9571',blooms);mesh('dodecahedron',`${x} .22 ${z}`,'.055 .04 .055',i%2?'#ffc2b6':'#f1df9c',blooms);}
 entity('a-entity',{id:'ambient',light:'type: ambient; color: #d7f0d2; intensity: 1.5'},scene);
 entity('a-entity',{id:'sun',light:'type: directional; color: #fff3c9; intensity: 2.1',position:'-1 3 2'},scene);
}
function setTime(value){time=value;const p=palette[value];$('#ambient').setAttribute('light',{color:p[0],intensity:p[1]});$('#sun').setAttribute('light',{color:p[2],intensity:p[3]});$('#pond').setAttribute('material','color',p[4]);$('#season').textContent=p[5];document.querySelectorAll('[data-time]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.time===value)));document.querySelectorAll('.spark').forEach(e=>e.setAttribute('scale',value==='night'?'.025 .025 .025':'.016 .016 .016'));}
function tracking(ok){found=ok;$('#wish').disabled=lights===5||(!ok&&!preview);$('#reticle').hidden=ok||preview;$('#status').textContent=preview?'3Dプレビュー · 実写ARではありません':ok?'庭の扉がひらきました · マーカー認識中':'マーカーを探しています';}
function fail(message){$('#status').textContent=message;$('#hint').textContent='カメラ許可を確認し、終了してから再度お試しください。';$('#reticle').hidden=true;}
async function start(isPreview){
 if(!window.AFRAME){$('#status').textContent='ライブラリを読み込めません。再読み込みしてください。';return;}
 if(!isPreview&&(!window.isSecureContext||!navigator.mediaDevices)){ $('#status').textContent='HTTPSで開き、カメラ対応ブラウザをご利用ください。';return;}
 if(!isPreview&&!AFRAME.systems.arjs){
  $('#start').disabled=true;$('#preview').disabled=true;$('#status').textContent='ARエンジンを準備しています…';
  try{await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='vendor/aframe-ar.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  catch(e){$('#status').textContent='ARエンジンを読み込めません。再読み込みしてください。';$('#start').disabled=false;$('#preview').disabled=false;return;}
 }
 preview=isPreview;$('#welcome').hidden=true;$('#controls').hidden=false;document.body.classList.add('active');document.body.classList.toggle('preview',preview);
 scene=document.createElement('a-scene');scene.setAttribute('embedded','');scene.setAttribute('xr-mode-ui','enabled: false');scene.setAttribute('device-orientation-permission-ui','enabled: false');scene.setAttribute('renderer','alpha: true; antialias: true; colorManagement: true');
 if(!preview)scene.setAttribute('arjs','sourceType: webcam; debugUIEnabled: false; detectionMode: mono; patternRatio: 0.5; cameraParametersUrl: assets/camera_para.dat; sourceWidth: 640; sourceHeight: 480;');
 if(preview){garden=entity('a-entity',{rotation:'0 -25 0'},scene);entity('a-camera',{position:'0 2.5 3.6',rotation:'-40 0 0','look-controls':'enabled: false','wasd-controls':'enabled: false'},scene);}else{marker=entity('a-marker',{type:'pattern',url:'assets/garden.patt',size:1,emitevents:true,smooth:true,'smooth-count':5},scene);garden=entity('a-entity',{},marker);entity('a-entity',{camera:'',position:'0 0 0'},scene);marker.addEventListener('markerFound',()=>tracking(true));marker.addEventListener('markerLost',()=>tracking(false));}
 buildGarden();$('#scene-host').appendChild(scene);$('#view-label').textContent=preview?'3D PREVIEW · ARではありません':'MARKER AR';tracking(preview);setTime(time);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches){paused=true;$('#motion').textContent='▶';$('#motion').setAttribute('aria-pressed','true');scene.addEventListener('loaded',()=>garden.pause(),{once:true});}
}
window.addEventListener('camera-error',()=>fail('カメラを開始できませんでした'));
window.addEventListener('arjs-video-loaded',()=>{if(!found)$('#status').textContent='カメラ準備完了 · マーカー全体を映してください';});
$('#start').onclick=()=>start(false);$('#preview').onclick=()=>start(true);
document.querySelectorAll('[data-time]').forEach(b=>b.onclick=()=>setTime(b.dataset.time));
$('#wish').onclick=()=>{if(!found&&!preview)return;lights=Math.min(5,lights+1);$('#count').textContent=`${lights} / 5`;$('#hint').textContent=lights===5?'願いが届きました。庭に花が咲きました。':`あと${5-lights}つの光で、花が咲きます。`;$('#blooms').setAttribute('visible',lights===5);$('#wish').disabled=lights===5;};
$('#reset').onclick=()=>{lights=0;$('#count').textContent='0 / 5';$('#blooms').setAttribute('visible',false);$('#wish').disabled=!found&&!preview;$('#hint').textContent='5つの光で、泉のまわりに花が咲きます。';};
$('#motion').onclick=()=>{paused=!paused;paused?garden.pause():garden.play();$('#motion').textContent=paused?'▶':'Ⅱ';$('#motion').setAttribute('aria-pressed',String(paused));$('#motion').setAttribute('aria-label',paused?'アニメーションを再開':'アニメーションを一時停止');};
$('#help').onclick=()=>$('#guide').showModal();$('#close-guide').onclick=()=>$('#guide').close();
$('#exit').onclick=()=>{document.querySelectorAll('video').forEach(v=>v.srcObject?.getTracks().forEach(t=>t.stop()));location.reload();};

