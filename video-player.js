export const icons = {
 play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m8 5 11 7-11 7z"/></svg>',
 pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm7 0h4v14h-4z"/></svg>',
 restart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10a8 8 0 1 1 0 5M4 4v6h6"/></svg>',
 fullscreen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/></svg>',
 chevrons:'<svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m8 5-5 5 5 5"/></svg><svg viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 5 5 5-5 5"/></svg>',
 rotate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 7A8 8 0 0 0 5 6M5 17a8 8 0 0 0 14 1M19 3v5h-5M5 21v-5h5"/></svg>'
};
export function dividerMarkup(label, tip='') {
 return `<button class="divider" role="slider" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-valuetext="50% Dense, 50% Ours"><span class="divider-grip" aria-hidden="true">${icons.chevrons}</span>${tip?`<span class="divider-tip">${tip}</span>`:''}</button>`;
}
export function setupDivider(stage, onChange=()=>{}, labels={left:'Dense',right:'Ours'}) {
 const divider=stage.querySelector('.divider');
 let split=.5;
 const update=value=>{split=Math.max(0,Math.min(1,value));stage.style.setProperty('--split',`${split*100}%`);divider.setAttribute('aria-valuenow',Math.round(split*100));divider.setAttribute('aria-valuetext',`${Math.round(split*100)}% ${labels.left}, ${Math.round((1-split)*100)}% ${labels.right}`);onChange(split);};
 const move=e=>{const r=stage.getBoundingClientRect();update((e.clientX-r.left)/r.width);};
 divider.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();divider.setPointerCapture(e.pointerId);move(e);divider.classList.add('dragging');});
 divider.addEventListener('pointermove',e=>{if(divider.hasPointerCapture(e.pointerId))move(e);});
 const end=e=>{if(divider.hasPointerCapture(e.pointerId))divider.releasePointerCapture(e.pointerId);divider.classList.remove('dragging');};
 divider.addEventListener('pointerup',end);divider.addEventListener('pointercancel',end);
 divider.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();update(e.key==='Home'?0:e.key==='End'?1:split+(e.key==='ArrowRight'?1:-1)*(e.shiftKey?.1:.02));}});
 update(split);
 return {set:update,get:()=>split,setLabels:(next)=>{labels=next;update(split);}};
}
const formatTime=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export class VideoPlayer {
 constructor(container,file,{title='MC-Sparse result',autoplay=true}={}) {
  this.container=container;
  this.alive=true;
  this.desired=autoplay&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  this.visible=false;
  this.seeking=false;
  this.error=false;
  this.buffering=false;
  this.events=new AbortController();
  container.innerHTML=`<div class="video-shell single-video"><div class="video-stage"><video data-method="ours" muted playsinline preload="metadata" poster="assets/posters/${file}.webp"><source src="assets/videos/${file}.mp4" type="video/mp4"></video><span class="method-label ours"><i class="label-dot"></i>MC-Sparse (Ours)</span></div><div class="controls"><button class="icon-button play-toggle" aria-label="Play video">${icons.play}</button><button class="icon-button restart" aria-label="Restart video">${icons.restart}</button><span class="time-display">00:00 / 00:00</span><input class="seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek video"><span class="playback-status" role="status" hidden></span><select class="speed-select" aria-label="Playback speed"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select><button class="icon-button fullscreen" aria-label="Fullscreen video">${icons.fullscreen}</button></div></div>`;
  this.shell=container.querySelector('.video-shell');
  this.video=container.querySelector('video');
  this.video.setAttribute('aria-label',`${title} — generated with MC-Sparse`);
  this.video.muted=true;
  this.range=container.querySelector('.seek');
  this.playButton=container.querySelector('.play-toggle');
  this.time=container.querySelector('.time-display');
  this.status=container.querySelector('.playback-status');
  const on=(target,event,callback)=>target.addEventListener(event,callback,{signal:this.events.signal});
  on(this.video,'loadedmetadata',()=>{
   this.duration=this.video.duration;
   this.shell.style.setProperty('--video-ratio',`${this.video.videoWidth} / ${this.video.videoHeight}`);
   this.updateTime();
  });
  on(this.video,'timeupdate',()=>this.updateTime());
  on(this.video,'play',()=>this.updateButton());
  on(this.video,'pause',()=>this.updateButton());
  on(this.video,'playing',()=>{this.buffering=false;this.setStatus('');this.updateButton();});
  on(this.video,'waiting',()=>{if(this.desired){this.buffering=true;this.setStatus('Loading…');this.updateButton();}});
  on(this.video,'canplay',()=>{this.buffering=false;if(this.desired)this.resume();else this.setStatus('');});
  on(this.video,'error',()=>this.showError());
  on(this.video.querySelector('source'),'error',()=>this.showError());
  on(this.video,'ended',()=>{if(this.desired){this.seek(0);this.resume();}});
  on(this.playButton,'click',()=>{
   if(this.error){this.error=false;this.shell.querySelector('.video-error')?.remove();this.desired=true;this.video.load();}
   else this.desired=!this.desired;
   if(this.desired)this.resume();else{this.setStatus('');this.pause();}
  });
  on(container.querySelector('.restart'),'click',()=>{this.seek(0);if(this.desired)this.resume();});
  on(this.range,'input',()=>{this.seeking=true;this.pause();this.seek(Number(this.range.value)/1000*(this.duration||0));});
  on(this.range,'change',()=>{this.seeking=false;if(this.desired)this.resume();});
  on(container.querySelector('.speed-select'),'change',e=>{this.video.playbackRate=Number(e.target.value);});
  on(container.querySelector('.fullscreen'),'click',async()=>{
   try{if(document.fullscreenElement)await document.exitFullscreen();else await this.shell.requestFullscreen();}
   catch{this.setStatus('Fullscreen unavailable');}
  });
  this.observer=new IntersectionObserver(entries=>{
   this.visible=entries[0].isIntersecting;
   if(this.visible){this.video.preload='auto';if(this.desired)this.resume();}
   else this.pause();
  },{threshold:.15});
  this.observer.observe(this.shell);
  on(document,'visibilitychange',()=>{if(document.hidden)this.pause();else if(this.visible&&this.desired)this.resume();});
  this.video.load();
 }
 setStatus(message){this.status.textContent=message;this.status.hidden=!message;}
 async resume(){
  if(!this.alive||!this.desired||this.seeking||!this.visible||document.hidden||this.error)return;
  if(this.video.readyState<3){this.buffering=true;this.setStatus('Loading…');this.updateButton();return;}
  if(this.starting)return;
  this.starting=true;
  try{
   await this.video.play();
   if(!this.alive)return;
   if(!this.desired||!this.visible||document.hidden||this.seeking)this.pause();
   else{this.buffering=false;this.setStatus('');}
  }catch(error){
   if(this.alive&&error.name!=='AbortError'){this.desired=false;this.setStatus('Press play');}
  }finally{this.starting=false;if(this.alive)this.updateButton();}
 }
 pause(){this.video.pause();this.updateButton();}
 updateButton(){
  const playing=this.desired&&this.visible&&!this.seeking&&!document.hidden&&!this.error;
  this.playButton.innerHTML=playing?icons.pause:icons.play;
  this.playButton.setAttribute('aria-label',playing?'Pause video':'Play video');
 }
 seek(time){
  if(Number.isFinite(time)&&this.video.readyState>=1)this.video.currentTime=Math.min(Math.max(0,time),Math.max(0,this.video.duration-.001));
  this.updateTime();
 }
 updateTime(){
  const t=this.video.currentTime||0,d=Number.isFinite(this.duration)?this.duration:0;
  this.time.textContent=`${formatTime(t)} / ${formatTime(d)}`;
  if(!this.seeking)this.range.value=d?t/d*1000:0;
  this.range.setAttribute('aria-valuetext',`${t.toFixed(1)} of ${d.toFixed(1)} seconds`);
 }
 showError(){
  if(!this.alive||this.error)return;
  this.error=true;this.desired=false;this.pause();this.setStatus('Load failed');
  const message=document.createElement('div');message.className='video-error';message.setAttribute('role','status');
  message.textContent='This video could not load. Press play to retry.';this.shell.append(message);
 }
 destroy(){
  this.alive=false;this.observer.disconnect();this.events.abort();this.video.pause();
  this.video.removeAttribute('src');this.video.querySelectorAll('source').forEach(s=>s.remove());this.video.load();this.container.innerHTML='';
 }
}
