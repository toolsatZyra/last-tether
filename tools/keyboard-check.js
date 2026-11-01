async(page)=>{
 await page.waitForFunction(()=>window.__expedition);
 await page.reload();await page.waitForSelector('#begin',{state:'visible'});
 await page.locator('#begin').click();if(await page.locator('#confirm-new').isVisible())await page.locator('#confirm-new').click();
 await page.keyboard.down('w');await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');await page.waitForTimeout(2000);await page.keyboard.down('d');await page.waitForTimeout(1000);await page.keyboard.up('d');await page.waitForTimeout(3500);await page.keyboard.up('w');
 await page.keyboard.down('f');await page.waitForTimeout(4500);await page.keyboard.press('Shift');await page.waitForTimeout(3000);await page.keyboard.up('f');
 await page.screenshot({path:'output/playwright/keyboard-combat.png'});
 const combat=await page.evaluate(()=>window.__expedition.snapshot());
 await page.keyboard.press('Escape');const before=await page.evaluate(()=>window.__expedition.game.seconds);await page.waitForTimeout(1000);const after=await page.evaluate(()=>window.__expedition.game.seconds);
 return {combat,pauseFreezesTime:before===after,dialogVisible:await page.getByRole('dialog').isVisible(),soundOff:await page.evaluate(()=>!document.querySelector('#sound')?.checked)};
}
