import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=new URL('../qa-output/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:1200}});
const exceptions=[];page.on('pageerror',error=>exceptions.push(error.message));
try {
  await page.goto(process.env.QA_URL??'http://127.0.0.1:4183/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.getByRole('button',{name:'Roster Management'}).click();
  for(const id of ['hachimura','garland','ingram']){
    const row=page.locator('.roster-row').filter({has:page.locator('strong').filter({hasText:id==='hachimura'?'Rui Hachimura':id==='garland'?'Darius Garland':'Brandon Ingram'})});
    await row.locator('.roster-player > summary').click();
    assert.equal(await page.getByLabel(`Default minutes ${id}`,{exact:true}).inputValue(),'30');
  }
  await page.getByRole('button',{name:'+ Add player to LA Clippers',exact:true}).click();
  const added=page.locator('.roster-row').last();
  await added.locator('input[aria-label^="Roster name"]').fill('Test Player');
  await added.getByLabel('Primary clinician').fill('Eric');
  await added.getByLabel('Secondary clinician').fill('Jesse');
  await added.locator('input[type="number"]').fill('25');
  await added.getByLabel('Aliases (comma separated)',{exact:true}).fill('TP, Testy');
  await page.getByRole('button',{name:'Save roster & teams',exact:true}).click();
  assert((await page.getByRole('status').innerText()).includes('Saved in this browser'));
  await page.reload();await page.getByRole('button',{name:'Roster Management'}).click();
  const restored=page.locator('.roster-row').filter({has:page.locator('strong').filter({hasText:'Test Player'})});
  await restored.locator('.roster-player > summary').click();
  assert.equal(await restored.getByLabel('Primary clinician').inputValue(),'Eric');
  assert.equal(await restored.locator('input[type="number"]').inputValue(),'25');
  await page.getByRole('button',{name:'LA Clippers Creator'}).click();
  await page.locator('#raw-text').fill('Shooting times vs Warriors\n11:25 (95 on clock) Testy\nGame 1pm');
  await page.getByRole('button',{name:'Parse Schedule',exact:true}).click();
  assert((await page.locator('svg.pregame-graphic').textContent()).includes('TEST PLAYER'));
  await page.getByRole('button',{name:'Roster Management'}).click();
  const toUnassign=page.locator('.roster-row').filter({has:page.locator('strong').filter({hasText:'Test Player'})});
  await toUnassign.locator('.roster-player > summary').click();
  await page.getByRole('button',{name:'Unassign Test Player',exact:true}).click();
  await page.getByRole('button',{name:'Save roster & teams',exact:true}).click();
  await page.getByRole('button',{name:'LA Clippers Creator'}).click();
  await page.locator('#raw-text').fill('Shooting times vs Warriors\n11:25 (95 on clock) Testy\nGame 1pm');
  await page.getByRole('button',{name:'Parse Schedule',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isDisabled(),true);
  await page.getByRole('button',{name:'Load Oct 4 Hawaii game',exact:true}).click();
  if(!await page.locator('.treatment-planner').evaluate(node=>node.open))await page.locator('.treatment-planner > summary').click();
  assert.equal(await page.locator('.conflict-review').count(),0);
  const biGroup=page.locator('.group-editor').nth(3);if(!await biGroup.evaluate(node=>node.open))await biGroup.locator('summary').click();
  await biGroup.getByLabel('Treatment duration for Brandon Ingram',{exact:true}).fill('30');
  const brandonChoices=page.locator('.resolution-player').filter({has:page.locator('strong').filter({hasText:'Brandon Ingram'})});
  assert((await brandonChoices.innerText()).includes('Use Dan · keep 30 minutes'));
  assert((await brandonChoices.innerText()).includes('Shorten to 15 minutes · keep Maggie'));
  assert((await brandonChoices.innerText()).includes('Move treatment · keep Maggie / 30 minutes'));
  assert.equal(await brandonChoices.getByRole('button',{name:'Edit manually',exact:true}).count(),1);
  await page.getByRole('button',{name:'Apply reviewed treatment plan',exact:true}).click();
  assert(!(await page.locator('.diagnostics').innerText()).includes('group treatment windows may overlap'));
  for(const label of ['Original · Operations','1 · Clean','2 · Sidebar','4 · Arena']) {
    await page.getByRole('button',{name:label,exact:true}).click();
    if(await page.getByRole('button',{name:'Download PNG',exact:true}).isDisabled()) {
      await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL(`settings-${label[0]}-overflow.png`,out))});
      await writeFile(new URL('settings-overflow.txt',out),await page.locator('svg.pregame-graphic').innerHTML());
    }
    assert.equal(await page.getByRole('button',{name:'Download PNG',exact:true}).isEnabled(),true,`${label}: ${await page.locator('.diagnostics').innerText()}`);
    const audit=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('svg.pregame-graphic text')];
      const boxes=nodes.map(node=>{const b=node.getBBox();return {text:node.textContent,x:b.x,y:b.y,w:b.width,h:b.height,weight:getComputedStyle(node).fontWeight};});
      const root=document.querySelector('svg.pregame-graphic'),view=root.viewBox.baseVal;
      const outside=boxes.filter(b=>b.x<0||b.y<0||b.x+b.w>view.width+.5||b.y+b.h>view.height+.5),collisions=[];
      for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w-1&&b.x<a.x+a.w-1&&a.y<b.y+b.h-1&&b.y<a.y+a.h-1)collisions.push([a.text,b.text]);}
      return {outside,collisions,boxes,minimumFont:Math.min(...nodes.map(node=>parseFloat(getComputedStyle(node).fontSize)))};
    });
    assert.deepEqual(audit.outside,[]);assert.deepEqual(audit.collisions,[]);
    assert(audit.minimumFont>=20,'At least 10pt at standard 4000px / 300 DPI export');
    if(label==='1 · Clean'||label==='2 · Sidebar')assert(audit.boxes.filter(box=>box.text==='11:55AM–12:10PM').every(box=>box.weight==='400'));
    await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL(`settings-${label[0]}-hawaii.png`,out))});
  }
  await page.getByRole('button',{name:'1 · Clean',exact:true}).click();
  const downloading=page.waitForEvent('download',{timeout:90000});await page.getByRole('button',{name:'Download PNG',exact:true}).click();
  const file=await downloading,path=fileURLToPath(new URL('hawaii-current-defaults.png',out));await file.saveAs(path);
  const bytes=await readFile(path),pngWidth=bytes.readUInt32BE(16),pngHeight=bytes.readUInt32BE(20);
  const nativeWidth=await page.locator('svg.pregame-graphic').evaluate(node=>node.viewBox.baseVal.width);
  assert(pngWidth>=4000);assert.equal(pngWidth/pngHeight,16/9);assert(pngWidth/nativeWidth>=4000/1920);
  // Exact clinician conflict must be prominent; shortening is a deliberate proposal only.
  await page.locator('#raw-text').fill('Shooting times vs Warriors\n11:25 (95 on clock) Fletcher + Yuki\nGame 1pm');
  page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Parse Schedule',exact:true}).click();
  await page.getByRole('button',{name:'Apply reviewed treatment plan',exact:true}).click();
  await page.locator('.group-editor').first().locator('summary').click();
  const yuki=page.locator('.athlete-editor').filter({has:page.getByLabel('Treatment duration for Yuki Kawamura',{exact:true})});
  await yuki.getByLabel('TABLE clinician for Yuki Kawamura',{exact:true}).fill('Lorin');
  assert((await page.locator('.conflict-review').innerText()).includes('confirmed'));
  await yuki.getByLabel('Treatment duration for Yuki Kawamura',{exact:true}).fill('30');
  const resolution=page.locator('.resolution-player').filter({has:page.locator('strong').filter({hasText:'Yuki Kawamura'})});
  await resolution.locator('.more-resolution-options > summary').click();
  await resolution.getByLabel('Shorter treatment for Yuki Kawamura',{exact:true}).fill('10');
  await resolution.getByRole('button',{name:'Preview shorter options',exact:true}).click();
  assert.equal(await yuki.getByLabel('Treatment duration for Yuki Kawamura',{exact:true}).inputValue(),'30');
  await resolution.locator('.more-resolution-options .slot-options button').first().click();
  assert.equal(await yuki.getByLabel('Treatment duration for Yuki Kawamura',{exact:true}).inputValue(),'10');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:fileURLToPath(new URL('settings-conflict-studio.png',out)),fullPage:true});
  assert.deepEqual(exceptions,[]);
  await writeFile(new URL('settings-qa-report.json',out),JSON.stringify({rosterPersistence:true,threeThirtyMinuteDefaults:true,secondaryAssignment:true,allDesignsFit:true,regularWeightCleanSidebar:true,shorteningExplicit:true,pngWidth,pngHeight,browserErrors:exceptions},null,2));
  console.log(`PASS: typed roster add/remove, saved settings reload, primary/secondary clinicians, 30-minute Rui/Darius/Ingram, ordered explicit conflict choices, regular Clean/Sidebar times, all real-game layouts, ${pngWidth}x${pngHeight} PNG.`);
}finally{await browser.close();}
