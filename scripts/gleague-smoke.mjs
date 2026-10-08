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
  await page.getByRole('button',{name:'Roster Management'}).click();
  await page.getByLabel('Editor name').fill('QA Staff');
  const names=['Fletcher Loyer','Bradley Beal','Isaiah Jackson','Rui Hachimura','Jordan Miller','Darius Garland','Brandon Ingram','Derrick Jones Jr.'];
  for(const name of names)await page.getByLabel(`Team for ${name}`).selectOption('g-league');
  await page.locator('.team-tabs button').filter({hasText:'San Diego Clippers'}).click();
  for(const [index,name] of names.entries()){
    const row=page.locator('.roster-row').filter({has:page.locator('strong').filter({hasText:name})});
    await row.locator('.roster-player > summary').click();
    await row.getByLabel('Primary clinician').fill(index%2?'Gordon':'Lorin');
  }
  await page.getByRole('button',{name:'Save roster & teams'}).click();
  await page.reload();
  await page.getByRole('button',{name:'Roster Management'}).click();
  assert((await page.locator('.roster-history').textContent()).includes('QA Staff'));
  await page.getByRole('button',{name:'San Diego Clippers Creator'}).click();
  await page.getByLabel('San Diego opponent').selectOption({label:'Santa Cruz Warriors'});
  await page.getByLabel('San Diego home or away').selectOption('away');
  assert.equal(await page.getByLabel('San Diego venue').inputValue(),'Kaiser Permanente Arena');
  await page.getByLabel('San Diego venue').fill('Neutral Arena');
  await page.getByRole('button',{name:'Use suggested location'}).click();
  assert.equal(await page.getByLabel('San Diego venue').inputValue(),'Kaiser Permanente Arena');
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
  assert(download.suggestedFilename().includes('san-diego-clippers_shooting-times.png'));
  assert.equal(await page.locator('svg.pregame-graphic image[href="/assets/sandiego-clippers.svg"]').count(),1);
  await page.getByRole('button',{name:'LA Clippers Creator'}).click();
  await page.getByRole('button',{name:'Preview current roster example'}).click();
  assert.equal(await page.locator('#game select').count(),2);
  await page.locator('#game select').nth(0).selectOption('suns');
  await page.locator('#game select').nth(1).selectOption('away');
  assert.equal(await page.getByLabel('Venue',{exact:true}).inputValue(),'Mortgage Matchup Center');
  await page.getByLabel('Venue',{exact:true}).fill('Neutral Arena');
  await page.getByRole('button',{name:'Use suggested location'}).click();
  assert.equal(await page.getByLabel('Venue',{exact:true}).inputValue(),'Mortgage Matchup Center');
  assert.deepEqual(errors,[]);
  console.log('Roster history, both opponent selectors, venue overrides, and San Diego PNG export passed.');
} finally {await browser?.close();server.kill();}
