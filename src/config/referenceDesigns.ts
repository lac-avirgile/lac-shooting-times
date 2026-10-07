import {brand} from './brand';
import {graphicSpacing as space} from './graphicSpacing';
export const referenceDesigns = {
  'reference-1': {left:space.margin,right:984,width:888,top:192,bottom:1032,gap:space.groupGap,dark:false,horizontal:false,sidebar:false},
  'reference-2': {left:368,right:1144,width:728,top:192,bottom:1032,gap:space.groupGap,dark:false,horizontal:false,sidebar:true},
  'reference-4': {left:space.margin,right:984,width:888,top:192,bottom:1032,gap:space.groupGap,dark:true,horizontal:true,sidebar:false},
} as const;
export type ReferenceDesignId=keyof typeof referenceDesigns;
export const designArt={sidebar:'/assets/reference-art-2.png',arena:'/assets/reference-art-4.png'};
export const designTypography={display:brand.displayFont,body:brand.condensedFont};
