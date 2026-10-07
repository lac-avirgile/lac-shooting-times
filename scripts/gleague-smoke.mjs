import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const url='http://127.0.0.1:4184/';
const server=spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'preview','--host','127.0.0.1','--port','4184','--strictPort'],{stdio:'ignore',windowsHide:true});
let browser;
try {
  let ready=false;
  for(let i=0;i<120;i++){
    try{if((await fetch(url)).ok){ready=true;break;}}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  assert(ready,'Preview server did not start');
  browser=await chromium.launch({channel:process.env.QA_BROWSER??'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1600,height:1000},acceptDownloads:true});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);
  await page.getByText('Roster & teams').first().click();
  const names=['Fletcher Loyer','Bradley Beal','Isaiah Jackson','Rui Hachimura','Jordan Miller','Darius Garland','Brandon Ingram','Derrick Jones Jr.'];
  for(const name of names)await page.getByLabel(`Team for ${name}`).selectOption('g-league');
  await page.getByRole('button',{name:'Save roster & teams'}).click();
  await page.reload();
  await page.getByRole('button',{name:'G League'}).click();
  await page.getByLabel('First shooting time').fill('15:00');
  await page.getByLabel('Game tip').fill('17:00');
  await page.getByLabel('Total court minutes').fill('60');
  for(let i=0;i<4;i++)for(let side=0;side<2;side++)await page.getByLabel(`Slot ${i+1} player ${side+1}`,{exact:true}).selectOption({label:names[i*2+side]});
  await page.getByLabel('Slot 1 player 2 treatment minutes').fill('30');
  assert.equal(await page.getByText('Complete before download').count(),0);
  assert((await page.locator('svg.pregame-graphic').textContent()).includes('2:15PM – 2:45PM'));
  await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL('../qa-output/gleague-preview.png',import.meta.url))});
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download PNG'}).click();
  const download=await downloadPromise;
  assert(download.suggestedFilename().includes('g-league_shooting-times.png'));
  assert.deepEqual(errors,[]);
  console.log('G League roster transfer, schedule, and PNG export passed.');
} finally {await browser?.close();server.kill();}
