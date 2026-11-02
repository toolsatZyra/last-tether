async(page)=>{await page.screenshot({path:'output/playwright/cache-normal-ending.png'});return{ending:await page.locator('#ending').isVisible()};}
