import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const out=new URL('../qa-output/spacing/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
// A tall capture viewport keeps sticky editor chrome from occluding the graphic's bottom.
const page=await browser.newPage({viewport:{width:1920,height:2200}});
const errors=[],reports=[];page.on('pageerror',error=>errors.push(error.message));
const designs=['Original · Operations','1 · Clean','2 · Sidebar','4 · Arena'];
try{
  await page.goto('http://127.0.0.1:5173/');await page.evaluate(()=>document.fonts.ready);
  for(let sample=0;sample<7;sample++){
    if(sample===6){await page.getByRole('button',{name:'Load Oct 4 Hawaii game',exact:true}).click();assert.equal(await page.locator('.conflict-review').count(),0);}
    else{page.once('dialog',dialog=>dialog.accept());await page.getByLabel('Load sample').selectOption(String(sample));}
    for(const design of designs){
      await page.getByRole('button',{name:design,exact:true}).click();
      await page.evaluate(()=>document.fonts.ready);
      const audit=await page.evaluate(()=>{
        const root=document.querySelector('svg.pregame-graphic'),view=root.viewBox.baseVal,inv=root.getScreenCTM().inverse();
        const nodes=[...root.querySelectorAll('text')];
        const boxes=nodes.map(node=>{const b=node.getBBox(),matrix=inv.multiply(node.getScreenCTM()),p=new DOMPoint(b.x,b.y).matrixTransform(matrix);return{text:node.textContent,x:p.x,y:p.y,w:b.width,h:b.height,size:parseFloat(getComputedStyle(node).fontSize)};});
        const outside=boxes.filter(b=>b.x<0||b.y<0||b.x+b.w>view.width+.5||b.y+b.h>view.height+.5),collisions=[];
        for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w-1&&b.x<a.x+a.w-1&&a.y<b.y+b.h-1&&b.y<a.y+a.h-1)collisions.push([a.text,b.text]);}
        const nameGroups=new Map();
        nodes.forEach((node,index)=>{if(node.getAttribute('fill')!=='white'||![26,28].includes(Number(node.getAttribute('font-size'))))return;const id=node.getAttribute('data-block')??node.closest('[data-block]')?.getAttribute('data-block');if(!id||!id.startsWith('group-'))return;nameGroups.set(id,[...(nameGroups.get(id)??[]),boxes[index]]);});
        const headers=[...root.querySelectorAll('rect')].filter(node=>node.hasAttribute('data-player-header')||['#12173F','#112B49'].includes(node.getAttribute('fill'))).map(node=>node.getBBox());
        const miscentered=[];
        for(const [id,names] of nameGroups){const name=names[0],head=headers.find(b=>name.x>=b.x&&name.x<=b.x+b.width&&name.y>=b.y&&name.y<=b.y+b.height);if(!head){miscentered.push({id,reason:'Missing header'});continue;}const top=Math.min(...names.map(b=>b.y)),bottom=Math.max(...names.map(b=>b.y+b.h)),difference=Math.abs((top+bottom)/2-(head.y+head.height/2));if(difference>3)miscentered.push({id,difference});}
        const ruleCrossings=[];
        for(const line of root.querySelectorAll('line')){const x1=Number(line.getAttribute('x1')),x2=Number(line.getAttribute('x2')),y=Number(line.getAttribute('y1'));if(y!==Number(line.getAttribute('y2'))||Math.abs(x2-x1)<100)continue;for(const box of boxes)if(y>box.y&&y<box.y+box.h&&Math.max(x1,x2)>box.x&&Math.min(x1,x2)<box.x+box.w)ruleCrossings.push(box.text);}
        return{width:view.width,height:view.height,outside,collisions,miscentered,ruleCrossings,minSize:Math.min(...boxes.map(b=>b.size))};
      });
      await page.locator('svg.pregame-graphic').screenshot({path:fileURLToPath(new URL(`${sample+1}-${design[0]}.png`,out))});
      reports.push({sample:sample+1,design,...audit});
      assert.deepEqual(audit.outside,[],`${sample+1} ${design} bounds`);
      assert.deepEqual(audit.collisions,[],`${sample+1} ${design} text collisions`);
      assert.deepEqual(audit.miscentered,[],`${sample+1} ${design} optical name centering`);
      assert.deepEqual(audit.ruleCrossings,[],`${sample+1} ${design} decorative rule clear space`);
      assert(audit.minSize>=20);
    }
  }
  await page.getByRole('button',{name:'1 · Clean',exact:true}).click();
  const native=await page.locator('svg.pregame-graphic').evaluate(node=>node.viewBox.baseVal.width);
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG',exact:true}).click();
  const download=await pending,path=fileURLToPath(new URL('hawaii-spacious.png',out));await download.saveAs(path);
  const bytes=await readFile(path),w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
  assert(w>=4000&&w/h===16/9);assert(w/native>=4000/1920);
  assert.deepEqual(errors,[]);
  console.log(`PASS: 28 template/fixture renders, no text collisions or clipping, >=10pt type, ${w}×${h} PNG.`);
}finally{await writeFile(new URL('report.json',out),JSON.stringify({reports,errors},null,2));await browser.close();}
