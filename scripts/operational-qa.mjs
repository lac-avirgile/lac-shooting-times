import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=new URL('../qa-output/operational/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:2200}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('dialog',dialog=>dialog.accept());
const image=()=>page.locator('svg.pregame-graphic');
const downloadButton=()=>page.getByRole('button',{name:'Download PNG',exact:true});
async function reloadGame(){await page.getByRole('button',{name:'Load Oct 4 Hawaii game',exact:true}).click();}
async function openGroup(index){const group=page.locator('.group-editor').nth(index);if(!await group.evaluate(node=>node.open))await group.locator('summary').click();return group;}
try{
  await page.goto('http://127.0.0.1:5173/');await page.evaluate(()=>document.fonts.ready);await reloadGame();
  const expected=[['Fletcher Loyer','Lorin',15],['Yuki Kawamura','Colby',15],['Nick Martinelli','Dan',15],['Blake Wesley','Lorin',15],['Baba Miller','Colby',15],['Keaton Wagler','Maggie',15],['Gradey Dick','Jasen',15],['Brandon Ingram','Maggie',15],['Kris Dunn','Colby',15],['Isaiah Jackson','Jesse',15],['Jalen Pickett','Jasen',15],['Derrick Jones Jr.','Maggie',15],['Cam Christie','Dan',15],['Max Strus','Dan',15],['Darius Garland','Maggie',30],['Rui Hachimura','Jesse',30],['Brook Lopez','Dan',15]];
  for(let index=0;index<10;index++)await openGroup(index);
  const appointments=[];
  for(const [name,clinician,duration] of expected){
    const athlete=page.locator('.athlete-editor').filter({has:page.getByLabel(`Treatment duration for ${name}`,{exact:true})});
    assert.equal(await athlete.getByLabel(`Treatment duration for ${name}`,{exact:true}).inputValue(),String(duration));
    assert.equal(await athlete.getByLabel(`TABLE clinician for ${name}`,{exact:true}).inputValue(),clinician);
    const parse=value=>Number(value.slice(0,2))*60+Number(value.slice(3));
    const start=parse(await athlete.getByLabel('Treatment start',{exact:true}).inputValue()),end=parse(await athlete.getByLabel('Treatment end',{exact:true}).inputValue());
    assert.equal(end-start,duration,name);appointments.push({name,clinician,start,end,duration});
  }
  for(const a of appointments)for(const b of appointments)if(a!==b&&a.clinician===b.clinician)assert(!(a.start<b.end&&b.start<a.end),`${a.name}/${b.name} overlap`);
  assert.equal(await page.locator('.conflict-review').count(),0);assert.equal(await downloadButton().isEnabled(),true);
  assert((await image().textContent()).includes('TEAM MEETING'));
  assert((await image().textContent()).includes('35:00 ON THE CLOCK'));
  assert((await image().textContent()).includes('12:25PM'));
  const group=await openGroup(3),brandon=group.getByLabel('Treatment duration for Brandon Ingram',{exact:true});
  const gradey=group.locator('.athlete-editor').filter({has:page.getByLabel('Treatment duration for Gradey Dick',{exact:true})});
  const gradeyBefore=await gradey.getByLabel('Treatment start',{exact:true}).inputValue();
  await brandon.fill('30');assert.equal(await gradey.getByLabel('Treatment duration for Gradey Dick',{exact:true}).inputValue(),'15');
  assert.equal(await gradey.getByLabel('Treatment start',{exact:true}).inputValue(),gradeyBefore);
  assert.equal(await downloadButton().isDisabled(),true);assert((await page.locator('.conflict-review').innerText()).includes('Brandon Ingram'));
  for(const design of ['Original · Operations','1 · Clean','2 · Sidebar','4 · Arena']){
    await page.getByRole('button',{name:design,exact:true}).click();assert((await image().textContent()).includes('*10:10AM'));
    await image().screenshot({path:fileURLToPath(new URL(`exception-${design[0]}.png`,out))});
  }
  await brandon.fill('');assert.equal(await brandon.inputValue(),'');assert.equal(await downloadButton().isDisabled(),true);
  await brandon.pressSequentially('15');assert.equal(await brandon.inputValue(),'15');assert.equal(await downloadButton().isEnabled(),true);
  assert(!(await image().textContent()).includes('9:55AM–10:25AM'));
  await brandon.press('ArrowUp');assert.equal(await brandon.inputValue(),'16');assert.equal(await downloadButton().isDisabled(),true);
  await brandon.press('ArrowDown');assert.equal(await brandon.inputValue(),'15');assert.equal(await downloadButton().isEnabled(),true);
  // Manual start/end values are actual live edits, not a disconnected requested duration.
  const bi=group.locator('.athlete-editor').filter({has:page.getByLabel('Treatment duration for Brandon Ingram',{exact:true})});
  await bi.getByLabel('Treatment start',{exact:true}).fill('10:05');assert((await image().textContent()).includes('*10:05AM'));assert.equal(await downloadButton().isDisabled(),true);
  await bi.getByLabel('Treatment start',{exact:true}).fill('10:10');assert.equal(await downloadButton().isEnabled(),true);
  await group.getByLabel('TABLE clinician for Brandon Ingram',{exact:true}).fill('Not a clinician');assert.equal(await downloadButton().isDisabled(),true);
  await group.getByLabel('TABLE clinician for Brandon Ingram',{exact:true}).fill('Maggie');assert.equal(await downloadButton().isEnabled(),true);
  for(const design of ['Original · Operations','1 · Clean','2 · Sidebar','4 · Arena']){
    await page.getByRole('button',{name:design,exact:true}).click();assert((await image().textContent()).includes('PRESEASON GAME 1'));
    const metadata=await page.evaluate(()=>{
      const svg=document.querySelector('svg.pregame-graphic');
      const node=[...svg.querySelectorAll('text')].find(node=>node.textContent.includes('PRESEASON GAME 1'));
      const matrix=svg.getScreenCTM().inverse().multiply(node.getScreenCTM());
      const point=new DOMPoint(Number(node.getAttribute('x')),Number(node.getAttribute('y'))).matrixTransform(matrix);
      window.exportTextPositions=[];
      if(!window.originalFillText){
        window.originalFillText=CanvasRenderingContext2D.prototype.fillText;
        CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...args){
          if(text.includes('PRESEASON GAME 1')){
            const pos=new DOMPoint(x,y).matrixTransform(this.getTransform());
            window.exportTextPositions.push({x:pos.x,y:pos.y,width:this.canvas.width});
          }
          return window.originalFillText.call(this,text,x,y,...args);
        };
      }
      return {x:point.x,y:point.y,width:svg.viewBox.baseVal.width};
    });
    const ready=page.waitForEvent('download');await downloadButton().click();const file=await ready;
    const printed=await page.evaluate(()=>window.exportTextPositions);
    assert.equal(printed.length,1,`${design}: game details drawn once`);
    assert(Math.abs(printed[0].x/printed[0].width*metadata.width-metadata.x)<.01,`${design}: exported game details retain horizontal position`);
    assert(Math.abs(printed[0].y/printed[0].width*metadata.width-metadata.y)<.01,`${design}: exported game details retain vertical position`);
    const path=fileURLToPath(new URL(`approved-${design[0]}.png`,out));await file.saveAs(path);
    const bytes=await readFile(path);assert(bytes.readUInt32BE(16)>=4000);assert.equal(bytes.readUInt32BE(16)/bytes.readUInt32BE(20),16/9);
    await image().screenshot({path:fileURLToPath(new URL(`preview-${design[0]}.png`,out))});
  }
  // The same approved text works through the ordinary paste/parse path, not just the fixture button.
  const raw=await page.locator('#raw-text').inputValue();await page.locator('#raw-text').fill(raw);await page.getByRole('button',{name:'Parse Schedule',exact:true}).click();
  assert((await image().textContent()).includes('PRESEASON GAME 1'));assert.equal(await page.locator('.conflict-review').count(),0);assert.equal(await downloadButton().isEnabled(),true);
  const finalGroup=await openGroup(3);assert.equal(await finalGroup.getByLabel('Treatment duration for Brandon Ingram',{exact:true}).inputValue(),'15');
  // Typing a player name must not remount the input and lose focus after one character.
  const player=finalGroup.getByLabel('Group 4 player 1',{exact:true});await player.fill('');await player.pressSequentially('Gradey Dick');
  assert.equal(await player.inputValue(),'Gradey Dick');assert.equal(await player.evaluate(node=>node===document.activeElement),true);
  await player.press('Tab');assert.equal(await downloadButton().isEnabled(),true);
  const originalCourt=await image().textContent();
  await finalGroup.getByLabel('COURT start',{exact:true}).fill('10:41');assert((await image().textContent()).includes('10:41AM'));
  await finalGroup.getByLabel('COURT start',{exact:true}).fill('10:40');assert.equal(await image().textContent(),originalCourt);
  const meta=page.locator('#game');await meta.locator('summary').click();await meta.getByLabel('Game header label',{exact:true}).fill('PRESEASON GAME 1 TEST');assert((await image().textContent()).includes('PRESEASON GAME 1 TEST'));
  await meta.getByLabel('Game header label',{exact:true}).fill('PRESEASON GAME 1');
  await page.getByRole('button',{name:'+ Add group',exact:true}).click();assert.equal(await page.locator('.group-editor').count(),11);
  const extra=await openGroup(10);await extra.getByRole('button',{name:'Delete group',exact:true}).click();assert.equal(await page.locator('.group-editor').count(),10);
  await page.getByRole('button',{name:'Move group 4 up',exact:true}).click();assert((await page.locator('.group-editor').nth(2).locator('summary').innerText()).includes('Gradey Dick'));
  await page.getByRole('button',{name:'Move group 3 down',exact:true}).click();assert((await page.locator('.group-editor').nth(3).locator('summary').innerText()).includes('Gradey Dick'));
  assert.equal(await downloadButton().isEnabled(),true);
  assert.deepEqual(errors,[]);await writeFile(new URL('report.json',out),JSON.stringify({appointments,all17DurationsChecked:true,noInitialOverlaps:true,clearTypeAndSpinnerLive:true,individualManualEdits:true,allFourExports:true,approvedPasteParse:true,errors},null,2));
  console.log('PASS: all 17 individual appointments, zero initial overlaps, keyboard clearing/typing/spinner edits update SVG, manual time edits, all four PNG exports and approved paste/parse.');
}finally{await browser.close();}
