'use strict';
(()=>{
const R=RoboLab,$=s=>document.querySelector(s);let scene,helmet,preview=false,started=false,found=false,manual=false,failed=false,timer;
AFRAME.registerComponent('robot-face',{init(){helmet=R.buildHelmet();this.el.setObject3D('helmet',helmet.root);},tick(t,d){if(!helmet)return;const result=scene?.systems['mindar-face-system']?.controller?.lastEstimateResult;const amount=preview?Number(manual):found?R.mouthAmount(result):0;helmet.update(t/1000,Math.min(d/1000,.05),amount);},remove(){this.el.removeObject3D('helmet');}});
function error(msg){failed=true;clearTimeout(timer);R.stop();scene?.systems['mindar-face-system']?.controller?.stopProcessVideo();$('#status').textContent='顔認識を開始できませんでした';$('#controls').hidden=true;$('#start-panel').hidden=false;$('#error').textContent=msg+' ページを再読み込みしてお試しください。';}
async function start(isPreview){if(started)return;$('#start').disabled=true;$('#preview').disabled=true;
try{if(!isPreview){if(!isSecureContext||!navigator.mediaDevices)throw new Error('HTTPSのSafari / Chromeで開いてください。');$('#status').textContent='顔認識エンジンを読み込んでいます…';await R.load('vendor/mindar-face-aframe.prod.js');}
preview=isPreview;started=true;document.body.classList.toggle('preview',preview);scene=R.scene();
if(!preview)scene.setAttribute('mindar-face','autoStart: false; faceOccluder: false; uiLoading: no; uiScanning: no; uiError: no;');
const target=R.el('a-entity',preview?{position:'0 .45 0'}:{'mindar-face-target':'anchorIndex: 168'},scene);
// Nose-bridge anchor; move the shell slightly forward to reveal a mechanical interior.
R.el('a-entity',{'robot-face':'',position:preview?'0 0 0':'0 -.08 .10'},target);
R.el('a-camera',preview?{position:'0 .76 3.05',rotation:'-12 0 0','look-controls':'enabled: false','wasd-controls':'enabled: false'}:{active:false,position:'0 0 0','look-controls':'enabled: false','wasd-controls':'enabled: false'},scene);R.lights(scene);
scene.addEventListener('targetFound',()=>{found=true;$('#status').textContent='口を開けると装甲が開きます';});
scene.addEventListener('targetLost',()=>{found=false;$('#status').textContent='顔を正面に向けてください';});
scene.addEventListener('arReady',()=>{clearTimeout(timer);if(failed){R.stop();return;}$('#status').textContent='内カメ準備完了 · 顔を映してください';});
scene.addEventListener('arError',()=>error('カメラの許可と、他のアプリがカメラを使用していないか確認してください。'));
if(!preview)scene.addEventListener('renderstart',()=>{
 const system=scene.systems['mindar-face-system'];
 // MindAR 1.2.5 starts processing after model setup. Skip that step if setup failed or timed out.
 const setup=system._setupAR.bind(system);
 const process=system._processVideo.bind(system);
 system._setupAR=async function(){try{await setup();}catch{error('顔認識モデルを読み込めません。通信環境をご確認ください。');}};
 system._processVideo=()=>{if(!failed)process();};
 system.shouldFaceUser=true;
 timer=setTimeout(()=>error('読み込みが完了しませんでした。通信環境とカメラ許可をご確認ください。'),60000);
 system.start();
},{once:true});
$('#stage').appendChild(scene);$('#start-panel').hidden=true;$('#controls').hidden=!preview;
$('#status').textContent=preview?'カメラなしのプレビュー':'内カメと顔認識モデルを準備しています…';
}catch(e){$('#error').textContent=e.message;$('#start').disabled=false;$('#preview').disabled=false;}}
$('#demo-open').onclick=()=>{manual=!manual;$('#demo-open').setAttribute('aria-pressed',String(manual));$('#demo-open').textContent=manual?'装甲を閉じる':'装甲を開く';};
$('#start').onclick=()=>start(false);$('#preview').onclick=()=>start(true);
addEventListener('pagehide',()=>{scene?.systems['mindar-face-system']?.controller?.stopProcessVideo();clearTimeout(timer);});
})();
