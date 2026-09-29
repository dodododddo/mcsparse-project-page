import {teaser,videoGroups,metrics} from './data.js';
import {VideoPlayer} from './video-player.js';
import {VideoComparison} from './video-compare.js';
import {MeshGallery} from './mesh-viewer.js';
const $=s=>document.querySelector(s);
let hero,heroMode='split',sceneIndex=0,player;
function renderTeaser(){
 hero?.destroy();
 hero=heroMode==='split'
  ? new VideoComparison($('#hero-demo'),teaser.files,{title:teaser.name})
  : new VideoPlayer($('#hero-demo'),teaser.files.ours,{title:teaser.name});
 document.querySelectorAll('[data-teaser-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.teaserMode===heroMode));
 $('#teaser-caption-detail').textContent=heroMode==='split'?'Drag the divider to compare.':'Generated with MC-Sparse.';
}
document.querySelectorAll('[data-teaser-mode]').forEach(button=>button.addEventListener('click',()=>{heroMode=button.dataset.teaserMode;renderTeaser();}));
renderTeaser();
function renderGallery(){
 player?.destroy();
 const group=videoGroups[0],scene=group.scenes[sceneIndex];
 const gallery=$('#video-gallery');gallery.setAttribute('aria-labelledby','video-heading');
 gallery.innerHTML=`<div class="gallery-toolbar"><div><h3>${scene.name}</h3><p class="meta">${group.detail}</p></div><span class="video-collection-label">MC-Sparse results</span></div><div id="main-video-player"></div><p class="gallery-footnote"><span>Generated with MC-Sparse.</span><span>Original resolution · ${String(sceneIndex+1).padStart(2,'0')} / ${String(group.scenes.length).padStart(2,'0')}</span></p><div class="scene-strip" aria-label="Video scenes">${group.scenes.map((s,i)=>`<button class="scene-card ${i===sceneIndex?'active':''}" data-scene="${i}" aria-pressed="${i===sceneIndex}" aria-label="Show ${s.name}"><img src="assets/posters/${s.files.ours}.webp" alt="" loading="lazy"><span>${String(i+1).padStart(2,'0')} &nbsp; ${s.name}</span></button>`).join('')}</div>`;
 player=new VideoPlayer($('#main-video-player'),scene.files.ours,{title:scene.name});
 gallery.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>{sceneIndex=Number(b.dataset.scene);renderGallery();gallery.querySelector(`[data-scene="${sceneIndex}"]`).focus({preventScroll:true});}));
}
renderGallery();
const meshes=new MeshGallery($('#mesh-gallery'));
function renderMetrics(){const value=$('#results-model').value,m=metrics[value];$('#table-model-title').textContent=m.name;$('#table-setting').textContent=m.setting;$('#metrics-table').innerHTML=`<caption class="sr-only">${m.name} quantitative results from the paper</caption><thead><tr>${(m.headers||['Method','PSNR ↑','SSIM ↑','LPIPS ↓','Density ↓','Speedup ↑']).map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${m.rows.map(r=>`<tr class="${r[0].startsWith('MC-Sparse')?'ours-row':''}">${r.map((v,i)=>i===0?`<th scope="row">${v}</th>`:`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>`;}
$('#results-model').addEventListener('change',renderMetrics);renderMetrics();
window.addEventListener('pagehide',()=>{hero.pause();player?.pause();meshes.stop();});

const methodVideo=$('#method-explainer');
const methodChapterButtons=[...document.querySelectorAll('[data-method-time]')];
methodChapterButtons.forEach(button=>button.addEventListener('click',()=>{
 const start=Number(button.dataset.methodTime);
 methodVideo.currentTime=start===0?0:start+.5;
 methodVideo.play().catch(()=>methodVideo.focus());
}));
methodVideo.addEventListener('timeupdate',()=>{
 const chapter=[...methodChapterButtons].reverse().find(button=>methodVideo.currentTime>=Number(button.dataset.methodTime));
 methodChapterButtons.forEach(button=>{
  if(button===chapter)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');
 });
});
const methodVideoVisibility=new IntersectionObserver(entries=>{
 if(!entries[0].isIntersecting)methodVideo.pause();
},{threshold:.1});
methodVideoVisibility.observe(methodVideo);
document.addEventListener('visibilitychange',()=>{if(document.hidden)methodVideo.pause();});
