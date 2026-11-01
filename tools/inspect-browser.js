async (page) => {
 await page.waitForFunction(()=>window.__expedition);
 return await page.evaluate(()=>{const a=window.__expedition;return{state:a.snapshot(),physics:!!a.view.physics.controller,materials:a.view.hero.meshes.slice(0,5).map(m=>({name:m.name,mat:m.material?.name,color:m.material?.albedoColor})),skeleton:a.view.hero.nodes.map(n=>n.name).filter(n=>/Wrist/.test(n))};});
 await page.screenshot({path:'output/playwright/rebuild-game.png'});
}
