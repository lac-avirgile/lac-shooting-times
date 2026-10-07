import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';

const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1920,height:2200}});
const reports=[];
try {
  await page.goto('http://127.0.0.1:5173/');
  await page.getByRole('button',{name:'Load Oct 4 Hawaii game',exact:true}).click();
  for(const design of ['Original · Operations','1 · Clean','2 · Sidebar','4 · Arena']) {
    await page.getByRole('button',{name:design,exact:true}).click();
    await page.evaluate(()=>document.fonts.ready);
    const report=await page.locator('svg.pregame-graphic').evaluate(root=>{
      const allText=[...root.querySelectorAll('text')];
      const title=allText.find(node=>node.textContent==='PREGAME WORKOUT TIMES');
      const titleStyle=getComputedStyle(title),context=document.createElement('canvas').getContext('2d');
      context.font=`${titleStyle.fontWeight} ${titleStyle.fontSize} ${titleStyle.fontFamily}`;
      const titleInk=context.measureText(title.textContent);
      // Optical centering uses painted glyphs, not unused ascent/descent in the font's em box.
      const titleCenter=Number(title.getAttribute('y'))+(titleInk.actualBoundingBoxDescent-titleInk.actualBoundingBoxAscent)/2;
      const original=Boolean(root.querySelector('#original-watermark'));
      const cards=[];
      for(const node of allText){
        const id=node.getAttribute('data-block')??node.closest('[data-block]')?.getAttribute('data-block');
        if(!id?.startsWith('group-')||node.getAttribute('fill')!=='white'||!['26','28'].includes(node.getAttribute('font-size')))continue;
        if(cards.some(card=>card.id===id))continue;
        const box=node.getBBox();
        const candidates=[...root.querySelectorAll('rect,path')].filter(shape=>
          shape.getAttribute('fill')==='white'||shape.getAttribute('fill')==='#FFFFFF'||shape.getAttribute('fill')==='url(#panel)'
        ).map(shape=>shape.getBBox()).filter(b=>box.x>b.x&&box.x+box.width<b.x+b.width&&box.y>b.y&&box.y<b.y+b.height);
        const card=candidates.sort((a,b)=>a.width*a.height-b.width*b.height)[0];
        if(card)cards.push({id,x:card.x,y:card.y,width:card.width,height:card.height});
      }
      const badInsets=[];
      for(const node of allText){
        const id=node.getAttribute('data-block')??node.closest('[data-block]')?.getAttribute('data-block');
        const card=cards.find(card=>card.id===id);if(!card)continue;
        const box=node.getBBox();
        const padding={left:box.x-card.x,right:card.x+card.width-box.x-box.width,top:box.y-card.y,bottom:card.y+card.height-box.y-box.height};
        if(padding.left<12||padding.right<12||padding.top<6||padding.bottom<6)badInsets.push({text:node.textContent,padding});
      }
      const meeting=allText.find(node=>node.textContent==='TEAM MEETING').getBBox();
      const meetingCard=[...root.querySelectorAll('rect,path')].map(node=>node.getBBox()).filter(b=>Math.abs(b.height-104)<.1&&meeting.x>b.x&&meeting.x<b.x+b.width&&meeting.y>b.y&&meeting.y<b.y+b.height)[0];
      const lastBottom=Math.max(...cards.filter(card=>Math.abs(card.x-meetingCard.x)<1).map(card=>card.y+card.height));
      return {titleCenterDifference:Math.abs(titleCenter-(original?82:96)),cardCount:cards.length,badInsets,meetingGap:meetingCard.y-lastBottom};
    });
    reports.push({design,...report});
    assert.equal(report.cardCount,10,`${design}: all group containers audited`);
    assert.deepEqual(report.badInsets,[],`${design}: text needs more internal padding`);
    assert(report.titleCenterDifference<3,`${design}: optical title centering`);
    assert.equal(report.meetingGap,24,`${design}: meeting must follow the last card with one standard gap`);
  }
  console.log('PASS: all four titles optically centered, every Hawaii group has safe text insets, meeting follows the final card by exactly one standard gap.');
} finally {
  await writeFile(new URL('../qa-output/spacing/polish-report.json',import.meta.url),JSON.stringify(reports,null,2));
  await browser.close();
}
