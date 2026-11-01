"""Record the exact distributable files, with their original sources and modifications."""
from pathlib import Path
from urllib.parse import quote
import json,hashlib
root=Path(__file__).resolve().parents[1]
p=root/'public/assets/manifest.json'
entries=json.loads(p.read_text(encoding='utf-8'))
known={e['path']:e for e in entries}
base='https://raw.githubusercontent.com/walterpalladino/godot-shaders/c1920d176ab5443ff386959969074fd0eef86c4e/assets/godot-shaders/models/Ultimate%20Stylized%20Nature/Textures/'
for name in ['BirchTree_Leaves.png','Bush_Leaves.png']:
 known['assets/nature/Textures/'+name]={'path':'assets/nature/Textures/'+name,'source':base+name,'author':'Quaternius','license':'CC0-1.0'}
textures=[('stone.jpg','mossy_rock','diff','Rob Tuytel'),('stone-normal.jpg','mossy_rock','nor_gl','Rob Tuytel'),('floor-diff.jpg','monastery_stone_floor','diff','Amal Kumar'),('floor-nor_gl.jpg','monastery_stone_floor','nor_gl','Amal Kumar'),('floor-rough.jpg','monastery_stone_floor','rough','Amal Kumar')]
for name,asset,channel,author in textures:
 key='assets/materials/'+name
 known[key]={'path':key,'source':f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{asset}/{asset}_{channel}_1k.jpg','author':author,'license':'CC0-1.0','licenseSource':'https://polyhaven.com/a/'+asset}
known['assets/materials/sky.hdr']={'path':'assets/materials/sky.hdr','source':'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloppenheim_06_puresky_1k.hdr','author':'Greg Zaal and Jarod Guest','license':'CC0-1.0','licenseSource':'https://polyhaven.com/a/kloppenheim_06_puresky'}
for e in known.values():
 data=(root/'public'/e['path']).read_bytes()
 if 'sha256' in e and e['sha256']!=hashlib.sha256(data).hexdigest():e['originalDownloadSha256']=e['sha256']
 e['sha256']=hashlib.sha256(data).hexdigest();e['bytes']=len(data)
 if e['path'].startswith('assets/nature/') and e['path'].endswith('.gltf'):e['modifications']='Unused bark texture references removed; foliage materials restored in the runtime from the original pack textures.'
p.write_text(json.dumps(list(known.values()),indent=2)+'\n',encoding='utf-8')
print(f'{len(known)} licensed asset records; {sum(e["bytes"] for e in known.values())/1e6:.1f} MB total')
