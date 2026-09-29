import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {meshCases,methods} from './data.js';
import {icons,dividerMarkup,setupDivider} from './video-player.js';
export class MeshGallery {
 constructor(container){
  this.container=container;this.caseId=1;this.mode='multi';this.compareMethod='ours';this.material='normal';this.models=new Map();this.scenes=new Map();this.visible=false;this.initialized=false;this.generation=0;this.rotate=false;this.loading=false;this.disposed=false;
  container.innerHTML=`<div class="mesh-topbar"><div class="mesh-case-strip" aria-label="3D cases">${meshCases.map(c=>`<button class="mesh-case-button ${c.id===1?'active':''}" data-case="${c.id}" data-short="${c.shortName || c.name}" aria-label="View ${c.name}" aria-pressed="${c.id===1}"><img src="assets/posters/mesh-${c.id}-ours.webp" alt="">${c.name}</button>`).join('')}</div></div><div class="mesh-layout-controls"><div class="segmented" aria-label="3D comparison layout"><button data-mesh-mode="multi" aria-pressed="true">▦ All methods · 2 × 2</button><button data-mesh-mode="split" aria-pressed="false">↔ Slider comparison</button></div><label class="mesh-comparison-picker">Dense <span aria-hidden="true">vs.</span><select aria-label="Compare Dense with"><option value="ours">MC-Sparse (Ours)</option><option value="pisa">PISA</option><option value="sol">Sol-Attn</option></select></label></div><div class="mesh-viewport multi" aria-label="Interactive 3D mesh comparison"><div class="mesh-fallback"><img src="assets/posters/mesh-1-ours.webp" alt="Winged guardian generated geometry"></div><canvas class="mesh-canvas" aria-label="Drag to rotate all meshes; use the scroll wheel to zoom" tabindex="0"></canvas><div class="mesh-label-overlay"><span class="method-label">Dense</span><span class="method-label ours"><i class="label-dot"></i>MC-Sparse (Ours)</span></div>${dividerMarkup('Dense and Ours mesh comparison')}<div class="mesh-view-labels" hidden></div><div class="mesh-reference"><img src="assets/posters/mesh-1-reference.webp" alt="Input reference"><span>REFERENCE</span></div><span class="mesh-instructions">Drag to orbit · Scroll to zoom</span><div class="mesh-loading" role="status"><button class="mesh-start">Explore in 3D <span>↗</span></button><p>Original meshes · Linked viewpoints</p></div></div><div class="mesh-footer"><div class="mesh-footer-left"><div class="mesh-material" aria-label="Surface appearance"><span>SURFACE</span><button class="material-button active" data-material="normal" aria-label="Show normal colors" aria-pressed="true" title="Normal colors"></button><button class="material-button" data-material="clay" aria-label="Show clay surface" aria-pressed="false" title="Clay surface"></button></div><button class="tool-button auto-rotate" aria-pressed="false">${icons.rotate} Auto-rotate</button></div><span class="mesh-density">MC-Sparse · 15% density · Original mesh</span><div class="mesh-controls-right"><button class="tool-button reset-view">${icons.restart} Reset view</button><button class="tool-button mesh-fullscreen" aria-label="Fullscreen 3D comparison">${icons.fullscreen}</button></div></div>`;
  this.viewport=container.querySelector('.mesh-viewport');this.canvas=container.querySelector('canvas');this.overlay=container.querySelector('.mesh-loading');this.fallback=container.querySelector('.mesh-fallback');this.labelOverlay=container.querySelector('.mesh-label-overlay');this.multiLabels=container.querySelector('.mesh-view-labels');this.reference=container.querySelector('.mesh-reference img');this.reference.src='assets/posters/mesh-1-reference.webp';
  this.divider=setupDivider(this.viewport,()=>this.requestRender());
  this.updateLayout();
  container.querySelector('.mesh-comparison-picker select').addEventListener('change',e=>this.selectComparison(e.target.value));
  container.querySelector('.mesh-start').addEventListener('click',()=>this.initialize());
  container.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>this.selectCase(Number(b.dataset.case))));
  container.querySelectorAll('[data-mesh-mode]').forEach(b=>b.addEventListener('click',()=>this.setMode(b.dataset.meshMode)));
  container.querySelectorAll('[data-material]').forEach(b=>b.addEventListener('click',()=>this.setMaterial(b.dataset.material)));
  container.querySelector('.auto-rotate').addEventListener('click',()=>{this.rotate=!this.rotate;container.querySelector('.auto-rotate').setAttribute('aria-pressed',String(this.rotate));if(this.controls)this.controls.autoRotate=this.rotate;if(!this.initialized)this.initialize();this.requestRender();});
  container.querySelector('.reset-view').addEventListener('click',()=>{this.resetCamera();this.divider.set(.5);});
  container.querySelector('.mesh-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await this.viewport.requestFullscreen();}catch{container.querySelector('.mesh-instructions').textContent='Fullscreen is unavailable in this browser.';}});
  this.observer=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;if(this.visible){if(!this.initialized&&!this.failed)this.initialize();this.requestRender();}else this.stop();},{threshold:.08});this.observer.observe(this.viewport);
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.viewport);
  this.visibility=()=>{if(document.hidden)this.stop();else if(this.visible)this.requestRender();};document.addEventListener('visibilitychange',this.visibility);
  this.canvas.addEventListener('keydown',e=>{if(!this.controls)return;const step=.08;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','r'].includes(e.key)){e.preventDefault();const offset=this.camera.position.clone().sub(this.controls.target);const sph=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')sph.theta-=step;if(e.key==='ArrowRight')sph.theta+=step;if(e.key==='ArrowUp')sph.phi=Math.max(.05,sph.phi-step);if(e.key==='ArrowDown')sph.phi=Math.min(Math.PI-.05,sph.phi+step);if(e.key==='+')sph.radius*=.9;if(e.key==='-')sph.radius*=1.1;if(e.key==='r'){this.resetCamera();return;}this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(sph));this.controls.update();this.requestRender();}});
 }
 async initialize(){
  if(this.initialized)return;this.initialized=true;this.failed=false;this.canvas.hidden=false;this.controls?.dispose();this.renderer?.dispose();
  try{
   this.renderer=new THREE.WebGLRenderer({canvas:this.canvas,antialias:true,alpha:false,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));this.renderer.setClearColor(0xfbfaff);this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.autoClear=false;
   this.camera=new THREE.PerspectiveCamera(36,1,.01,100);this.camera.position.set(0,0,3.2);
   this.controls=new OrbitControls(this.camera,this.canvas);this.controls.enableDamping=false;this.controls.enablePan=true;this.controls.minDistance=.45;this.controls.maxDistance=12;this.controls.rotateSpeed=.65;this.controls.autoRotate=this.rotate;this.controls.autoRotateSpeed=.7;this.controls.addEventListener('change',()=>this.requestRender());
   this.normalMat=new THREE.MeshNormalMaterial({side:THREE.DoubleSide});this.clayMat=new THREE.MeshStandardMaterial({color:0xb4a7c9,roughness:.62,metalness:.05,side:THREE.DoubleSide});
   this.loader=new GLTFLoader();this.resize();await this.loadCurrent();
  }catch(error){this.failed=true;this.initialized=false;this.canvas.hidden=true;this.showFailure('3D rendering could not start. Preview images remain available.',true);console.warn('Mesh viewer initialization:',error.message);}
 }
 async selectCase(id){
  const meshCase=meshCases.find(c=>c.id===id);
  if(!meshCase||this.caseId===id)return;
  this.caseId=id;this.generation++;this.abort?.abort();this.disposeModels();this.fallback.className='mesh-fallback';this.normalization=null;this.fallback.hidden=false;this.fallback.innerHTML=`<img src="assets/posters/mesh-${id}-ours.webp" alt="${meshCase.name} geometry preview">`;
  const hasReference=meshCase.hasReference!==false;
  this.reference.parentElement.hidden=!hasReference;
  if(hasReference){this.reference.src=`assets/posters/mesh-${id}-reference.webp`;this.reference.alt=`${meshCase.name} input reference`;}
  else{this.reference.removeAttribute('src');this.reference.alt='';}
  this.container.querySelectorAll('[data-case]').forEach(b=>{const active=Number(b.dataset.case)===id;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});
  this.divider.set(.5);this.resetCamera();if(this.initialized)await this.loadCurrent();else this.initialize();
 }
 updateLayout(){
  const multi=this.mode==='multi';
  this.viewport.classList.toggle('multi',multi);
  this.viewport.querySelector('.divider').hidden=multi;
  this.labelOverlay.hidden=multi;this.multiLabels.hidden=!multi;
  this.container.querySelectorAll('[data-mesh-mode]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.meshMode===this.mode));
  this.multiLabels.innerHTML=['dense','pisa','sol','ours'].map(k=>`<div data-mesh-method="${k}"><span class="method-label ${k==='ours'?'ours':''}">${methods[k]}</span></div>`).join('');
  this.labelOverlay.innerHTML=`<span class="method-label">Dense</span><span class="method-label comparison-target ${this.compareMethod==='ours'?'ours':''}">${methods[this.compareMethod]}</span>`;
  this.divider.setLabels({left:'Dense',right:methods[this.compareMethod]});
  this.viewport.querySelector('.divider').setAttribute('aria-label',`Dense and ${methods[this.compareMethod]} mesh comparison`);
  this.container.querySelector('.mesh-comparison-picker select').value=this.compareMethod;
 }
 async setMode(mode){
  if(this.mode===mode)return;this.mode=mode;this.updateLayout();
  if(!this.initialized){await this.initialize();return;}
  this.resize();await this.loadCurrent();
 }
 async selectComparison(method){
  if(!['ours','pisa','sol'].includes(method))return;
  this.compareMethod=method;this.mode='split';this.updateLayout();this.divider.set(.5);
  if(!this.initialized){await this.initialize();return;}
  this.resize();await this.loadCurrent();
 }
 visibleKeys(){return this.mode==='split'?['dense',this.compareMethod]:['dense','pisa','sol','ours'];}
 meshPath(key){const prefix=key==='sol'?(this.caseId===2?'sol':'solattn'):key;return `assets/meshes/${prefix}_case${this.caseId}.glb`;}
 async fetchMesh(path,signal,onProgress){
  const response=await fetch(path,{signal});if(!response.ok)throw new Error(`Mesh request failed (${response.status})`);
  const length=Number(response.headers.get('Content-Length'))||36000000;const reader=response.body.getReader();const chunks=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);total+=value.byteLength;onProgress(Math.min(total/length,.99));}
  const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}return bytes.buffer;
 }
 async loadCurrent(){
  const generation=++this.generation;this.abort?.abort();this.abort=new AbortController();const signal=this.abort.signal;const keys=this.visibleKeys().filter(k=>!this.scenes.has(k));
  // Dispose partially loaded objects from an interrupted layout switch.
  for(const [key,obj] of this.models){if(!this.scenes.has(key)){this.disposeObject(obj);this.models.delete(key);}}
  if(!keys.length){this.overlay.hidden=true;this.loading=false;this.fallback.hidden=true;this.canvas.hidden=false;this.requestRender();return;}
  this.loading=true;this.overlay.hidden=false;this.overlay.innerHTML=`<div class="loading-progress"><i></i></div><p>Loading original meshes · 0%</p>`;const progress=Object.fromEntries(keys.map(k=>[k,0]));
  const update=(key,value)=>{if(generation!==this.generation||signal.aborted)return;progress[key]=value;const p=Math.round(Object.values(progress).reduce((a,b)=>a+b,0)/keys.length*100);this.overlay.querySelector('i').style.width=`${p}%`;this.overlay.querySelector('p').textContent=p<99?`Loading original meshes · ${p}%`:'Preparing geometry…';};
  try{
   await Promise.all(keys.map(async key=>{
    const buffer=await this.fetchMesh(this.meshPath(key),signal,p=>update(key,p*.92));if(generation!==this.generation)return;
    const gltf=await this.loader.parseAsync(buffer,'');if(generation!==this.generation||signal.aborted){this.disposeObject(gltf.scene);return;}
    gltf.scene.traverse(obj=>{if(obj.isMesh){if(!obj.geometry.attributes.normal)obj.geometry.computeVertexNormals();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose());else obj.material?.dispose();obj.material=this.material==='normal'?this.normalMat:this.clayMat;}});
    this.models.set(key,gltf.scene);update(key,1);
   }));
   if(generation!==this.generation)return;
   if(!this.normalization){const dense=this.models.get('dense');const box=new THREE.Box3().setFromObject(dense);const center=box.getCenter(new THREE.Vector3());const size=box.getSize(new THREE.Vector3());this.normalization={center,scale:1.75/Math.max(size.x,size.y,size.z)};}
   for(const [key,obj] of this.models){if(this.scenes.has(key))continue;const scene=new THREE.Scene();scene.background=new THREE.Color(0xfbfaff);const group=new THREE.Group();group.scale.setScalar(this.normalization.scale);group.position.copy(this.normalization.center).multiplyScalar(-this.normalization.scale);group.add(obj);scene.add(group);scene.add(new THREE.HemisphereLight(0xffffff,0x645174,2.1));const keyLight=new THREE.DirectionalLight(0xffffff,3.4);keyLight.position.set(2,4,5);scene.add(keyLight);const fill=new THREE.DirectionalLight(0xc6d7ff,1.1);fill.position.set(-3,1,-2);scene.add(fill);this.scenes.set(key,scene);}
   this.loading=false;this.overlay.hidden=true;this.fallback.hidden=true;this.canvas.hidden=false;if(!this.cameraFramed){this.resetCamera();this.cameraFramed=true;}this.resize();this.requestRender();
  }catch(error){if(generation!==this.generation||error.name==='AbortError')return;this.loading=false;this.abort.abort();for(const key of keys){const obj=this.models.get(key);if(obj){this.disposeObject(obj);this.models.delete(key);this.scenes.delete(key);}}this.showFailure('The meshes could not load. Retry to continue.',false);console.warn('Mesh load:',error.message);}
 }
 showFailure(message,renderFailure){this.overlay.hidden=false;this.overlay.innerHTML=`<p>${message}</p><button class="mesh-start">Retry 3D</button><button class="preview-only">View preview</button>`;this.overlay.querySelector('.mesh-start').addEventListener('click',()=>renderFailure?this.initialize():this.loadCurrent());this.overlay.querySelector('.preview-only').addEventListener('click',()=>{this.overlay.hidden=true;this.showPreview();});}
 showPreview(){this.fallback.hidden=false;this.canvas.hidden=true;this.fallback.className='mesh-fallback '+(this.mode==='multi'?'multi-preview':'split-preview');const keys=this.mode==='split'?[this.compareMethod,'dense']:this.visibleKeys();this.fallback.innerHTML=keys.map(k=>`<img class="${this.mode==='split'&&k==='dense'?'dense-layer':''}" src="assets/posters/mesh-${this.caseId}-${k}.webp" alt="${methods[k]} geometry preview">`).join('');this.container.querySelector('.mesh-instructions').textContent='Rendered preview · Retry 3D to orbit';}
 setMaterial(value){this.material=value;this.container.querySelectorAll('[data-material]').forEach(b=>{const active=b.dataset.material===value;b.classList.toggle('active',active);b.setAttribute('aria-pressed',active);});this.models.forEach(obj=>obj.traverse(m=>{if(m.isMesh)m.material=value==='normal'?this.normalMat:this.clayMat;}));this.requestRender();}
 resetCamera(){if(!this.camera)return;this.camera.position.set(0,0,3.5);this.controls.target.set(0,0,0);this.camera.zoom=1;this.camera.updateProjectionMatrix();this.controls.update();this.requestRender();}
 resize(){if(!this.renderer)return;const r=this.viewport.getBoundingClientRect();if(!r.width||!r.height)return;this.width=r.width;this.height=r.height;this.renderer.setSize(r.width,r.height,false);this.requestRender();}
 requestRender(){if(!this.renderer||!this.visible||document.hidden||this.frame)return;this.frame=requestAnimationFrame(time=>{this.frame=0;this.render(time);});}
 render(time){
  if(!this.renderer||!this.width||!this.height||!this.visible||document.hidden)return;
  if(this.rotate&&!this.loading){this.controls.update(Math.min((time-(this.lastTime||time))/1000,.05));}this.lastTime=time;
  const r=this.renderer,w=this.width,h=this.height;r.setScissorTest(false);r.setViewport(0,0,w,h);r.clear(true,true,true);r.setScissorTest(true);
  if(this.mode==='split'){
   this.camera.aspect=w/h;this.camera.fov=36;this.camera.updateProjectionMatrix();const split=Math.round(w*this.divider.get());
   for(const [key,x,width] of [['dense',0,split],[this.compareMethod,split,w-split]]){if(width<=0||!this.scenes.has(key))continue;r.setViewport(0,0,w,h);r.setScissor(x,0,width,h);r.clear(true,true,true);r.render(this.scenes.get(key),this.camera);}
  }else{
   const columns=2,rows=2,cw=w/columns,ch=h/rows;
   this.camera.aspect=cw/ch;this.camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(Math.tan(THREE.MathUtils.degToRad(18))/Math.min(1,cw/ch)));this.camera.updateProjectionMatrix();
   this.visibleKeys().forEach((key,i)=>{if(!this.scenes.has(key))return;const x=(i%columns)*cw,y=(rows-1-Math.floor(i/columns))*ch;r.setViewport(x,y,cw,ch);r.setScissor(x,y,cw,ch);r.clear(true,true,true);r.render(this.scenes.get(key),this.camera);});
  }
  r.setScissorTest(false);if(this.rotate&&!this.loading)this.requestRender();
 }
 disposeObject(obj){obj.traverse(m=>{if(m.isMesh){m.geometry?.dispose();if(m.material!==this.normalMat&&m.material!==this.clayMat){if(Array.isArray(m.material))m.material.forEach(mat=>mat.dispose());else m.material?.dispose();}}});}
 disposeModels(){for(const obj of this.models.values())this.disposeObject(obj);this.models.clear();this.scenes.clear();this.renderer?.renderLists.dispose();this.cameraFramed=false;this.requestRender();}
 stop(){if(this.frame)cancelAnimationFrame(this.frame);this.frame=0;this.lastTime=0;}
}
