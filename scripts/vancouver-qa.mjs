import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4185/';
const server=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'preview','--host','127.0.0.1','--port','4185','--strictPort'],{stdio:'ignore',windowsHide:true});
let browser;
try {
  let ready=false;
  for(let i=0;i<120;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
  assert(ready,'Preview server did not start');
  browser=await chromium.launch({channel:process.env.QA_BROWSER??'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1920,height:1200},acceptDownloads:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);
  await page.getByRole('button',{name:'Load Oct 10 Vancouver game'}).click();
  const graphic=page.locator('svg.pregame-graphic');
  const words=await graphic.textContent();
  assert(words.includes('ROGERS ARENA')||words.includes('Rogers Arena'));
  for(const name of ['JAHMYL','JOANN','JASEN','JESSE','COLBY'])assert(words.toUpperCase().includes(name));
  for(const name of ['MAGGIE','LORIN','DRAFT'])assert(!words.toUpperCase().includes(name));
  assert.equal(await graphic.locator('path[fill="url(#panel)"][opacity="0.78"]').count(),9);
  assert.equal(await page.locator('.diagnostics.has-errors').count(),0);
  const output=fileURLToPath(new URL('../qa-output/2026-10-10_at_raptors_pregame-workout.png',import.meta.url));
  await mkdir(fileURLToPath(new URL('../qa-output/',import.meta.url)),{recursive:true});
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download PNG'}).click();
  const download=await downloadPromise;
  assert.equal(download.suggestedFilename(),'2026-10-10_at_raptors_pregame-workout.png');
  await download.saveAs(output);
  for(const [name,file] of [['Original · Operations','original'],['1 · Clean','clean'],['2 · Sidebar','sidebar']]){
    await page.getByRole('button',{name,exact:true}).click();
    await graphic.screenshot({path:fileURLToPath(new URL(`../qa-output/2026-10-10_${file}-preview.png`,import.meta.url))});
  }
  const source=await page.locator('#raw-text').inputValue();
  await page.locator('#raw-text').fill(`Initial shooting times for tomorrow. Let me know if this works for medical pairings.\n\n${source}\n\n--> DG will be with Joann; Jahmyl with Jesse; Yuki with Dan; DJ and Keaton with Jasen. Maggie and Lorin are not on this trip; Blake goes to Colby.`);
  await page.getByRole('button',{name:'Parse Schedule'}).click();
  assert((await page.locator('svg.pregame-graphic').textContent()).includes('Rogers Arena'));
  assert.equal(await page.locator('.diagnostics.has-errors').count(),0);
  assert.deepEqual(errors,[]);
  console.log(`PASS: Vancouver schedule graphic and PNG saved to ${output}`);
}finally{await browser?.close();server.kill();}
