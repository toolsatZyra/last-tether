async (page) => {
 await page.waitForFunction(()=>window.__expedition);
 await page.evaluate(()=>{const a=window.__expedition;a.start('story');a.pause();a.close();});
 await page.waitForTimeout(6000);
 await page.screenshot({path:'output/playwright/rebuild-opening-v2.png'});
 return await page.evaluate(()=>window.__expedition.snapshot());
}
