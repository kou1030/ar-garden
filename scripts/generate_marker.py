from PIL import Image, ImageDraw
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'assets'
# Deliberately asymmetric 16x16 pixel sigil, readable at the detector resolution.
im=Image.new('RGB',(16,16),'white'); d=ImageDraw.Draw(im)
d.polygon([(3,1),(6,4),(3,7),(1,4)],fill='black')
d.rectangle((7,6,8,14),fill='black')
d.polygon([(8,9),(9,3),(14,2),(14,6),(11,9)],fill='black')
d.polygon([(7,12),(2,11),(1,8),(5,8),(7,10)],fill='black')
d.rectangle((11,12,14,14),fill='black')
im.resize((512,512),Image.Resampling.NEAREST).save(p/'garden-symbol.png')
full=Image.new('RGB',(1000,1000),'white');draw=ImageDraw.Draw(full);draw.rectangle((100,100,899,899),fill='black');full.paste(im.resize((400,400),Image.Resampling.NEAREST),(300,300));full.save(p/'garden-marker.png')
blocks=[]
for angle in (0,90,180,270):
 r=im.rotate(angle)
 blocks.append('\n'.join(' '.join(f'{r.getpixel((x,y))[c]:3d}' for x in range(16)) for c in (2,1,0) for y in range(16)))
(p/'garden.patt').write_text('\n\n'.join(blocks)+'\n',encoding='ascii')
assert len((p/'garden.patt').read_text().split())==3072
print('Marker: 4 orientations, BGR, 16x16; border ratio .5; 3072 values verified')

