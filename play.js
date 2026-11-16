'use strict';
(()=>{
const R=RoboLab,$=s=>document.querySelector(s);let scene,robot,preview=false,tracked=false,started=false,jumpStart=-10,clock=0;
const input=new Map(),keys=new Set();
function clearInput(){input.clear();keys.clear();document.querySelectorAll('.pressed').forEach(b=>b.classList.remove('pressed'));}
function enabled(){return started&&(preview||tracked);}
function track(found){tracked=found;if(!found)clearInput();$('#status').textContent=preview?'カメラなしのプレビュー':found?'移動・ジャンプできます':'マーカーの黒い枠を全部映してください';document.querySelectorAll('.gamepad button').forEach(b=>b.disabled=!enabled());}
AFRAME.registerComponent('robot-player',{init(){robot=R.buildRobot();this.el.setObject3D('robot',robot.root);},tick(ms,delta){if(!robot)return;clock=ms/1000;const dt=Math.min(delta/1000,.05);let x=0,z=0;const dirs=new Set([...input.values(),...keys]);if(enabled()){x=Number(dirs.has('right'))-Number(dirs.has('left'));z=Number(dirs.has('down'))-Number(dirs.has('up'));}const len=Math.hypot(x,z);if(len){x/=len;z/=len;this.el.object3D.position.x=R.clamp(this.el.object3D.position.x+x*dt*.65,-1,1);this.el.object3D.position.z=R.clamp(this.el.object3D.position.z+z*dt*.65,-.85,.85);robot.root.rotation.y=Math.atan2(x,z);}
 const phase=(clock-jumpStart)/.8;const jump=phase>0&&phase<1?Math.sin(phase*Math.PI)*.5:0;
 robot.update(clock,{moving:!!len,jump});},remove(){this.el.removeObject3D('robot');}});
async function start(isPreview){if(started)return;$('#start').disabled=true;$('#preview').disabled=true;$('#error').textContent='';
try{if(!isPreview){if(!isSecureContext||!navigator.mediaDevices)throw new Error('HTTPSのSafari / Chromeで開いてください。');await R.load('vendor/aframe-ar.js');}
preview=isPreview;started=true;document.body.classList.toggle('preview',preview);scene=R.scene();
if(!preview)scene.setAttribute('arjs','sourceType: webcam; detectionMode: mono; patternRatio: 0.5; debugUIEnabled: false; cameraParametersUrl: assets/camera_para.dat; sourceWidth: 640; sourceHeight: 480;');
const base=preview?R.el('a-entity',{},scene):R.el('a-marker',{type:'pattern',url:'assets/garden.patt',size:1,emitevents:true,smooth:true,'smooth-count':5},scene);
if(!preview){base.addEventListener('markerFound',()=>track(true));base.addEventListener('markerLost',()=>track(false));}
R.el('a-entity',{'robot-player':''},base);

if(preview)R.el('a-camera',{position:'0 2.5 4.8',rotation:'-24 0 0','look-controls':'enabled: false','wasd-controls':'enabled: false'},scene);else R.el('a-entity',{camera:''},scene);
R.lights(scene);$('#stage').appendChild(scene);$('#start-panel').hidden=true;$('#controls').hidden=false;track(preview);
}catch(e){$('#error').textContent=e.message;$('#start').disabled=false;$('#preview').disabled=false;}}
document.querySelectorAll('[data-dir]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(!enabled())return;e.preventDefault();b.setPointerCapture(e.pointerId);input.set(e.pointerId,b.dataset.dir);b.classList.add('pressed');});const release=e=>{input.delete(e.pointerId);b.classList.remove('pressed');};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
// Keyboard and screen-reader click users can step without holding a pointer.
b.addEventListener('click',e=>{if(e.detail===0&&enabled()){input.set('step',b.dataset.dir);setTimeout(()=>input.delete('step'),180);}});});
const keymap={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right'};
addEventListener('keydown',e=>{if(keymap[e.key]&&enabled()){e.preventDefault();keys.add(keymap[e.key]);}});addEventListener('keyup',e=>keys.delete(keymap[e.key]));addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);
$('#jump').onclick=()=>{if(enabled()&&clock-jumpStart>=.8)jumpStart=clock;};
addEventListener('camera-error',()=>{$('#status').textContent='カメラを開始できません。サイトのカメラ許可を確認してください。';});
$('#start').onclick=()=>start(false);$('#preview').onclick=()=>start(true);if(new URLSearchParams(location.search).get('preview')==='1')start(true);
})();
