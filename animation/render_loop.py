#!/usr/bin/env python3
"""Render a compact, eight-second MC-Sparse loop with Pillow.
No video player or external image assets. Use --output-dir to choose the destination.
"""
from pathlib import Path
from functools import lru_cache
import argparse, math, os
from PIL import Image, ImageDraw, ImageFont

BG='#fbfaf8'; INK='#322c3a'; MUTED='#93849f'; PURPLE='#8761bb'; PALE='#e9e0f2'; TEAL='#71a4ab'; BORDER='#ddd1e7'; WHITE='#ffffff'
SCALE=1.35
FRAMES=100
DURATION_MS=80

def blend(a,b,t):
 t=max(0,min(1,t));a=tuple(int(a[i:i+2],16) for i in (1,3,5));b=tuple(int(b[i:i+2],16) for i in (1,3,5))
 return tuple(round(x+(y-x)*t) for x,y in zip(a,b))
def ease(t):t=max(0,min(1,t));return t*t*(3-2*t)
def lerp(a,b,t):return a+(b-a)*t
@lru_cache(None)
def font(size,bold=False):
 env=os.environ.get('MCSPARSE_FONT_BOLD' if bold else 'MCSPARSE_FONT_REGULAR')
 choices=[env] if env else []
 choices+=['/System/Library/Fonts/Avenir Next.ttc' if bold else '/System/Library/Fonts/HelveticaNeue.ttc','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
 for p in choices:
  if Path(p).exists():return ImageFont.truetype(p,round(size*SCALE),index=0)
 raise RuntimeError('Set MCSPARSE_FONT_REGULAR and MCSPARSE_FONT_BOLD to local font paths.')
class Canvas:
 def __init__(self,mobile=False):
  self.mobile=mobile;self.im=Image.new('RGB',tuple(round(v*SCALE) for v in ((1120,310) if not mobile else (350,868))),BG);self.d=ImageDraw.Draw(self.im)
 def p(self,vals):return tuple(round(v*SCALE) for v in vals)
 def text(self,x,y,text,size=17,color=INK,bold=False,anchor='la'):self.d.text(self.p((x,y)),text,font=font(size,bold),fill=color,anchor=anchor)
 def box(self,x,y,w,h,fill=WHITE,outline=None,r=8,width=1):self.d.rounded_rectangle(self.p((x,y,x+w,y+h)),radius=round(r*SCALE),fill=fill,outline=outline,width=round(width*SCALE))
 def line(self,points,color=BORDER,width=1):self.d.line([self.p(p) for p in points],fill=color,width=max(1,round(width*SCALE)),joint='curve')
 def dot(self,x,y,r,color=PURPLE,outline=None):self.d.ellipse(self.p((x-r,y-r,x+r,y+r)),fill=color,outline=outline,width=round(SCALE))
 def arrow(self,x1,y1,x2,y2):
  self.line([(x1,y1),(x2,y2)],BORDER,1.5);a=math.atan2(y2-y1,x2-x1);self.line([(x2-7*math.cos(a-.5),y2-7*math.sin(a-.5)),(x2,y2),(x2-7*math.cos(a+.5),y2-7*math.sin(a+.5))],BORDER,1.5)
 def title(self,x,y,n,title):self.text(x,y,n,12,PURPLE,True);self.text(x+26,y-5,title,22,INK,True)

def frame(t,mobile=False):
 c=Canvas(mobile);reset=1-ease((t-7.3)/.7)
 a=(20,23);b=(419,23);d=(809,23)
 if mobile:a=(20,21);b=(20,307);d=(20,598)
 # 1. Similar query tokens group, exact top-K KV tokens are retained.
 x,y=a;c.title(x,y,'01','Select precisely')
 c.text(x,y+42,'Similar queries',13,MUTED)
 q=ease(t/1.0)*reset
 for i in range(8):
  group=i%2;start_x=x+15+i*29;end_x=x+15+(i//2)*29+group*146
  yy=y+75+lerp((-1)**i*8,0,q)
  c.dot(lerp(start_x,end_x,q),yy,7,PURPLE if group==0 else TEAL)
 c.text(x,y+109,'Exact attention mass',13,MUTED)
 values=[.22,.86,.16,.39,.72,.24,.13,.91,.37,.28,.77,.17];keep=[1,4,7,10]
 selected=ease((t-.9)/.9)*reset
 for i,v in enumerate(values):
  xx=x+2+i*24;h=v*52
  color=blend(PALE,PURPLE,selected) if i in keep else PALE
  c.box(xx,y+184-h,16,h,color,r=3)
  c.box(xx,y+194,16,15,color,r=3)
 c.text(x,y+230,'Individual tokens · exact top-K',14,PURPLE)
 # 2. Save groups, indices and the output residual at the anchor.
 x,y=b;c.title(x,y,'02','Cache at the anchor')
 cached=ease((t-2)/.7)*reset
 for row,label in enumerate(['Query groups','KV indices','Residual R']):
  yy=y+57+row*51
  c.box(x,yy,288,40,fill=blend(BG,WHITE,cached*.65+.35),outline=BORDER,r=8)
  c.text(x+13,yy+10,label,16,MUTED)
  if row==0:
   for j in range(5):c.dot(x+187+j*17,yy+20,4,blend(PALE,PURPLE,cached))
  elif row==1:
   for j,n in enumerate([1,4,7,10]):c.text(x+177+j*25,yy+11,str(n),14,blend(PALE,PURPLE,cached))
  else:c.text(x+189,yy+10,'Δ output',14,blend(PALE,PURPLE,cached))
 c.text(x,y+230,'R = O_dense − O_sparse',14,PURPLE)
 # 3. Same selection and residual across multiple steps, fresh current inputs.
 x,y=d;c.title(x,y,'03','Reuse across steps')
 c.text(x,y+42,'Fresh Q / K / V',14,TEAL)
 c.box(x,y+74,289,54,fill='#f2edf8',outline='#e3d7ef',r=9)
 c.text(x+144.5,y+90,'Sparse attention + R',19,PURPLE,True,anchor='ma')
 c.line([(x+14,y+168),(x+272,y+168)],BORDER,2)
 active=int(max(0,t-2.9)/1.08)
 for i in range(4):
  xx=x+26+i*79
  reached=t>=2.9+i*1.08;current=active==i and 2.9<=t<7.3
  color=blend(PALE,TEAL,reset if reached else .05)
  c.dot(xx,y+168,9,color)
  if current:
   pulse=1+math.sin((t-2.9-i*1.08)*math.pi/1.08)*.4
   c.dot(xx,y+168,14*pulse,None,'#cfdee1')
   c.dot(x+145,y+65,4,TEAL)
  c.text(xx,y+189,f't+{i+1}',13,TEAL if reached else MUTED,anchor='ma')
 c.text(x,y+230,'Reuse until the next anchor',14,PURPLE)
 # Arrows between the three stages; no container or player chrome.
 if mobile:
  c.arrow(165,286,165,301);c.arrow(165,574,165,590)
 else:
  c.arrow(341,160,393,160);c.arrow(730,160,781,160)
  # A single subtle transfer dot indicates caching once per loop.
  if 1.8<t<2.6:
   c.dot(lerp(341,393,ease((t-1.8)/.8)),160,4,PURPLE)
  if 2.6<t<3.2:
   c.dot(lerp(730,781,ease((t-2.6)/.6)),160,4,PURPLE)
 return c.im

def palette():
 colors=[]
 for end in [PURPLE,PALE,TEAL,MUTED,INK,WHITE,BORDER,'#f2edf8','#e3d7ef','#cfdee1']:
  for i in range(24):colors.extend(blend(BG,end,i/23))
 colors.extend([*tuple(int(BG[i:i+2],16) for i in (1,3,5))]*16)
 p=Image.new('P',(1,1));p.putpalette(colors[:768]);return p

def save(out,mobile=False):
 suffix='-mobile' if mobile else ''
 frames=[frame(i*.08,mobile) for i in range(FRAMES)]
 path=out/f'method-loop{suffix}.webp'
 frames[0].save(path,save_all=True,append_images=frames[1:],duration=DURATION_MS,loop=0,quality=85,method=6,minimize_size=True)
 frame(5,mobile).save(out/f'method-loop{suffix}-still.webp',quality=92,method=6)
 if not mobile:
  pal=palette();gifframes=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
  gifframes[0].save(out/'method-loop.gif',save_all=True,append_images=gifframes[1:],duration=DURATION_MS,loop=0,optimize=True,disposal=1)
 print(path.name,round(path.stat().st_size/1024),'KiB',flush=True)

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--output-dir',type=Path,default=Path('assets/figures'));args=parser.parse_args();args.output_dir.mkdir(parents=True,exist_ok=True)
 save(args.output_dir);save(args.output_dir,True)
if __name__=='__main__':main()
