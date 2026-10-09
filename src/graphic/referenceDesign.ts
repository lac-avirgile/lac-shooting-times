import {brand} from '../config/brand';
import {designArt,designTypography,referenceDesigns,type ReferenceDesignId} from '../config/referenceDesigns';
import type {Group,Schedule,Walkthrough} from '../domain/models';
import {formatTime} from '../domain/time';
import {opponentLogo,iconBounds} from '../config/graphicAssets';
import {groupKind,locationLabel,treatmentLines} from './designContent';
import {SceneBuilder,gameMeta,lines,rangeLabel,type GraphicScene} from './scene';
import {graphicSpacing as space,opticalBaseline} from '../config/graphicSpacing';
import type {TextPart} from './layout';

const font=designTypography.body,display=designTypography.display;
type Row={label:string;icon:string;lines:string[];exception:boolean;headingRange?:string};
type Card={group:Group;index:number;names:string[];rows:Row[];height:number;notes:string[];padding:number;compact:boolean};
type Block={kind:'group';card:Card}|{kind:'walk';walk:Walkthrough;height:number};
const headerHeight=(names:string[])=>Math.max(space.headerHeight,names.length*space.headerLeading+24);
const rowHeight=(r:Row)=>Math.max(space.rowHeight,r.lines.length*space.rowLeading+space.rowPadding);
const phaseWidths=(width:number,hasPerformance:boolean):number[]=>{
  const available=width-space.inset*2-space.groupGap*(hasPerformance?2:1);
  return hasPerformance?[available*0.44,available*0.28,available*0.28]:[available*0.56,available*0.44];
};
function exceptionParts(text:string):TextPart[]{
  return text.split(/(\*(?:START NEEDED|\d{1,2}(?::\d{2})?(?:AM|PM))–(?:END NEEDED|\d{1,2}(?::\d{2})?(?:AM|PM)))/g).filter(Boolean).map(part=>({text:part,...(part.startsWith('*')?{color:brand.red,bold:true}:{})}));
}
function phaseIcon(b:SceneBuilder,href:string,x:number,y:number,size:number,dark:boolean):void {
  const key=(Object.keys(brand.icons) as (keyof typeof brand.icons)[]).find(key=>brand.icons[key]===href)??'table';
  b.rect(x,y,size,size,dark?'#1C3857':'#EFF2F7',dark?'#496A88':'#DCE3EC',size/2);
  const padding=key==='performance'?4:6;
  // The rectangular dumbbell crop is contained, never stretched to a square.
  const bounds=iconBounds[key],ratio=bounds[2]/bounds[3],w=size-padding*2,h=w/ratio;
  b.crop(href,x+padding,y+(size-h)/2,w,h,bounds,96,96,undefined,dark?'url(#white-icon)':undefined);
}
function plan(group:Group,index:number,width:number,horizontal:boolean,compact=false):Card {
  const names=lines(group.athletes.map(a=>a.name.toUpperCase()).join(' + '),width-128,space.nameSize,700,font);
  const widths=phaseWidths(width,group.performance.applicable);
  const tableWidth=horizontal?widths[0]:width-240;
  const treatments=treatmentLines(group).flatMap(p=>lines(p.text,tableWidth,space.bodySize,400,font));
  const tableLines=horizontal?treatments:lines(`${rangeLabel(group.table)}  (${treatmentLines(group).map(p=>p.text).join(' / ')})`,tableWidth,space.bodySize,400,font);
  const rows:Row[]=[{label:'TABLE',icon:brand.icons.table,lines:tableLines,headingRange:horizontal?rangeLabel(group.table):undefined,exception:group.table.start.value===null}];
  const phaseWidth=compact&&group.performance.applicable?width/2-240:width-240;
  if(group.performance.applicable) rows.push({label:'PERFORMANCE',icon:brand.icons.performance,lines:lines(rangeLabel(group.performance),horizontal?widths[1]:phaseWidth,space.bodySize,400,font),exception:group.performance.start.value===null});
  rows.push({label:'COURT',icon:brand.icons.court,lines:lines(rangeLabel(group.court),horizontal?widths[widths.length-1]:phaseWidth,space.bodySize,400,font),exception:group.court.end.value===null});
  const noteText=[group.kind==='normal'?'':groupKind(group),group.location!=='main'||group.walkthroughState!=='none'?locationLabel(group):'',group.clock.value===null?'':`${group.clock.value}:00 ON THE CLOCK`,group.notes].filter(Boolean).join(' · ');
  const notes=noteText?lines(noteText,width-space.inset*2,22,700,font):[];
  const head=headerHeight(names);
  const body=compact&&group.performance.applicable?rowHeight(rows[0])+Math.max(...rows.slice(1).map(rowHeight)):rows.reduce((sum,r)=>sum+rowHeight(r),0);
  const height=head+(horizontal?Math.max(...rows.map(r=>r.lines.length*space.rowLeading+86)):body)+(notes.length?notes.length*space.noteLeading+space.notePadding:0)+12;
  return {group,index,names,rows,height,notes,padding:0,compact};
}
function card(b:SceneBuilder,p:Card,x:number,y:number,width:number,dark:boolean,horizontal:boolean):void {
  const ink=dark?'#FFFFFF':brand.navy,head=headerHeight(p.names),id=p.group.id;
  if(dark) b.path(`M${x+12} ${y}H${x+width}V${y+p.height-12}L${x+width-12} ${y+p.height}H${x}V${y+12}Z`,'url(#panel)','#6383A4',1);
  else b.rect(x,y,width,p.height,'#FFFFFF','#CCD4DE',6);
  b.rect(x,y,width,head,dark?'#112B49':brand.navy);
  b.path(`M${x} ${y}H${x+72}L${x+62} ${y+head}H${x}Z`,brand.red);
  b.text(String(p.index+1).padStart(2,'0'),x+20,opticalBaseline(y+head/2,30),30,'white',400,42,id,display);
  p.names.forEach((name,i)=>b.text(name,x+96,opticalBaseline(y+head/2+(i-(p.names.length-1)/2)*space.headerLeading,space.nameSize),space.nameSize,'white',700,width-120,id,font));
  let cy=y+head+(horizontal?p.padding/2:0);
  if(horizontal) {
    let rx=x+space.inset;
    const widths=phaseWidths(width,p.group.performance.applicable);
    const bodyHeight=Math.max(...p.rows.map(r=>r.lines.length*space.rowLeading+86));
    p.rows.forEach((r,i)=>{
      const rw=widths[i];
      if(i) b.line(rx-space.groupGap/2,cy+24,rx-space.groupGap/2,cy+bodyHeight-16,'#426180');
      phaseIcon(b,r.icon,rx,cy+24,space.iconSize,true);
      b.text(r.label,rx+46,opticalBaseline(cy+39,space.labelSize),space.labelSize,ink,400,rw-46,id,display);
      if(r.headingRange)b.text(r.headingRange,rx+126,opticalBaseline(cy+39,space.bodySize),space.bodySize,r.exception?'#FF91A7':ink,400,rw-126,id,font);
      r.lines.forEach((text,j)=>b.rich(exceptionParts(text),rx,cy+88+j*space.rowLeading,space.bodySize,font,r.exception?'#FF91A7':ink,rw,id));
      rx+=rw+space.groupGap;
    });
    cy+=bodyHeight+p.padding/2;
  } else {
    let pairY=cy;
    p.rows.forEach((r,i)=>{
      const parallel=p.compact&&p.group.performance.applicable&&i>0,rowPadding=p.padding/(parallel?2:p.rows.length),h=(parallel?Math.max(...p.rows.slice(1).map(rowHeight)):rowHeight(r))+rowPadding;
      if(i===1)pairY=cy;
      const ry=parallel?pairY:cy,rx=x+(parallel&&i===2?width/2:0),rw=parallel?width/2:width;
      if(i%2===1||parallel)b.rect(rx+1,ry,rw-2,h,'#F0F3F6');
      phaseIcon(b,r.icon,rx+space.inset,ry+(h-space.iconSize)/2,space.iconSize,false);
      b.text(r.label,rx+70,opticalBaseline(ry+h/2,space.labelSize),space.labelSize,ink,400,parallel?120:140,id,display);
      r.lines.forEach((text,j)=>b.rich(exceptionParts(text),rx+216,opticalBaseline(ry+h/2+(j-(r.lines.length-1)/2)*space.rowLeading,space.bodySize),space.bodySize,font,r.exception?brand.red:ink,rw-240,id));
      if(!parallel)cy+=h;
      else if(i===2)cy=pairY+Math.max(...p.rows.slice(1).map(rowHeight))+rowPadding;
    });
  }
  p.notes.forEach((note,i)=>b.text(note,x+space.inset,cy+space.notePadding+18+i*space.noteLeading,22,dark?'#BBD0E3':brand.red,700,width-space.inset*2,id,font));
}
function event(b:SceneBuilder,x:number,y:number,width:number,label:string,time:string,dark:boolean,meeting=false,height=space.eventHeight):void {
  b.path(`M${x+10} ${y}H${x+width}V${y+height-10}L${x+width-10} ${y+height}H${x}V${y+10}Z`,meeting&&!dark?brand.navy:brand.red);
  if(meeting)b.crop(brand.icons.meeting,x+24,y+(height-42)/2,42,42,iconBounds.meeting,96,96,undefined,'url(#white-icon)');
  else b.image(brand.logo,x+24,y+(height-54)/2,54,54);
  b.text(label.toUpperCase(),x+100,opticalBaseline(y+height/2-19,28),28,'white',400,width-124,undefined,display);
  b.text(time,x+100,opticalBaseline(y+height/2+19,24),24,'white',400,width-124,undefined,font);
}
function masthead(b:SceneBuilder,s:Schedule,id:ReferenceDesignId,canvasWidth=1920,canvasHeight=1080):void {
  const style=referenceDesigns[id],meta=gameMeta(s),ink=style.dark?'white':brand.navy;
  const columnWidth=style.width+(canvasWidth-1920)/2;
  b.rect(0,0,canvasWidth,canvasHeight,style.dark?'url(#arena)':'white');
  if(style.dark){
    b.image(brand.logo,canvasWidth-750,30,710,710,undefined,0.045);
    if(s.game.homeAway.value==='home')b.crop(designArt.arena,0,canvasHeight-177,1260,177,[0,834,830,107],1672,941,'url(#arena-photo)',undefined,0.72);
    b.rect(0,0,canvasWidth,canvasHeight,'url(#arena-lines)');
    b.path(`M48 32H${48+columnWidth}L${26+columnWidth} 160H48Z`,'url(#event-red)');
    b.text('PREGAME WORKOUT TIMES',80,opticalBaseline(96,84),84,'white',400,columnWidth-80,undefined,display);
  }else if(style.sidebar){
    b.rect(0,0,320,canvasHeight,'url(#sidebar)');
    b.image(brand.logo,40,44,240,240);
    b.text('LOS ANGELES',35,352,37,'white',400,250,undefined,display);
    b.text('CLIPPERS',32,442,80,'white',400,270,undefined,display);
    if(s.game.homeAway.value==='home')b.crop(designArt.sidebar,0,510,320,500,[0,480,300,340],1672,941,'url(#sidebar-photo)',undefined,0.76);
    b.text('PREGAME WORKOUT TIMES',368,opticalBaseline(96,73),73,ink,400,columnWidth,undefined,display);
    b.line(368,160,canvasWidth-48,160,brand.red,3);
  }else{
    b.image(brand.watermark,canvasWidth*.06,canvasHeight*.43,canvasWidth*.86,canvasHeight*.54,'url(#watermark-alpha)',0.55);
    b.rect(0,0,canvasWidth,canvasHeight,'url(#paper-dots)');
    b.rect(48,32,columnWidth,128,'url(#brand-ribbon)');
    b.image(brand.logo,72,52,88,88);
    b.text('PREGAME WORKOUT TIMES',184,opticalBaseline(96,76),76,'white',400,columnWidth-160,undefined,display);
  }
  const mx=canvasWidth-(style.sidebar?772:880);
  b.text(meta.date,mx,52,22,ink,700,530,undefined,font);
  b.text(meta.matchup,mx,92,30,ink,700,530,undefined,font);
  b.paragraph(meta.venue,mx,128,530,22,ink,400,28,undefined,font);
  for(const [i,logo] of [brand.logo,s.game.opponentId?opponentLogo(s.game.opponentId):null].entries()){
    b.rect(canvasWidth-244+i*104,50,92,92,style.dark?'#24415C':'#F3F5F8',style.dark?'#3E5C76':'#DEE4EC',46);
    if(logo)b.image(logo,canvasWidth-232+i*104,62,68,68);
  }
}
export function referenceDesign(s:Schedule,id:ReferenceDesignId,canvasWidth=1920):GraphicScene {
  const canvasHeight=canvasWidth*9/16,extraWidth=canvasWidth-1920,extraHeight=canvasHeight-1080;
  const b=new SceneBuilder(canvasWidth,canvasHeight),base=referenceDesigns[id],style={...base,right:base.right+extraWidth/2,width:base.width+extraWidth/2,bottom:base.bottom+extraHeight};masthead(b,s,id,canvasWidth,canvasHeight);
  const cards=s.groups.map((g,i)=>plan(g,i,style.width,style.horizontal,!style.horizontal&&s.groups.length>=10));
  const make=(split:number):[Block[],Block[]]=>{
    const left:Block[]=cards.slice(0,split).map(card=>({kind:'group',card}));
    const right:Block[]=cards.slice(split).map(card=>({kind:'group',card}));
    for(const walk of s.walkthroughs){
      const at=left.findIndex(block=>block.kind==='group'&&(block.card.group.court.start.value??Infinity)>=(walk.range.end.value??Infinity));
      left.splice(at<0?left.length:at,0,{kind:'walk',walk,height:space.eventHeight});
    }
    return [left,right];
  };
  const total=(blocks:Block[])=>blocks.reduce((sum,p)=>sum+(p.kind==='group'?p.card.height:p.height),0)+Math.max(0,blocks.length-1)*style.gap;
  const firstClock=s.groups.findIndex(g=>g.clock.value!==null);
  let split=firstClock>0?firstClock:Math.ceil(cards.length/2);
  const bottom=style.bottom;
  const capacity=bottom-style.top;
  const meetingReserve=s.meeting.enabled?space.eventHeight+space.groupGap:0;
  if(Math.max(total(make(split)[0]),total(make(split)[1])+meetingReserve)>capacity || Math.abs(total(make(split)[0])-total(make(split)[1])-meetingReserve)>180){
    split=Array.from({length:Math.max(1,cards.length-1)},(_,i)=>i+1).sort((a,c)=>Math.max(total(make(a)[0]),total(make(a)[1])+meetingReserve)-Math.max(total(make(c)[0]),total(make(c)[1])+meetingReserve))[0];
  }
  const columns=make(split);
  // Fixed rhythm keeps comparable groups consistent and preserves intentional empty space.
  const padding=0; // Deliberate fixed rhythm; unused space is not stretched into arbitrary row gaps.
  cards.forEach(card=>{card.padding=padding;card.height+=padding;});
  columns.forEach((blocks,col)=>{
    const x=col?style.right:style.left;let y=style.top;
    for(const block of blocks){
      if(block.kind==='group'){card(b,block.card,x,y,style.width,style.dark,style.horizontal);y+=block.card.height+style.gap;}
      else{event(b,x,y,style.width,block.walk.label,rangeLabel(block.walk.range),style.dark);y+=block.height+style.gap;}
    }
    if(y-(blocks.length?style.gap:0)>bottom-(col===1&&s.meeting.enabled?meetingReserve:0)+0.5)b.issue('This design needs a larger canvas to preserve readable spacing.');
    if(col===1&&s.meeting.enabled)event(b,style.right,y,style.width,'TEAM MEETING',`${s.meeting.clock.value??'?'}:00 ON THE CLOCK · ${s.meeting.time.value===null?'TIME NEEDED':formatTime(s.meeting.time.value)}`,style.dark,true);
  });
  return b.finish();
}
