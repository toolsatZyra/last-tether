"""Download selected CC0 Quaternius assets from the creator's public Drive.
No account, paid service, browser playback or credentials are used.
"""
from pathlib import Path
import urllib.request, json, re, hashlib, concurrent.futures
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'assets';OUT.mkdir(parents=True,exist_ok=True)
EVIDENCE=ROOT/'research'/'licenses';EVIDENCE.mkdir(parents=True,exist_ok=True)
def listing(id):
    text=urllib.request.urlopen('https://drive.google.com/drive/folders/'+id).read().decode()
    raw=re.search(r"window\['_DRIVE_ivd'\] = '(.*?)';",text).group(1)
    return {f[2]:f[0] for f in json.loads(raw.encode().decode('unicode_escape'))[0]}
def fetch(item):
    folder,name,id=item;p=OUT/folder/name;p.parent.mkdir(parents=True,exist_ok=True)
    url='https://drive.google.com/uc?export=download&id='+id
    if not p.exists():
        try: data=urllib.request.urlopen(url).read()
        except Exception: data=urllib.request.urlopen('https://drive.usercontent.google.com/download?id='+id+'&export=download&authuser=0&confirm=t').read()
        if data[:20].lower().startswith(b'<!doctype html'):raise ValueError('Expected asset: '+name)
        p.write_bytes(data)
    data=p.read_bytes()
    print(folder+'/'+name,len(data),flush=True)
    return {'path':'assets/'+folder+'/'+name,'url':url,'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'author':'Quaternius','license':'CC0-1.0','retrieved':'2026-11-02'}
def main():
    tasks=[]
    packs=[('nature','1-ob9Aade1RIM3A_XKoQAOG6XqF2IDAIC',['BirchTree_1.gltf','BirchTree_1.bin','BirchTree_2.gltf','BirchTree_2.bin','BirchTree_Bark.jpg','BirchTree_Bark_Normal.png','BirchTree_Leaves.png','Bush_Large.gltf','Bush_Large.bin','Bush_Leaves.png','Bush_Small.gltf','Bush_Small.bin']),('creatures','1sOXLt5U3ofaujPlQRL11s4ub2UsqN8V8',['Dino.gltf','Frog.gltf','Yeti.gltf','MushroomKing.gltf','Atlas_Monsters.png']),('flying','1RDoNgoRYBNacHO-uRPfSxEgtc4U-EmaB',['Dragon.gltf','Goleling_Evolved.gltf','Armabee.gltf','Atlas_Monsters.png'])]
    for folder,id,names in packs:
        files=listing(id)
        tasks.extend((folder,name,files[name]) for name in names)
    tasks.extend([('licenses','monsters.txt','16GqsDGESyEOfRbc4dS7EqAwkIUSIW4_y'),('licenses','characters.txt','1TTvylHa1CsiJuHFWWiv6PFGhLM-aAH5z')])
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:manifest=list(pool.map(fetch,tasks))
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2))
    for pack in ['ultimatestylizednature','ultimatemonsters','ultimatemodularcharacters']:
        (EVIDENCE/(pack+'.html')).write_bytes(urllib.request.urlopen('https://quaternius.com/packs/'+pack+'.html').read())
if __name__=='__main__':main()
