#!/usr/bin/env python3
"""Render the MC-Sparse method explainer with Pillow + FFmpeg. No generated footage.
Usage: python3 animation/render_method.py --output path.mp4 [--stills path] [--preview]
Fonts are selected locally; no font files are distributed.
"""
import argparse, math, os, random, subprocess, time
from pathlib import Path
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

W,H=1920,1080
S=W/1600
FPS=30
DURATION=48
BG='#fbfaf8'; INK='#29252f'; MUTED='#81758c'; PURPLE='#8059bb'; LIGHT='#eee7f5'; LINE='#e1d8e9'; TEAL='#5f9ea9'; ROSE='#b58dc7'; GOLD='#ad9e7a'; WHITE='#ffffff'
COLORS=[PURPLE,TEAL,ROSE,GOLD]
SCENES=[(0,5,'The idea'),(5,13,'Group queries'),(13,21,'Select tokens'),(21,28,'Cache the residual'),(28,39,'Reuse across steps'),(39,44,'Refresh'),(44,48,'MC-Sparse')]

def clamp(v): return max(0,min(1,v))
def ease(v): v=clamp(v);return v*v*(3-2*v)
def lerp(a,b,t): return a+(b-a)*t
def rgb(c): return tuple(int(c[i:i+2],16) for i in (1,3,5)) if isinstance(c,str) else c
def mix(a,b,t): return tuple(round(lerp(x,y,clamp(t))) for x,y in zip(rgb(a),rgb(b)))
def pt(p): return tuple(round(x*S) for x in p)

def fontpath(bold=False):
 env=os.environ.get('MCSPARSE_FONT_BOLD' if bold else 'MCSPARSE_FONT_REGULAR')
 candidates=[env] if env else []
 candidates += ['/System/Library/Fonts/Avenir Next.ttc'] if bold else ['/System/Library/Fonts/HelveticaNeue.ttc']
 candidates += ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
 for p in candidates:
  if p and Path(p).exists():return p
 raise RuntimeError('Set MCSPARSE_FONT_REGULAR and MCSPARSE_FONT_BOLD to local TTF/OTF paths.')
@lru_cache(maxsize=64)
def font(size,bold=False):return ImageFont.truetype(fontpath(bold),round(size*S),index=0)

class Canvas:
 def __init__(self):self.im=Image.new('RGB',(W,H),BG);self.d=ImageDraw.Draw(self.im)
 def box(self,xy,fill=WHITE,outline=None,r=16,width=1):self.d.rounded_rectangle(pt(xy),radius=round(r*S),fill=fill,outline=outline,width=max(1,round(width*S)))
 def line(self,points,fill=LINE,width=2):self.d.line([pt(p) for p in points],fill=fill,width=max(1,round(width*S)),joint='curve')
 def circle(self,x,y,r,fill=PURPLE,outline=None,width=1):self.d.ellipse(pt((x-r,y-r,x+r,y+r)),fill=fill,outline=outline,width=max(1,round(width*S)))
 def text(self,x,y,t,size=24,color=INK,bold=False,anchor='la'):
  self.d.text(pt((x,y)),t,font=font(size,bold),fill=color,anchor=anchor)
 def center(self,x,y,t,size=24,color=INK,bold=False):self.text(x,y,t,size,color,bold,'ma')
 def arrow(self,x1,y1,x2,y2,color=PURPLE,width=2,head=9,progress=1):
  x,y=lerp(x1,x2,progress),lerp(y1,y2,progress);self.line([(x1,y1),(x,y)],color,width)
  if progress>.98:
   a=math.atan2(y2-y1,x2-x1)
   self.line([(x-head*math.cos(a-.5),y-head*math.sin(a-.5)),(x,y),(x-head*math.cos(a+.5),y-head*math.sin(a+.5))],color,width)
 def pill(self,x,y,w,text,fill=LIGHT,color=PURPLE,size=18):
  self.box((x,y,x+w,y+38),fill,r=10);self.center(x+w/2,y+8,text,size,color)
 def header(self,num,title,subtitle):
  self.text(90,127,num,17,PURPLE,True);self.text(90,163,title,49,INK,True);self.text(92,234,subtitle,23,MUTED)
 def footer(self,t):
  self.text(90,848,'MC-Sparse',18,INK,True)
  self.text(246,851,'Schematic illustration · Not measured attention values',13,MUTED)
  self.text(1510,847,f'{int(t):02d} / 48',16,MUTED,anchor='ra')
  self.box((90,818,1510,821),LINE,r=1)
  self.box((90,818,90+1420*clamp(t/DURATION),821),PURPLE,r=1)
  for i,(a,b,name) in enumerate(SCENES[1:6]):
   x=90+i*286;active=a<=t<b
   self.circle(x+4,68,4,PURPLE if active else '#cdc1d8')
   self.text(x+18,57,name,17,PURPLE if active else MUTED,active)
 def caption(self,main,minor=None):
  self.center(800,726,main,27,INK,True)
  if minor:self.center(800,767,minor,18,MUTED)

rng=random.Random(17)
scatter=[]
for i in range(24):
 x=174+(i%6)*83+rng.uniform(-13,13);y=333+(i//6)*67+rng.uniform(-10,10)
 scatter.append((x,y))
order=list(range(24));rng.shuffle(order)

def packets(c,start,end,phase,color=PURPLE,n=4):
 c.line([start,end],mix(LINE,color,.25),2)
 for j in range(n):
  v=(phase+j/n)%1;x=lerp(start[0],end[0],v);y=lerp(start[1],end[1],v)
  c.circle(x,y,5,color)

def intro(c,u):
 c.pill(90,135,292,'META-CACHED SPARSE ATTENTION',size=14)
 c.text(90,198,'MC-Sparse',91,INK,True)
 c.text(90,319,'Select tokens precisely.',43,INK,True)
 c.text(90,375,'Reuse across many steps.',43,INK,True)
 c.text(92,470,'Training-free acceleration for',24,MUTED)
 c.text(92,507,'video and 3D generation.',24,MUTED)
 c.pill(91,585,326,'Fine selection. Extended reuse.',size=18)
 # One anchor caches selections, then the same metadata flows to many steps.
 c.box((893,172,1440,644),WHITE,LINE,24)
 c.text(934,208,'SELECT ONCE AT AN ANCHOR',17,PURPLE,True)
 for row in range(4):
  for col in range(12):
   selected=col in [1,4+row%2,9]
   colr=COLORS[row] if selected else LIGHT
   pulse=.85+.15*math.sin(u*2-col*.1)
   c.box((939+col*37,262+row*37,965+col*37,288+row*37),mix(WHITE,colr,pulse),r=5)
 c.arrow(1170,425,1170,466,color='#b59acb')
 c.pill(964,477,403,'Query groups + KV indices + residual',size=17)
 c.text(934,560,'REUSE',17,MUTED,True)
 for j in range(9):
  x=1058+j*36;c.circle(x,571,9,mix(WHITE,PURPLE,.24+.76*clamp((u-1.8)*3-j*.22)))
 c.caption('Accurate, token-level selection — amortized across denoising steps.')

def grouping(c,u):
 c.header('01 / ANCHOR STEP','Group similar queries.','Fast PDDP forms equal-size groups aligned with GPU query tiles.')
 c.text(128,294,'QUERIES',17,MUTED,True);c.text(879,294,'TILE-ALIGNED GROUPS',17,MUTED,True)
 progress=ease((u-1)/3.5)
 for row in range(4):
  y=333+row*66
  c.box((873,y-12,1466,y+40),mix(BG,WHITE,progress),mix(BG,LINE,progress),12)
  c.text(1387,y+3,f'G{row+1}',18,mix(BG,COLORS[row],progress),True)
 for i in range(24):
  row=i//6;col=i%6;sx,sy=scatter[order[i]];ex=916+col*70;ey=348+row*66
  stagger=ease((u-1-row*.17)/3.1)
  x=lerp(sx,ex,stagger);y=lerp(sy,ey,stagger)
  # A quiet trail connects the old and new positions.
  if .1<stagger<.94:c.line([(sx,sy),(x,y)],mix(BG,COLORS[row],.14),1)
  c.circle(x,y,15,COLORS[row]);c.circle(x-3,y-4,4,mix(WHITE,COLORS[row],.65))
 c.arrow(704,446,808,446,mix(LINE,PURPLE,.6),3)
 c.text(132,616,'Color indicates query similarity.',19,MUTED)
 c.pill(896,614,340,'Each group shares a KV selection',size=17)
 c.caption('Similar queries share a selection. Every group fills a tile.','Illustrated group size only; actual groups match the kernel tile size.')

SCORES=[.20,.88,.12,.34,.29,.72,.16,.41,.19,.11,.91,.25,.37,.15,.78,.26]
SELECT=[1,5,10,14]
def selection(c,u):
 c.header('02 / ANCHOR STEP','Select individual KV tokens.','Rank exact attention mass aggregated over each query group.')
 c.box((102,303,1498,666),WHITE,LINE,20)
 c.text(137,325,'ONE QUERY GROUP',15,MUTED,True)
 c.pill(132,365,155,'Query group G',size=18)
 c.arrow(311,433,375,433,'#bfa8d6',2)
 c.text(410,327,'EXACT ATTENTION MASS',16,MUTED,True)
 reveal=ease((u-.4)/1.8);choose=ease((u-2)/1.5)
 base=555
 for j,v in enumerate(SCORES):
  x=412+j*63;selected=j in SELECT
  col=mix('#dcd2e8',PURPLE,choose) if selected else mix('#dcd2e8','#ece6f1',choose)
  h=176*v*reveal
  c.box((x,base-h,x+35,base),col,r=6)
  c.box((x,574,x+35,609),mix(LIGHT,WHITE,choose) if not selected else mix(LIGHT,PURPLE,choose),r=6)
  c.center(x+17,580,str(j),15,WHITE if selected and choose>.5 else MUTED)
 for j in range(3):
  x=412+(j+1)*4*63-14
  c.line([(x,371),(x,621)],LINE,1)
  c.center(412+j*252+106,634,f'Block {j+1}',13,MUTED)
 c.center(1274,634,'Block 4',13,MUTED)
 if u>4.1:
  alpha=ease((u-4.1)/.6)
  c.pill(103,679,509,'Cache KV indices: [ 1, 5, 10, 14 ]',mix(BG,LIGHT,alpha),mix(BG,PURPLE,alpha),19)
 c.caption('Keep the top-K tokens, even across block boundaries.','Purple: selected tokens   ·   Pale: discarded tokens   ·   Example budget: K = 4')

DENSE=[.71,.64,.75,.85,.58,.82,.61,.69,.78,.49,.81,.67,.59,.77,.68,.89]
SPARSE=[.66,.56,.72,.79,.51,.75,.57,.61,.71,.42,.77,.59,.52,.7,.65,.81]

def heat(c,x,y,vals,color=PURPLE,size=38,gap=8,progress=1):
 for i,v in enumerate(vals):
  xx=x+(i%4)*(size+gap);yy=y+(i//4)*(size+gap)
  c.box((xx,yy,xx+size,yy+size),mix(WHITE,color,v*progress),r=7)

def residual(c,u):
 c.header('03 / ANCHOR STEP','Cache the output difference.','Even low-weight discarded tokens contribute to the attention output.')
 xs=[209,693,1177]
 for x,label in zip(xs,['Dense output','Sparse output','Cached residual R']):
  c.center(x+88,325,label,24,INK,True)
 a=ease((u-.3)/1);b=ease((u-1)/1);d=ease((u-2)/1.2)
 heat(c,xs[0],384,DENSE,progress=a)
 heat(c,xs[1],384,SPARSE,progress=b)
 heat(c,xs[2],384,[(x-y)*6 for x,y in zip(DENSE,SPARSE)],ROSE,progress=d)
 c.center(540,435,'−',65,'#b29bc8');c.center(1025,435,'=',54,'#b29bc8')
 c.pill(198,593,192,'O_dense',size=20);c.pill(682,593,192,'O_sparse',size=20);c.pill(1148,593,248,'R_anchor',fill='#f3eaf6',color='#a077b0',size=20)
 c.caption('R_anchor = O_dense − O_sparse','Store the residual together with query groups and selected KV indices.')

def cached_header(c,refresh=0):
 c.box((152,295,1448,400),mix(WHITE,LIGHT,refresh*.7),LINE,18)
 c.text(181,316,'CACHED AT ANCHOR',14,PURPLE,True)
 for x,w,label in [(420,246,'Query groups'),(710,246,'KV indices'),(1000,397,'Output residual R')]:c.pill(x,328,w,label,fill=mix(LIGHT,'#d5c1eb',refresh),size=21)

def reuse(c,u):
 c.header('04 / REUSE STEPS','Reuse the selection. Recompute the attention.','The same cached metadata serves many subsequent denoising steps.')
 cached_header(c)
 current=min(8,int(max(0,u-.7)/1.15));phase=(max(0,u-.7)/1.15)%1
 # Current Q K V are separate from cached metadata.
 c.text(107,446,f'FRESH AT STEP t + {current+1}',16,TEAL,True)
 for i,ch in enumerate(['Q','K','V']):
  x=105+i*92;c.box((x,486,x+74,554),mix('#f0f7f7','#d7eeef',.5+.4*math.sin(phase*math.pi)),outline='#bcdadd',r=12)
  c.center(x+37,498,ch,29,TEAL,True)
  for j in range(3):c.circle(x+19+j*18,542,3,mix(TEAL,WHITE,.2+((j+current)%3)*.2))
 c.box((486,467,869,579),PURPLE,r=18)
 c.center(677,488,'Sparse attention',30,WHITE,True)
 c.center(677,535,'Current Q, K, V · cached selection',15,'#eee2fa')
 packets(c,(381,521),(477,521),phase,TEAL,2)
 c.line([(543,400),(543,449)],'#bc9dd8',2);c.arrow(543,426,543,457,'#bc9dd8',2)
 c.line([(833,400),(833,450)],'#bc9dd8',2);c.arrow(833,426,833,457,'#bc9dd8',2)
 c.circle(1096,522,31,WHITE,LINE,2);c.center(1096,496,'+',40,PURPLE)
 packets(c,(875,522),(1051,522),phase,PURPLE,3)
 c.line([(1190,400),(1190,435),(1096,435),(1096,481)],'#bc9dd8',2);c.arrow(1096,450,1096,481,'#bc9dd8',2)
 c.box((1270,481,1480,562),WHITE,LINE,15);c.center(1375,497,'Output',28,INK,True)
 packets(c,(1135,522),(1256,522),phase,PURPLE,2)
 # Stable anchor and reusable steps.
 c.text(112,618,'DENOISING STEPS',14,MUTED,True)
 c.line([(358,657),(1471,657)],LINE,3)
 for j in range(10):
  x=379+j*119
  if j==0:c.box((x-16,641,x+16,673),PURPLE,r=7);c.center(x,690,'anchor',13,PURPLE)
  else:
   active=j==current+1
   c.circle(x,657,16 if active else 10,TEAL if active else mix(WHITE,TEAL,.35))
   if active:c.circle(x,657,23,None,'#bedddf',2)
   c.center(x,690,f't+{j}',13,TEAL if active else MUTED)
 c.caption('Fresh Q, K, V at every step. Same cache until the next anchor.','Output_t = SparseAttention(Q_t, K_t, V_t; cached groups & indices) + R_anchor')

def refresh(c,u):
 c.header('05 / NEXT ANCHOR','Refresh. Then reuse again.','Update query groups, KV indices, and the residual at scheduled anchor steps.')
 c.line([(189,442),(1419,442)],LINE,4)
 xs=[210+i*112 for i in range(11)];active=6 if u>1.4 else min(5,int(u*3))
 for i,x in enumerate(xs):
  anchor=i in [0,6]
  if anchor:
   fill=PURPLE if i==0 or u>1.4 else '#dbcbe9';c.box((x-23,419,x+23,465),fill,r=9)
   c.center(x,485,'Anchor',18,PURPLE,True)
  else:c.circle(x,442,12,TEAL if i<active or u>2.8 else '#dae8e8')
  if i==6 and u>1.4:c.circle(x,442,37,None,mix(LIGHT,PURPLE,.35+.2*math.sin(u*3)),2)
 c.pill(239,341,453,'Reuse cached metadata',size=21)
 c.pill(949,341,453,'Reuse refreshed metadata',size=21)
 if u>1.4:
  c.arrow(xs[6],520,xs[6],558,PURPLE)
  c.box((467,567,1297,650),WHITE,LINE,r=16)
  c.center(882,591,'Refresh groups + token indices + residual',25,PURPLE,True)
 c.caption('Exact work at anchors. Fast token-sparse attention between them.','Illustrative schedule; refresh intervals depend on the generation setting.')

def closing(c,u):
 c.pill(90,142,173,'MC-SPARSE',size=19)
 c.text(90,223,'Select tokens precisely.',59,INK,True)
 c.text(90,306,'Reuse across many steps.',59,INK,True)
 for i,(title,desc) in enumerate([('01  Fine-grained','Individual KV tokens'),('02  Exact','Attention-mass selection'),('03  Reusable','Cached metadata + residual')]):
  x=92+i*482;c.box((x,460,x+452,624),WHITE,LINE,20)
  c.text(x+29,487,title,29,PURPLE,True);c.text(x+29,546,desc,21,MUTED)
 c.caption('Training-free acceleration for video and 3D generation.','Meta-Cached Sparse Attention')

FUNCS=[intro,grouping,selection,residual,reuse,refresh,closing]
def render_scene(i,t):
 c=Canvas();FUNCS[i](c,max(0,t-SCENES[i][0]));return c

def frame(t):
 i=max(k for k,s in enumerate(SCENES) if t>=s[0])
 c=render_scene(i,t)
 # Fade through the paper background so labels never overlap between chapters.
 if i>0 and t-SCENES[i][0]<.42:
  elapsed=t-SCENES[i][0];paper=Image.new("RGB",(W,H),BG)
  if elapsed<.21:
   previous=render_scene(i-1,SCENES[i][0]-.01)
   c.im=Image.blend(previous.im,paper,ease(elapsed/.21))
  else:c.im=Image.blend(paper,c.im,ease((elapsed-.21)/.21))
  c.d=ImageDraw.Draw(c.im)
 c.footer(t)
 return c.im

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,default=Path('mc-sparse-method.mp4'));ap.add_argument('--stills',type=Path);ap.add_argument('--preview',action='store_true');args=ap.parse_args()
 if args.stills:
  args.stills.mkdir(parents=True,exist_ok=True)
  for t in [2.5,6,10.5,17.5,25,32,36.5,42,46]:frame(t).save(args.stills/f'frame-{t:04.1f}.png')
  frame(2.5).save(args.stills/'poster.webp',quality=92)
  print('Preview frames saved.',flush=True)
 if args.preview:return
 args.output.parent.mkdir(parents=True,exist_ok=True)
 command=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-an','-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart','-metadata','title=MC-Sparse: Select tokens precisely. Reuse across many steps.','-metadata','comment=Schematic method animation; not measured attention values.',str(args.output)]
 process=subprocess.Popen(command,stdin=subprocess.PIPE)
 start=time.time()
 try:
  for n in range(FPS*DURATION):
   process.stdin.write(frame(n/FPS).tobytes())
   if n%150==0:print(f'Rendered {n}/{FPS*DURATION} frames ({time.time()-start:.1f}s)',flush=True)
  process.stdin.close();code=process.wait()
  if code:raise RuntimeError(f'FFmpeg exited with {code}')
 except BaseException:
  process.kill();raise
 print(f'Saved {args.output} ({args.output.stat().st_size/1024**2:.2f} MiB)',flush=True)
if __name__=='__main__':main()
