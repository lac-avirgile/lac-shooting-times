import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const out = new URL('../qa-output/', import.meta.url);
await mkdir(out, { recursive: true });
const baseUrl = process.env.QA_URL ?? 'http://127.0.0.1:4183/';
const server = process.env.QA_URL ? null : spawn(process.execPath,[fileURLToPath(new URL('../node_modules/vite/bin/vite.js',import.meta.url)),'preview','--host','127.0.0.1','--port','4183','--strictPort'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
let serverOutput='';
server?.stdout.on('data',data=>{serverOutput+=data;});
server?.stderr.on('data',data=>{serverOutput+=data;});
if (server) {
  let ready=false;
  // Allow slow local process/file startup without relaxing any graphic assertions.
  for(let attempt=0;attempt<480;attempt++) {
    try {const response=await fetch(baseUrl);if(response.ok){ready=true;break;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  if(!ready){server.kill();throw new Error(`Local QA server failed: ${serverOutput}`);}
}
const browser = await chromium.launch({ channel: process.env.QA_BROWSER ?? 'msedge', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1200 }, deviceScaleFactor: 1 });
const failures = [];
page.on('pageerror', error => failures.push(error.message));
const reports = [];
const designReports = [];
const designNames = {'reference-1':'1 · Clean','reference-2':'2 · Sidebar','reference-4':'4 · Arena'};
async function inspectImages() {
  return page.evaluate(async()=>{
    const root=document.querySelector('svg.pregame-graphic');
    const images=[...root.querySelectorAll('image')];
    const assets=await Promise.all(images.map(async node=>{
      const href=node.getAttribute('href'),asset=new Image();asset.src=href;await asset.decode();
      return {href,width:asset.naturalWidth,height:asset.naturalHeight};
    }));
    const viewports=[...root.querySelectorAll('svg')].map(node=>{
      const box=node.getBoundingClientRect();return {width:box.width,height:box.height,viewBox:node.getAttribute('viewBox')};
    });
    return {assets,viewports};
  });
}
function assertDensity(bytes) {
  let offset=8, found=0;
  while(offset<bytes.length) {
    const length=bytes.readUInt32BE(offset);
    if(bytes.toString('ascii',offset+4,offset+8)==='pHYs') {
      found++; assert.equal(bytes.readUInt32BE(offset+8),11811); assert.equal(bytes.readUInt32BE(offset+12),11811); assert.equal(bytes[offset+16],1);
    }
    offset+=length+12;
  }
  assert.equal(found,1,'Exactly one 300-DPI pHYs chunk');
}
async function inspectDesign() {
  return page.evaluate(() => {
    const nodes=[...document.querySelectorAll('svg.pregame-graphic text')];
    const boxes=nodes.map(node=>{const b=node.getBBox();return {x:b.x,y:b.y,w:b.width,h:b.height,text:node.textContent};});
    const outside=boxes.filter(b=>b.x<0 || b.y<0 || b.x+b.w>1920.5 || b.y+b.h>1080.5);
    const collisions=[];
    for(let a=0;a<boxes.length;a++) for(let b=a+1;b<boxes.length;b++) {
      const x=boxes[a],y=boxes[b];
      if(x.x<y.x+y.w-1 && y.x<x.x+x.w-1 && x.y<y.y+y.h-1 && y.y<x.y+x.h-1) collisions.push([x.text,y.text]);
    }
    return {outside,collisions};
  });
}
const sampleNames = ['warriors','thunder','kings','trailblazers','pacers','raptors'];
const compressed = { 0:['15:30','15:40'],1:['17:00','17:10'],3:['18:00','18:10'],5:['17:30','17:40'] };
// Historical-only explicit QA edits; absent from active clinician configuration.
const historicalClinicians={'Kawhi Leonard':'Maggie','Nicolas Batum':'Jasen','Bennedict Mathurin':'Colby','John Collins':'Jesse','Bogdan Bogdanovic':'Colby','Sean Pedulla':'Colby','Norchad Omier':'Jasen','TyTy Washington':'Dan'};
try {
  await page.goto(baseUrl, {waitUntil:'domcontentloaded',timeout:120000});
  await page.getByLabel('Load sample').waitFor({timeout:120000});
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('button',{name:'Original · Operations',exact:true}).click();
  for (let index = 0; index < 6; index++) {
    await page.getByLabel('Load sample').selectOption(String(index));
    await page.locator('svg.pregame-graphic').waitFor();
    const svg = page.locator('svg.pregame-graphic');
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('svg.pregame-graphic image')].map(async node => {
        const image = new Image(); image.src = node.getAttribute('href'); await image.decode();
      }));
    });
    await svg.screenshot({ path: fileURLToPath(new URL(`${index + 1}-${sampleNames[index]}-review.png`,out)) });
    const initialText = await svg.textContent();
    const download = page.getByRole('button',{name:'Download PNG',exact:true});
    assert.equal(await download.isDisabled(),true,'Historical samples require current roster review');
    for(const [name,clinician] of Object.entries(historicalClinicians)) {
      const input=page.getByLabel(`TABLE clinician for ${name}`,{exact:true});
      if(await input.count()) {
        const group=input.locator('xpath=ancestor::details');
        if(!await group.evaluate(node=>node.open)) await group.locator('summary').click();
        assert.equal(await input.inputValue(),'','Off-roster player must not inherit old clinician');
        await input.fill(clinician);
      }
    }
    if (compressed[index]) {
      assert.equal(await download.isDisabled(),true,`Sample ${index + 1}: unresolved timing must block export`);
      assert(initialText.includes('START NEEDED') && initialText.includes('END NEEDED'));
      const group = page.locator('.group-editor').filter({has:page.locator('summary').filter({hasText:'Nicolas Batum'})});
      const [start,end] = compressed[index];
      await group.getByLabel('TABLE start',{exact:true}).fill(start);
      await group.getByLabel('TABLE end',{exact:true}).fill(end);
    }
    await page.waitForFunction(() => !document.querySelector('.export-controls button')?.disabled);
    assert.equal(await download.isEnabled(),true,`Sample ${index + 1}: reviewed schedule must export`);
    const text = await svg.textContent();
    assert(!text.includes('NEEDED'),'Unresolved values must not remain after review');
    assert(text.includes('BENNEDICT MATHURIN'),'Mathurin canonical name');
    assert(text.includes('Cam w/Dan'),'Cam must use updated clinician Dan');
    assert(!text.includes('Cam w/Jasen'),'Historical mapping must not win');
    assert(text.includes('KAWHI LEONARD'),'Kawhi must remain');
    assert(text.includes('35:00 ON THE CLOCK'),'Meeting clock');
    assert(text.includes(index === 2 || index === 4 ? ' AT ' : ' VS.'),'Home/away metadata');
    const geometry = await page.evaluate(() => {
      const svg = document.querySelector('svg.pregame-graphic');
      const text = [...svg.querySelectorAll('text')].map(node => {
        const box = node.getBBox();
        return {text:node.textContent,x:box.x,y:box.y,width:box.width,height:box.height,block:node.closest('[data-block]')?.getAttribute('data-block')};
      });
      const outside = text.filter(t => t.x < 0 || t.y < 0 || t.x+t.width > 1920.5 || t.y+t.height >1080.5);
      const collisions = [];
      for (let a=0;a<text.length;a++) for(let b=a+1;b<text.length;b++) {
        const x=text[a],y=text[b];
        if (x.x < y.x+y.width-1 && y.x < x.x+x.width-1 && x.y < y.y+y.height-1 && y.y < x.y+x.height-1) collisions.push([x.text,y.text]);
      }
      return {outside,collisions,text};
    });
    assert.deepEqual(geometry.outside,[],`Sample ${index+1} text outside canvas`);
    assert.deepEqual(geometry.collisions,[],`Sample ${index+1} text collisions`);
    for(const [design,name] of Object.entries(designNames)) {
      await page.getByRole('button',{name,exact:true}).click();
      const designText=(await svg.locator('text').allTextContents()).join(' ').replace(/\s+/g,' ').toUpperCase();
      for(const name of ['KAWHI LEONARD','BENNEDICT MATHURIN','CAM CHRISTIE','DARIUS GARLAND','BROOK LOPEZ']) assert(designText.includes(name),'Design must preserve canonical player names');
      assert(designText.includes('DAN') && designText.includes('35:00 ON THE CLOCK'));
      assert(designText.includes(index===2 || index===4?'AT ':'VS. '),'Design must preserve home/away');
      if(index!==4) for(const clock of [95,80,65,50]) assert(designText.includes(`${clock}:00 ON THE CLOCK`),'All clock labels must remain');
      if(index===1 || index===3 || index===5) assert(designText.includes('PRACTICE COURT') && designText.includes('PD GROUP'));
      const bounds=await inspectDesign();
      const imageAudit=await inspectImages();
      assert(imageAudit.assets.every(asset=>asset.width>0&&asset.height>0),'Every graphic image must decode');
      assert(imageAudit.assets.some(asset=>asset.href===`/assets/logos/${sampleNames[index]}.svg`),'Fixture opponent must use a vector logo');
      assert(imageAudit.viewports.every(box=>box.width>0&&box.height>0),'Cropped artwork viewports must have positive dimensions');
      await svg.screenshot({path:fileURLToPath(new URL(`${index+1}-${sampleNames[index]}-${design}.png`,out))});
      assert.deepEqual(bounds,{outside:[],collisions:[]},`${design}: sample ${index+1} geometry`);
      designReports.push({sample:index+1,design,...bounds,imageAudit});
    }
    await page.getByRole('button',{name:'Original · Operations',exact:true}).click();
    await svg.screenshot({path:fileURLToPath(new URL(`${index+1}-${sampleNames[index]}-reviewed.png`,out))});
    const pending = page.waitForEvent('download',{timeout:90000});
    await download.click();
    const file = await pending;
    const path = fileURLToPath(new URL(`${index+1}-${sampleNames[index]}-export.png`,out));
    await file.saveAs(path);
    const bytes = await readFile(path);
    assert.equal(bytes.readUInt32BE(16),4000);
    assert.equal(bytes.readUInt32BE(20),2250);
    assertDensity(bytes);
    assert(bytes.length > 50000,'PNG should contain full graphic assets');
    const raster = await page.evaluate(async base64 => {
      const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width=1920; canvas.height=1080;
      const c=canvas.getContext('2d'); c.drawImage(image,0,0,1920,1080);
      const title=c.getImageData(50,35,830,55).data;
      let white=0;
      for(let i=0;i<title.length;i+=4) if(title[i]>240 && title[i+1]>240 && title[i+2]>240) white++;
      const header=c.getImageData(1010,10,650,65).data;
      let dark=0;
      for(let i=0;i<header.length;i+=4) if(header[i]<100 && header[i+1]<100 && header[i+2]<100) dark++;
      return {titleWhitePixels:white,headerDarkPixels:dark};
    },bytes.toString('base64'));
    assert(raster.titleWhitePixels>4000,'Export must include the white title text');
    assert(raster.headerDarkPixels>1500,'Export must include the date/opponent header');
    reports.push({sample:index+1,name:sampleNames[index],filename:file.suggestedFilename(),reviewEdit:compressed[index] ?? null,historicalCliniciansExplicitlyEntered:true,pngBytes:bytes.length,raster,geometry});
    if (index < 5) page.once('dialog',dialog => dialog.accept());
  }
  // Current roster should parse and export immediately without old-player overrides.
  page.once('dialog',dialog=>dialog.accept());
  await page.getByLabel('Load sample').selectOption('current');
  await page.waitForFunction(()=>!document.querySelector('.export-controls button')?.disabled);
  const currentText=await page.locator('svg.pregame-graphic').textContent();
  assert(currentText.includes('BRADLEY BEAL') && currentText.includes('KEATON WAGLER'));
  assert(currentText.includes('Jalen w/Jasen') && currentText.includes('Gradey w/Jasen'));
  assert(!currentText.includes('NEEDED') && !currentText.includes('KAWHI'));
  const currentDownload=page.waitForEvent('download',{timeout:90000});
  await page.getByRole('button',{name:'Download PNG',exact:true}).click();
  await (await currentDownload).saveAs(fileURLToPath(new URL('7-current-roster-export.png',out)));
  for(const [design,name] of Object.entries(designNames)) {
    await page.getByRole('button',{name,exact:true}).click();
    await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL(`current-roster-${design}.png`,out))});
    assert.deepEqual(await inspectDesign(),{outside:[],collisions:[]},`${design}: current roster geometry`);
    assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true,`${design}: ${await page.locator('.diagnostics').innerText()}`);
    await page.getByLabel('PNG quality',{exact:true}).selectOption('ultra');
    const pending=page.waitForEvent('download',{timeout:120000});
    await page.getByRole('button',{name:'Download PNG',exact:true}).click();
    const exported=await pending;
    const path=fileURLToPath(new URL(`design-${design}-export.png`,out));
    await exported.saveAs(path);
    const bytes=await readFile(path);
    assert.equal(bytes.readUInt32BE(16),8000);
    assert.equal(bytes.readUInt32BE(20),4500);
    assertDensity(bytes);
    designReports.push({design,exportWidth:bytes.readUInt32BE(16),exportHeight:bytes.readUInt32BE(20),dpi:300,pngBytes:bytes.length});
  }
  await page.getByLabel('PNG quality',{exact:true}).selectOption('standard');
  // Adversarial long note must stop export rather than clipping silently.
  await page.locator('.group-editor').first().locator('summary').click();
  await page.locator('.group-editor').first().getByLabel('Graphic note',{exact:true}).fill('overlong'.repeat(250));
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isDisabled(),true);
  assert((await page.locator('.diagnostics').innerText()).includes('too long') || (await page.locator('.diagnostics').innerText()).includes('exceeds'));
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true);
  // Editor actions must update the graphic and diagnostics immediately.
  const count=await page.locator('.group-editor').count();
  await page.getByRole('button',{name:'+ Add group',exact:true}).click();
  assert.equal(await page.locator('.group-editor').count(),count+1);
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isDisabled(),true);
  await page.locator('.group-editor').last().getByRole('button',{name:'Delete group',exact:true}).click();
  assert.equal(await page.locator('.group-editor').count(),count);
  const first=page.locator('.group-editor').first();
  if(!await first.evaluate(node=>node.open)) await first.locator('summary').click();
  const before=await first.locator('summary').innerText();
  await first.getByRole('button',{name:'Move group 1 down',exact:true}).click();
  assert.notEqual(await page.locator('.group-editor').first().locator('summary').innerText(),before);
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  const treatmentGroup=page.locator('.group-editor').filter({has:page.locator('summary').filter({hasText:'Jordan Miller'})});
  if(!await treatmentGroup.evaluate(node=>node.open)) await treatmentGroup.locator('summary').click();
  await treatmentGroup.getByLabel('Treatment exception note',{exact:true}).first().fill('post-walkthrough');
  assert((await page.locator('svg.pregame-graphic').textContent()).includes('post-walkthrough'),'The treatment exception note must remain visible in either composition');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  // Full current-roster plan must remain exportable and free of exact conflicts.
  await page.locator('.treatment-planner > summary').click();
  await page.getByRole('button',{name:'Apply reviewed treatment plan',exact:true}).click();
  assert(!(await page.locator('.diagnostics').innerText()).includes('individual treatment times overlap'));
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true,'Planned current roster should fit the graphic');
  for(const [design,name] of Object.entries(designNames)) {
    await page.getByRole('button',{name,exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true,`${design}: individual appointments must fit`);
    assert.deepEqual(await inspectDesign(),{outside:[],collisions:[]},`${design}: individual appointment geometry`);
    await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL(`current-roster-planned-${design}.png`,out))});
  }
  await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL('current-roster-planned.png',out))});
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  // Extended duration: Derrick retains his primary; Garland uses a reviewed backup.
  await page.locator('#raw-text').fill('Shooting Times: vs Warriors\n5:00 (120 on Clock) - Derrick Jones Jr\n5:15 (105 on Clock) - Darius Garland\n7:00pm tip vs Warriors\nMeeting at 35 on the clock');
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Parse Schedule',exact:true}).click();
  const garlandGroup=page.locator('.group-editor').filter({has:page.locator('summary').filter({hasText:'Darius Garland'})});
  if(!await garlandGroup.evaluate(node=>node.open)) await garlandGroup.locator('summary').click();
  await page.getByLabel('Treatment duration for Darius Garland',{exact:true}).fill('45');
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isDisabled(),true);
  if(!await page.locator('.treatment-planner').evaluate(node=>node.open)) await page.locator('.treatment-planner > summary').click();
  await page.getByRole('button',{name:'Apply reviewed treatment plan',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true);
  assert((await page.locator('svg.pregame-graphic').textContent()).includes('4:15PM–5PM'));
  assert.deepEqual(await inspectDesign(),{outside:[],collisions:[]});
  const treatmentDownload=page.waitForEvent('download',{timeout:90000});
  await page.getByRole('button',{name:'Download PNG',exact:true}).click();
  await (await treatmentDownload).saveAs(fileURLToPath(new URL('treatment-planner-export.png',out)));
  // Actual Oct 4 game: AM-to-noon, neutral-site metadata and reviewed backup assignments.
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Load Oct 4 Hawaii game',exact:true}).click();
  const hawaiiText=await page.locator('svg.pregame-graphic').textContent();
  for(const name of ['FLETCHER LOYER','YUKI KAWAMURA','KRIS DUNN','JALEN PICKETT','BRANDON INGRAM']) assert(hawaiiText.includes(name));
  assert(hawaiiText.toUpperCase().includes('HONOLULU') && hawaiiText.toUpperCase().includes('STAN SHERIFF'));
  assert(hawaiiText.includes('1PM') && hawaiiText.includes('9:55AM') && hawaiiText.includes('12:10PM'));
  assert(!hawaiiText.includes('MEETING') && !hawaiiText.includes('INTUIT'));
  if(!await page.locator('.treatment-planner').evaluate(node=>node.open)) await page.locator('.treatment-planner > summary').click();
  assert((await page.locator('.treatment-slots').innerText()).includes('backup for Lorin'));
  await page.getByRole('button',{name:'Apply reviewed treatment plan',exact:true}).click();
  for(const [design,name] of Object.entries(designNames)) {
    await page.getByRole('button',{name,exact:true}).click();
    assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true,`${design}: Hawaii game must fit: ${await page.locator('.diagnostics').innerText()}`);
    assert.deepEqual(await inspectDesign(),{outside:[],collisions:[]},`${design}: Hawaii game geometry`);
    const pending=page.waitForEvent('download',{timeout:120000});
    await page.getByRole('button',{name:'Download PNG',exact:true}).click();
    const file=await pending;
    const path=fileURLToPath(new URL(`hawaii-${design}-export.png`,out));
    await file.saveAs(path);
    const bytes=await readFile(path);
    assert.equal(bytes.readUInt32BE(16),4000);assert.equal(bytes.readUInt32BE(20),2250);assertDensity(bytes);
  }
  assert.deepEqual(failures,[],'No browser exceptions');
  await page.screenshot({path:fileURLToPath(new URL('studio-desktop.png',out)),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:fileURLToPath(new URL('studio-mobile.png',out)),fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'Mobile studio must not overflow horizontally');
  await writeFile(new URL('browser-report.json',out),JSON.stringify({reports,designReports,failures,currentRosterImmediateExportPassed:true,adversarialOverflowBlocked:true,editorActionsPassed:true,treatmentPlannerPassed:true},null,2));
  console.log('PASS: six historical schedules plus actual Hawaii game, backup clinicians, canonical data, bounds/collisions, 4000x2250 and 8000x4500 PNGs, 300-DPI metadata.');
} finally { await browser.close(); server?.kill(); }
