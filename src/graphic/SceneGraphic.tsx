import type { GraphicScene } from './scene';

export function SceneGraphic({scene}:{scene:GraphicScene}) {
  return <>
    <defs>
      <linearGradient id="arena" x2="1" y2="1"><stop stopColor="#071A34"/><stop offset="1" stopColor="#16304C"/></linearGradient>
      <linearGradient id="brand-ribbon"><stop stopColor="#101D40"/><stop offset="0.65" stopColor="#192342"/><stop offset="1" stopColor="#C8102E"/></linearGradient>
      <linearGradient id="sidebar" x2="0.7" y2="1"><stop stopColor="#0C1C37"/><stop offset="0.55" stopColor="#203250"/><stop offset="1" stopColor="#B70E2A"/></linearGradient>
      <linearGradient id="panel"><stop stopColor="#122A48"/><stop offset="1" stopColor="#0B1D36"/></linearGradient>
      <linearGradient id="event-red"><stop stopColor="#D31036"/><stop offset="1" stopColor="#AE0828"/></linearGradient>
      <pattern id="arena-lines" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 12L12 0" stroke="#FFFFFF" strokeOpacity="0.025"/></pattern>
      <pattern id="paper-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="0.7" fill="#172745" opacity="0.06"/></pattern>
      <filter id="white-icon"><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0"/></filter>
      <filter id="watermark-alpha" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0.07 0 0 0 0 0.09 0 0 0 0 0.25 -0.2126 -0.7152 -0.0722 0 1"/><feComposite operator="in" in2="SourceGraphic"/></filter>
      <linearGradient id="photo-vertical" x1="0" y1="0" x2="0" y2="1"><stop stopColor="black"/><stop offset="0.18" stopColor="white"/><stop offset="0.6" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
      <linearGradient id="photo-horizontal"><stop stopColor="white"/><stop offset="0.65" stopColor="white"/><stop offset="1" stopColor="black"/></linearGradient>
      <mask id="sidebar-photo" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#photo-vertical)"/></mask>
      <mask id="arena-photo" maskContentUnits="objectBoundingBox"><rect width="1" height="1" fill="url(#photo-horizontal)" mask="url(#sidebar-photo)"/></mask>
    </defs>
    {scene.elements.map((element,index)=>{
      if(element.kind==='rect') return <rect key={index} x={element.x} y={element.y} width={element.width} height={element.height} fill={element.fill} stroke={element.stroke} rx={element.radius} opacity={element.opacity}/>;
      if(element.kind==='line') return <line key={index} x1={element.x1} y1={element.y1} x2={element.x2} y2={element.y2} stroke={element.stroke} strokeWidth={element.width}/>;
      if(element.kind==='path') return <path key={index} d={element.d} fill={element.fill} stroke={element.stroke} strokeWidth={element.width} opacity={element.opacity}/>;
      if(element.kind==='image') return <image key={index} href={element.href} x={element.x} y={element.y} width={element.width} height={element.height} preserveAspectRatio="xMidYMid meet" filter={element.filter} opacity={element.opacity}/>;
      if(element.kind==='crop-image') return <g key={index}>
        {element.mask&&<defs><mask id={`crop-mask-${index}`} maskUnits="userSpaceOnUse" x={element.x} y={element.y} width={element.width} height={element.height}><rect x={element.x} y={element.y} width={element.width} height={element.height} fill="white" mask={element.mask}/></mask></defs>}
        <g mask={element.mask?`url(#crop-mask-${index})`:undefined} opacity={element.opacity}><svg x={element.x} y={element.y} width={element.width} height={element.height} viewBox={element.crop.join(' ')} preserveAspectRatio="xMidYMid slice" overflow="hidden" filter={element.filter}><image href={element.href} x="0" y="0" width={element.sourceWidth} height={element.sourceHeight} preserveAspectRatio="xMidYMid meet"/></svg></g>
      </g>;
      return <text key={index} data-block={element.block} x={element.x} y={element.y} fontFamily={element.font} fontWeight={element.weight} fontSize={element.size} fill={element.fill}>{element.parts?element.parts.map((part,i)=><tspan key={i} fill={part.color} fontWeight={part.bold?700:400}>{part.text}</tspan>):element.text}</text>;
    })}
  </>;
}
