"""Pinned public mirrors of creator-licensed CC0 assets; no repository code executed."""
from pathlib import Path
from urllib.parse import quote,urljoin
import urllib.request,json,hashlib,concurrent.futures
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public'/'assets';OUT.mkdir(parents=True,exist_ok=True)
SOURCES=[
 ('hero','HamaDler/sami-park-mayhem','bde25463aa73fb60041ec4d7695382e5e9d340a8','assets/characters/crowd/men/',['Adventurer.gltf']),
 ('nature','walterpalladino/godot-shaders','c1920d176ab5443ff386959969074fd0eef86c4e','assets/godot-shaders/models/Ultimate Stylized Nature/',['BirchTree_1.gltf','BirchTree_2.gltf','Bush_Large.gltf','Bush_Small.gltf']),
 ('creatures','mPhpMaster/wavebreak-godot-game','20062060002eb0c5beae1d4d763f0f24f4aa6def','assets/quaternius/big/',['Dino.gltf','Frog.gltf','Yeti.gltf','MushroomKing.gltf']),
 ('flying','mPhpMaster/wavebreak-godot-game','20062060002eb0c5beae1d4d763f0f24f4aa6def','assets/quaternius/flying/',['Dragon.gltf','Goleling_Evolved.gltf','Armabee.gltf'])]
manifest=[]
def download(url,path):
 path.parent.mkdir(parents=True,exist_ok=True)
 if not path.exists():path.write_bytes(urllib.request.urlopen(url,timeout=60).read())
 data=path.read_bytes();manifest.append({'path':str(path.relative_to(ROOT/'public')).replace('\\','/'),'source':url,'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'author':'Quaternius','license':'CC0-1.0'})
 return data
def asset(task):
 folder,repo,sha,base,name=task;url='https://raw.githubusercontent.com/'+repo+'/'+sha+'/'+quote(base+name);p=OUT/folder/name
 raw=download(url,p);g=json.loads(raw)
 if folder=='nature':
  for m in g.get('materials',[]):
   if 'Bark' in m.get('name',''):
    m['pbrMetallicRoughness'].pop('baseColorTexture',None);m.pop('normalTexture',None);m['pbrMetallicRoughness']['baseColorFactor']=[.43,.47,.37,1]
  # Only retain referenced images; bark textures are not needed by the game.
  used=set()
  for m in g.get('materials',[]):
   for d in [m,m.get('pbrMetallicRoughness',{})]:
    for k,v in d.items():
     if 'Texture' in k and isinstance(v,dict) and 'index' in v:used.add(g['textures'][v['index']]['source'])
  for i,im in enumerate(g.get('images',[])):
   if i not in used:im['uri']='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='
  p.write_text(json.dumps(g,separators=(',',':')))
 for entry in g.get('buffers',[])+g.get('images',[]):
  uri=entry.get('uri','')
  if uri and not uri.startswith('data:'):download(urljoin(url,quote(uri)),p.parent/uri)
 print(folder,name,'animations:',[a.get('name') for a in g.get('animations',[])],flush=True)
def main():
 tasks=[(folder,repo,sha,base,n) for folder,repo,sha,base,names in SOURCES for n in names]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(asset,tasks))
 for name,url in [('characters','https://raw.githubusercontent.com/HamaDler/sami-park-mayhem/bde25463aa73fb60041ec4d7695382e5e9d340a8/assets/characters/crowd/LICENSE.txt'),('creatures','https://raw.githubusercontent.com/mPhpMaster/wavebreak-godot-game/20062060002eb0c5beae1d4d763f0f24f4aa6def/assets/quaternius/License.txt')]:download(url,OUT/'licenses'/(name+'.txt'))
 for pack in ['ultimatestylizednature','ultimatemonsters','ultimatemodularcharacters']:
  p=ROOT/'research'/'licenses'/(pack+'.html');p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(urllib.request.urlopen('https://quaternius.com/packs/'+pack+'.html').read())
 (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
if __name__=='__main__':main()
