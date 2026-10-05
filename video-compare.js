import {VideoPlayer, dividerMarkup, setupDivider} from './video-player.js';

// Dense and Ours are packed into ONE frame: both sides share one decoder,
// playback clock and buffering state, including during seeking and looping.
export class VideoComparison extends VideoPlayer {
 constructor(container, files, options = {}) {
  if (!files.comparison) throw new Error('A paired comparison video is required.');
  super(container, files.comparison, options);
  this.shell.classList.add('teaser-compare', 'paired-comparison');
  this.shell.setAttribute('aria-label', options.title || 'Video comparison');
  this.video.setAttribute('aria-hidden', 'true');
  this.video.removeAttribute('poster');
  this.video.tabIndex = -1;
  const stage = container.querySelector('.video-stage');
  stage.classList.replace('video-stage', 'compare-stage');
  this.canvas = document.createElement('canvas');
  this.canvas.setAttribute('role', 'img');
  this.canvas.setAttribute('aria-label', 'Dense and MC-Sparse, synchronized frame comparison');
  stage.prepend(this.canvas);
  this.context = this.canvas.getContext('2d', {alpha: false});
  this.snapshot = document.createElement('canvas');
  this.snapshotContext = this.snapshot.getContext('2d', {alpha: false});
  this.split = .5;
  stage.insertAdjacentHTML('beforeend', '<span class="method-label">Dense</span>' + dividerMarkup('Dense and Ours video comparison', 'Drag to compare'));
  this.divider = setupDivider(stage, split => { this.split = split; this.draw(); });
  this.range.setAttribute('aria-label', 'Seek comparison');
  container.querySelector('.restart').setAttribute('aria-label', 'Restart comparison');
  container.querySelector('.fullscreen').setAttribute('aria-label', 'Fullscreen video comparison');
  const on = (target, event, callback) => target.addEventListener(event, callback, {signal: this.events.signal});
  on(this.video, 'loadedmetadata', () => {
   this.canvas.width = this.video.videoWidth / 2;
   this.canvas.height = this.video.videoHeight;
   this.snapshot.width = this.video.videoWidth;
   this.snapshot.height = this.video.videoHeight;
   this.shell.style.setProperty('--video-ratio', `${this.canvas.width} / ${this.canvas.height}`);
  });
  for (const event of ['loadeddata', 'seeked', 'pause', 'ended']) on(this.video, event, () => this.draw());
  this.poster = new Image();
  on(this.poster, 'load', () => { if (this.video.readyState < 2) this.drawPoster(); });
  this.poster.src = `assets/posters/${files.comparison}.webp`;
  this.renderFrame = () => {
   if (!this.alive) return;
   if (this.visible && !document.hidden) this.draw();
   this.scheduleFrame();
  };
  this.scheduleFrame();
  this.updateButton();
 }
 scheduleFrame() {
  if (this.video.requestVideoFrameCallback) this.frame = this.video.requestVideoFrameCallback(this.renderFrame);
  else this.frame = requestAnimationFrame(this.renderFrame);
 }
 drawPoster() {
  if (!this.poster?.naturalWidth) return;
  this.canvas.width = this.poster.naturalWidth / 2;
  this.canvas.height = this.poster.naturalHeight;
  this.snapshot.width = this.poster.naturalWidth;
  this.snapshot.height = this.poster.naturalHeight;
  this.snapshotContext.drawImage(this.poster, 0, 0);
  this.paintSnapshot();
 }
 draw() {
  if (!this.canvas || !this.alive) return;
  if (this.video.readyState < 2 || !this.video.videoWidth) { this.drawPoster(); return; }
  // Capture once before painting either side of the draggable divider.
  this.snapshotContext.drawImage(this.video, 0, 0, this.snapshot.width, this.snapshot.height);
  this.paintSnapshot();
 }
 paintSnapshot() {
  const width = this.canvas.width, height = this.canvas.height;
  if (!width || !height) return;
  this.context.drawImage(this.snapshot, width, 0, width, height, 0, 0, width, height);
  const left = Math.round(width * this.split);
  if (left) this.context.drawImage(this.snapshot, 0, 0, left, height, 0, 0, left, height);
 }
 updateButton() {
  super.updateButton();
  this.playButton.setAttribute('aria-label', this.playButton.getAttribute('aria-label').replace('video', 'comparison'));
 }
 destroy() {
  if (this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.frame);
  else cancelAnimationFrame(this.frame);
  super.destroy();
 }
}
