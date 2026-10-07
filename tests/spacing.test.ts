import {describe,expect,it} from 'vitest';
import {graphicSpacing as space,opticalBaseline} from '../src/config/graphicSpacing';
import {referenceDesigns,type ReferenceDesignId} from '../src/config/referenceDesigns';
import {adaptiveDesign} from '../src/graphic/adaptiveDesign';
import {adaptiveOriginalLayout} from '../src/graphic/layout';
import {resolveSchedule} from '../src/scheduler/scheduleEngine';
import {parseSchedule} from '../src/parser/deterministicParser';
import {hawaiiGame} from '../src/fixtures/hawaii';
import {brand} from '../src/config/brand';

describe('shared spacious graphic rhythm',()=>{
  it('uses generous consistent margins, padding and group gaps',()=>{
    expect(space.margin).toBe(48);expect(space.inset).toBe(24);expect(space.groupGap).toBe(24);
    for(const style of Object.values(referenceDesigns))expect(style.gap).toBe(space.groupGap);
    const layout=adaptiveOriginalLayout(resolveSchedule(parseSchedule(hawaiiGame.text)));
    expect(layout.bodySize).toBe(26);expect(layout.diagnostics).toEqual([]);
    for(const x of [...new Set(layout.blocks.map(block=>block.x))]){
      const column=layout.blocks.filter(block=>block.x===x);
      for(let i=1;i<column.length;i++)expect(column[i].y-column[i-1].y-column[i-1].height).toBe(space.groupGap);
    }
  });
  it.each(Object.keys(referenceDesigns) as ReferenceDesignId[])('%s optically centers single-line names with room on both edges',id=>{
    const schedule=resolveSchedule(parseSchedule(hawaiiGame.text)),scene=adaptiveDesign(schedule,id);
    expect(scene.diagnostics).toEqual([]);
    for(const group of schedule.groups){
      const names=scene.elements.filter(node=>node.kind==='text'&&node.block===group.id&&node.weight===700&&node.fill==='white');
      expect(names.length).toBeGreaterThan(0);
      for(const node of names){if(node.kind!=='text')continue;
        const head=scene.elements.find(element=>element.kind==='rect'&&(element.fill===brand.navy||element.fill==='#112B49')&&node.x>element.x&&node.x<element.x+element.width&&node.y>element.y&&node.y<element.y+element.height);
        expect(head).toBeDefined();if(head?.kind!=='rect')continue;
        expect(node.x-head.x).toBe(96);
        if(names.length===1)expect(node.y).toBeCloseTo(opticalBaseline(head.y+head.height/2,space.nameSize));
        expect(head.height).toBeGreaterThanOrEqual(space.headerHeight);
      }
    }
    const timings=scene.elements.filter(node=>node.kind==='text'&&node.block&&node.weight===400&&node.font===brand.condensedFont);
    expect(timings.every(node=>node.kind==='text'&&node.size===24)).toBe(true);
  });
});
