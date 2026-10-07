import { brand } from '../config/brand';
import type { Diagnostic, Range, Schedule } from '../domain/models';
import { formatTime } from '../domain/time';
import { wrapParts, type TextPart } from './layout';

export type SceneElement =
  | {kind:'rect';x:number;y:number;width:number;height:number;fill:string;stroke?:string;radius?:number;opacity?:number}
  | {kind:'line';x1:number;y1:number;x2:number;y2:number;stroke:string;width:number}
  | {kind:'path';d:string;fill:string;stroke?:string;width?:number}
  | {kind:'text';x:number;y:number;text:string;size:number;fill:string;weight:number;font:string;parts?:TextPart[];block?:string}
  | {kind:'crop-image';x:number;y:number;width:number;height:number;href:string;crop:[number,number,number,number];sourceWidth:number;sourceHeight:number;mask?:string;filter?:string;opacity?:number}
  | {kind:'image';x:number;y:number;width:number;height:number;href:string;filter?:string;opacity?:number};
export interface GraphicScene { elements: SceneElement[]; diagnostics: Diagnostic[]; width?:number; height?:number }
let canvas: CanvasRenderingContext2D | null=null;
export function measure(text:string,size:number,weight=400,font=brand.bodyFont):number {
  if(typeof document!=='undefined') {
    canvas??=document.createElement('canvas').getContext('2d');
    if(canvas) {canvas.font=`${weight} ${size}px ${font}`;return canvas.measureText(text).width;}
  }
  return text.length*size*(font.includes('Bebas Neue')?0.36:font.includes('Roboto Condensed')?(weight>=700?0.48:0.43):(weight>=700?0.56:0.51));
}
export function lines(text:string,width:number,size:number,weight=400,font=brand.bodyFont):string[] {
  return wrapParts([{text,bold:weight>=700}],width,size,font).map(line=>line.map(p=>p.text).join('').trim());
}
export function rangeLabel(range:Range):string {
  if(!range.applicable) return 'NOT SCHEDULED';
  return `${range.start.value===null?'START NEEDED':formatTime(range.start.value)}–${range.end.value===null?'END NEEDED':formatTime(range.end.value)}`;
}
export class SceneBuilder {
  constructor(private width=1920,private height=1080){}
  elements:SceneElement[]=[];
  diagnostics:Diagnostic[]=[];
  rect(x:number,y:number,width:number,height:number,fill:string,stroke?:string,radius?:number,opacity?:number):void {this.elements.push({kind:'rect',x,y,width,height,fill,stroke,radius,opacity});}
  line(x1:number,y1:number,x2:number,y2:number,stroke:string,width=1):void {this.elements.push({kind:'line',x1,y1,x2,y2,stroke,width});}
  path(d:string,fill:string,stroke?:string,width?:number):void {this.elements.push({kind:'path',d,fill,stroke,width});}
  image(href:string,x:number,y:number,width:number,height:number,filter?:string,opacity?:number):void {this.elements.push({kind:'image',href,x,y,width,height,filter,opacity});}
  crop(href:string,x:number,y:number,width:number,height:number,crop:[number,number,number,number],sourceWidth=1672,sourceHeight=941,mask?:string,filter?:string,opacity?:number):void {
    this.elements.push({kind:'crop-image',href,x,y,width,height,crop,sourceWidth,sourceHeight,mask,filter,opacity});
    if(width<=0||height<=0||crop[0]<0||crop[1]<0||crop[2]<=0||crop[3]<=0||crop[0]+crop[2]>sourceWidth||crop[1]+crop[3]>sourceHeight) this.issue('Image crop exceeds its source artwork or has invalid dimensions.');
  }
  text(text:string,x:number,y:number,size:number,fill=brand.navy,weight=400,maxWidth=1920-x,block?:string,font=brand.bodyFont):void {
    size=Math.max(size,brand.minGraphicFontSize);
    this.elements.push({kind:'text',text,x,y,size,fill,weight,block,font});
    if(measure(text,size,weight,font)>maxWidth+1 || y>this.height-8 || x<0 || y-size<0) this.issue('Text exceeds this design’s available space. Shorten notes or select another design.',block);
  }
  rich(parts:TextPart[],x:number,y:number,size:number,font:string,fill:string,maxWidth:number,block?:string):void {
    size=Math.max(size,brand.minGraphicFontSize);
    const text=parts.map(part=>part.text).join('');
    this.elements.push({kind:'text',x,y,size,font,fill,weight:400,parts,text,block});
    if(parts.reduce((width,part)=>width+measure(part.text,size,part.bold?700:400,font),0)>maxWidth+1 || y>this.height-8) this.issue('Text exceeds this design’s available space. Shorten notes or select another design.',block);
  }
  paragraph(text:string,x:number,y:number,width:number,size:number,fill=brand.navy,weight=400,leading=size+4,block?:string,font=brand.bodyFont):number {
    size=Math.max(size,brand.minGraphicFontSize);
    const wrapped=lines(text,width,size,weight,font);
    wrapped.forEach((line,i)=>this.text(line,x,y+i*leading,size,fill,weight,width,block,font));
    return wrapped.length*leading;
  }
  issue(message:string,groupId?:string):void {
    if(!this.diagnostics.some(d=>d.message===message && d.groupId===groupId)) this.diagnostics.push({code:'design-overflow',severity:'error',message,groupId});
  }
  finish():GraphicScene {return {elements:this.elements,diagnostics:this.diagnostics,width:this.width,height:this.height};}
}
export function dateLabel(date:string):string {
  const value=new Date(`${date}T12:00:00`);
  return Number.isNaN(value.valueOf())?'DATE NEEDED':value.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}).toUpperCase();
}
export function gameMeta(schedule:Schedule):{date:string;matchup:string;venue:string} {
  return {date:`${dateLabel(schedule.game.date)}${schedule.game.label?.trim()?` · ${schedule.game.label.trim()}`:schedule.game.number?` · GAME ${schedule.game.number}`:''}`,
    matchup:`${schedule.game.homeAway.value==='home'?'VS.':schedule.game.homeAway.value==='away'?'AT':'HOME/AWAY NEEDED'} ${(schedule.game.opponent.value??'OPPONENT NEEDED').toUpperCase()}`,
    venue:`${formatTime(schedule.game.tip.value)} TIP · ${schedule.game.venue.value??'VENUE NEEDED'} · ${schedule.game.city.value??'CITY NEEDED'}`};
}
export function events(b:SceneBuilder,schedule:Schedule,y:number,background=brand.navy):void {
  const blocks=[...schedule.walkthroughs.map(w=>({label:w.label,time:rangeLabel(w.range)})),
    ...(schedule.meeting.enabled?[{label:'TEAM MEETING',time:`${schedule.meeting.clock.value??'?'}:00 ON THE CLOCK · ${formatTime(schedule.meeting.time.value)}`}]:[])];
  if(!blocks.length) return;
  const gap=16,width=(1800-gap*(blocks.length-1))/blocks.length;
  blocks.forEach((block,i)=>{
    const x=60+i*(width+gap);
    b.rect(x,y,width,58,background);b.rect(x,y,6,58,brand.red);
    b.text(block.label,x+22,y+21,16,'white',700,width-44);
    b.text(block.time,x+22,y+49,20,'white',700,width-44);
  });
}
