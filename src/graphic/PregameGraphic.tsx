import { forwardRef } from 'react';
import { brand } from '../config/brand';
import type { Schedule } from '../domain/models';
import { formatTime } from '../domain/time';
import type { GroupPlan, Layout, TextPart, WalkPlan } from './layout';
import { wrapParts } from './layout';
import { dateLabel, type GraphicScene } from './scene';
import { SceneGraphic } from './SceneGraphic';
import {opponentLogo} from '../config/graphicAssets';
import {graphicSpacing as space,opticalBaseline} from '../config/graphicSpacing';
import {originalDesign as original} from '../config/originalDesign';

function SvgLine({parts,x,y,size}:{parts:TextPart[];x:number;y:number;size:number}) {
  return <text x={x} y={y} fontFamily={original.bodyFont} fontSize={size} fill={brand.navy}>{parts.map((part,index)=><tspan key={index} fill={part.color} fontWeight={part.bold?700:400}>{part.text}</tspan>)}</text>;
}
function GroupBlock({plan,width}:{plan:GroupPlan;width:number}) {
  const headerHeight=Math.max(original.headerHeight,plan.header.length*original.headerLeading+24);
  let rowY=plan.y+headerHeight;
  let parallelY=rowY;
  return <g data-block={plan.group.id}>
    <rect x={plan.x} y={plan.y} width={width} height={plan.height} fill="white" fillOpacity={original.cardOpacity} stroke="#D2D9E4" rx="6" filter="url(#original-card-shadow)"/>
    <rect data-player-header="true" x={plan.x} y={plan.y} width={width} height={headerHeight} fill="url(#original-navy)"/>
    <rect x={plan.x} y={plan.y} width="5" height={headerHeight} fill={brand.red}/>
    {plan.header.map((line,i)=><text key={i} x={plan.x+28} y={opticalBaseline(plan.y+headerHeight/2+(i-(plan.header.length-1)/2)*original.headerLeading,original.nameSize)} fontSize={original.nameSize} fontFamily={brand.headerFont} fontWeight="700" fill="white">{line}</text>)}
    {plan.rows.map(row=>{if(row.phase==='performance')parallelY=rowY;const y=row.xOffset?parallelY:rowY;const paired=plan.compact&&plan.group.performance.applicable&&row.phase!=='table';const h=paired?Math.max(...plan.rows.filter(r=>r.phase!=='table').map(r=>r.height)):row.height;if(!row.xOffset)rowY+=h;return <g key={row.phase} data-phase={row.phase}>
      {row.phase!=='table'&&<rect x={plan.x+row.xOffset+1} y={y} width={(paired?width/2:width)-2} height={h} fill="#EDF1F7" fillOpacity="0.48"/>}
      <image href={brand.icons[row.phase]} x={plan.x+row.xOffset+space.inset} y={y+(h-space.iconSize)/2} width={space.iconSize} height={space.iconSize}/>
      {row.lines.map((line,index)=><SvgLine key={index} parts={line} x={plan.x+row.xOffset+70} y={opticalBaseline(y+h/2+(index-(row.lines.length-1)/2)*original.rowLeading,original.bodySize)} size={original.bodySize}/>)}</g>;})}
  </g>;
}
function WalkthroughCard({plan,width}:{plan:WalkPlan;width:number}) {
  return <g data-block={plan.id}>
    <rect x={plan.x} y={plan.y} width={width} height={plan.height} fill={brand.red} rx="6"/>
    <image href={brand.logo} x={plan.x+24} y={plan.y+(plan.height-54)/2} width="54" height="54"/>
    <text x={plan.x+100} y={opticalBaseline(plan.y+plan.height/2-19,28)} fill="white" fontFamily={brand.bodyFont} fontSize="28" fontWeight="700">{plan.label}</text>
    <text x={plan.x+100} y={opticalBaseline(plan.y+plan.height/2+19,24)} fill="white" fontFamily={brand.bodyFont} fontSize="24">{plan.time}</text>
  </g>;
}
export const PregameGraphic=forwardRef<SVGSVGElement,{schedule:Schedule;layout:Layout;scene?:GraphicScene|null}>(function PregameGraphic({schedule,layout,scene},ref){
  const gameLine=`${dateLabel(schedule.game.date)} ${schedule.game.homeAway.value==='away'?'AT':schedule.game.homeAway.value==='home'?'VS.':'HOME/AWAY NEEDED'} ${schedule.game.opponent.value?.toUpperCase()??'OPPONENT NEEDED'}`;
  const venueLines=wrapParts([{text:`${formatTime(schedule.game.tip.value)} TIP · ${schedule.game.venue.value??'VENUE NEEDED'} (${schedule.game.city.value??'CITY NEEDED'})`}],660,original.metadataSize,original.bodyFont);
  const width=scene?.width??layout.width,height=scene?.height??layout.height,right=layout.width/2+space.gutter/2;
  const meetingY=Math.max(176,...layout.blocks.filter(block=>block.x===right).map(block=>block.y+block.height+space.groupGap));
  return <svg ref={ref} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="Pregame workout schedule" className="pregame-graphic">
    {scene?<SceneGraphic scene={scene}/>:<>
      <defs>
        <linearGradient id="original-navy"><stop stopColor="#12173F"/><stop offset="1" stopColor="#243656"/></linearGradient>
        <linearGradient id="original-red" x2="1" y2="0.3"><stop stopColor="#D31036"/><stop offset="1" stopColor="#AE0828"/></linearGradient>
        <radialGradient id="original-halo"><stop stopColor="#C8102E" stopOpacity="0.08"/><stop offset="1" stopColor="#C8102E" stopOpacity="0"/></radialGradient>
        <filter id="original-card-shadow" x="-5%" y="-15%" width="110%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#12173F" floodOpacity="0.08"/></filter>
        <filter id="original-red-glow" x="-10%" y="-40%" width="120%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="10" floodColor="#C8102E" floodOpacity="0.16"/></filter>
        <filter id="original-watermark" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.07 0 0 0 0 0.09 0 0 0 0 0.25 -0.2126 -0.7152 -0.0722 0 1"/><feComposite operator="in" in2="SourceGraphic"/></filter>
        <filter id="original-white-icon"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>
      </defs>
      <rect width={width} height={height} fill="white"/>
      <ellipse cx={width*.8} cy={height*.8} rx={width*.55} ry={height*.7} fill="url(#original-halo)"/>
      <image href={brand.watermark} x={width*.06} y={height*.20} width={width*.86} height={height*.60} opacity={original.watermarkOpacity} filter="url(#original-watermark)" preserveAspectRatio="xMidYMid meet"/>
      <rect x="48" y="32" width={layout.columnWidth} height="100" fill="url(#original-red)" filter="url(#original-red-glow)"/>
      <text x={48+layout.columnWidth/2} y={opticalBaseline(82,brand.titleSize)} textAnchor="middle" fill="white" fontFamily={brand.titleFont} fontWeight="900" fontSize={brand.titleSize}>PREGAME WORKOUT TIMES</text>
      <g transform={`translate(${width-1920},16)`}>
      <text x="1012" y="36" fill={brand.red} fontFamily={brand.titleFont} fontWeight="900" fontSize="24">{schedule.game.label?.trim()||(schedule.game.number?`GAME ${schedule.game.number}`:'PREGAME')}</text>
      <text x="1012" y="65" fill="black" fontFamily={brand.titleFont} fontWeight="900" fontSize={gameLine.length>57?20:23}>{gameLine}</text>
      {venueLines.map((line,index)=><text key={index} x="1012" y={96+index*28} fill={brand.navy} fontFamily={original.bodyFont} fontSize={original.metadataSize}>{line.map(part=>part.text).join('')}</text>)}
      <rect x="1692" y="26" width="90" height="82" fill="#F3F5F9" stroke="#D2D9E4" rx="8"/><rect x="1802" y="26" width="90" height="82" fill="#F3F5F9" stroke="#D2D9E4" rx="8"/>
      {schedule.game.opponentId&&<image href={opponentLogo(schedule.game.opponentId)} x="1700" y="34" width="74" height="66" preserveAspectRatio="xMidYMid meet"/>}
      <image href={brand.logo} x="1810" y="30" width="74" height="74"/>
      </g>
      {layout.blocks.map(block=>block.type==='group'?<GroupBlock key={block.group.id} plan={block} width={layout.columnWidth}/>:<WalkthroughCard key={block.id} plan={block} width={layout.columnWidth}/>)}
      {schedule.meeting.enabled&&<g data-block="meeting">
        <rect x={right} y={meetingY} width={layout.columnWidth} height={space.eventHeight} fill="url(#original-red)" rx="6" filter="url(#original-red-glow)"/>
        <image href={brand.icons.meeting} x={right+24} y={meetingY+space.eventHeight/2-23} width="46" height="46" filter="url(#original-white-icon)"/>
        <text x={right+100} y={opticalBaseline(meetingY+space.eventHeight/2-19,28)} fill="white" fontFamily={brand.bodyFont} fontWeight="700" fontSize="28">TEAM MEETING</text>
        <text x={right+100} y={opticalBaseline(meetingY+space.eventHeight/2+19,26)} fill="white" fontFamily={original.bodyFont} fontWeight="400" fontSize="26">{schedule.meeting.clock.value??'?'}:00 ON THE CLOCK · {schedule.meeting.time.value===null?'TIME NEEDED':formatTime(schedule.meeting.time.value)}</text>
      </g>}
    </>}
  </svg>;
});
