import type { Schedule } from '../domain/models';
import type { ReferenceDesignId } from '../config/referenceDesigns';
import { referenceDesign } from './referenceDesign';
import type { GraphicScene } from './scene';

/** More content gets a larger 16:9 canvas, not smaller type or missing players. */
export function adaptiveDesign(schedule:Schedule,id:ReferenceDesignId):GraphicScene {
  let width=1920,scene:GraphicScene;
  do {
    scene=referenceDesign(schedule,id,width);
    if(!scene.diagnostics.some(issue=>issue.severity==='error'))return scene;
    width+=320;
  }while(width<=16384);
  return scene;
}
