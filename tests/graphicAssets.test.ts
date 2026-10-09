import {describe,it,expect} from 'vitest';
import {opponentLogo,iconBounds} from '../src/config/graphicAssets';
import {referenceDesign} from '../src/graphic/referenceDesign';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {parseSchedule} from '../src/parser/deterministicParser';
import {currentRosterExample} from '../src/fixtures/samples';
import {brand} from '../src/config/brand';
import {SceneBuilder} from '../src/graphic/scene';
describe('image composition',()=>{
  it('rejects invalid artwork crops instead of silently clipping',()=>{
    const builder=new SceneBuilder();builder.crop('/assets/table.svg',0,0,20,20,[90,90,20,20],96,96);
    expect(builder.finish().diagnostics.some(d=>d.severity==='error')).toBe(true);
  });
  it('uses local vector replacements for all six fixture opponents',()=>{
    for(const id of ['warriors','thunder','kings','trailblazers','pacers','raptors'])expect(opponentLogo(id)).toBe(`/assets/logos/${id}.svg`);
    expect(opponentLogo('celtics')).toBe('/assets/logos/celtics.svg');
    expect(opponentLogo('loong-lions')).toBe('/assets/loong-lions.png');
  });
  it('fits normalized icon artwork without distorting its aspect ratio',()=>{
    const scene=referenceDesign(resolveSchedule(parseSchedule(currentRosterExample.text)),'reference-4');
    for(const key of ['table','performance','court'] as const){
      const icons=scene.elements.filter(e=>e.kind==='crop-image'&&e.href===brand.icons[key]);
      expect(icons.length).toBeGreaterThan(0);
      for(const icon of icons)if(icon.kind==='crop-image'){
        expect(icon.crop).toEqual(iconBounds[key]);
        expect(icon.width/icon.height).toBeCloseTo(icon.crop[2]/icon.crop[3]);
        expect(icon.sourceWidth).toBe(96);
      }
    }
  });
  it('fades reference photographs and converts the opaque watermark to alpha',()=>{
    const schedule=resolveSchedule(parseSchedule(currentRosterExample.text));
    const arena=referenceDesign(schedule,'reference-4');
    expect(arena.elements).toContainEqual(expect.objectContaining({kind:'crop-image',mask:'url(#arena-photo)',opacity:0.72}));
    for(const design of ['reference-1','reference-2'] as const){
      const scene=referenceDesign(schedule,design);
      expect(scene.elements).toContainEqual(expect.objectContaining({kind:'image',href:brand.watermark,filter:'url(#watermark-alpha)',opacity:0.78}));
      expect(scene.elements.some(element=>element.kind==='rect'&&element.fill==='#FFFFFF'&&element.opacity===0.70)).toBe(true);
    }
  });
});
