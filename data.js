export const teaser = {name: 'A day at the beach', files: {dense: 'new_dense', ours: 'new_ours', comparison: 'new_comparison'}};
export const videoGroups = [
  {id: 'minimax', label: 'MiniMax-H3', detail: 'MiniMax-H3-Base · 768p · Text-to-video', scenes: [
    {name: 'City lights', files: {ours: 'new_1'}},
    {name: 'Neon streets', files: {ours: 'new_2'}},
    {name: 'An afternoon stroll', files: {ours: 'new_3'}},
    {name: 'A duel in the rain', files: {ours: 'new_4'}}
  ]}
];
export const methods = {dense: 'Dense', ours: 'MC-Sparse (Ours)', pisa: 'PISA', sol: 'Sol-Attn'};
export const meshCases = [
  {id: 1, name: 'Winged guardian', shortName: 'Guardian'},
  {id: 2, name: 'Electric guitar', shortName: 'Guitar'},
  {id: 3, name: 'Sailing ship', shortName: 'Ship'},
  {id: 5, name: 'Armored warrior', shortName: 'Warrior'}
];
export const metrics = {
  minimax: {name:'MiniMax-H3-Base', setting:'768p · video branch · Table 1', rows:[['Full attention','—','—','—','100%','1.00×'],['Sol-Attn','23.66','0.816','0.234','32.4%','1.59×'],['PISA','23.45','0.811','0.243','30.0%','1.52×'],['MC-Sparse · 25%','28.44','0.899','0.161','25.0%','1.61×'],['MC-Sparse · 15%','27.30','0.882','0.176','15.0%','1.80×']]},
  hunyuan: {name:'HunyuanVideo-13B', setting:'720p · text-to-video · Table 1', rows:[['Full attention','—','—','—','100%','1.00×'],['Sol-Attn','28.06','0.898','0.159','32.3%','1.79×'],['PISA','27.65','0.890','0.174','30.0%','1.70×'],['MC-Sparse · 25%','32.89','0.940','0.114','25.0%','1.82×'],['MC-Sparse · 15%','30.78','0.919','0.135','15.0%','2.00×']]},
  'wan-t2v': {name:'Wan2.1-14B-T2V', setting:'720p · text-to-video · Table 1', rows:[['Full attention','—','—','—','100%','1.00×'],['SpargeAttn','23.56','0.828','0.212','30.0%','—'],['Sol-Attn','24.62','0.852','0.157','31.6%','1.52×'],['PISA','24.03','0.838','0.202','30.0%','1.52×'],['SVG2','26.02','0.875','0.166','31.5%','1.34×'],['SVG-EAR','27.61','0.897','0.142','25.3%','1.38×'],['MC-Sparse','28.81','0.912','0.128','25.0%','1.53×']]},
  'wan-i2v': {name:'Wan2.1-14B-I2V', setting:'720p · image-to-video · Table 1', rows:[['Full attention','—','—','—','100%','1.00×'],['SpargeAttn','26.66','0.859','0.172','30.0%','—'],['Sol-Attn','27.73','0.876','0.157','31.9%','1.51×'],['PISA','27.10','0.865','0.163','30.0%','1.51×'],['SVG2','27.15','0.861','0.168','30.4%','1.35×'],['SVG-EAR','30.71','0.916','0.127','24.6%','1.39×'],['MC-Sparse','32.11','0.929','0.117','25.0%','1.52×']]},
  geometry: {name:'3D generation', setting:'Image-to-geometry · Table 2', headers:['Method','CD ↓','Vol-IoU ↑','F1 ↑','Density ↓','Speedup ↑'], rows:[['Full attention','—','—','—','100%','1.00×'],['Sol-Attn','1.901','50.55','70.36','36.1%','1.57×'],['PISA','0.976','63.22','83.29','25.0%','< 1.87×'],['MC-Sparse','0.177','82.91','96.33','15.0%','2.32×']]}
};
