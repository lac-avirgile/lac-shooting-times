import { describe, expect, it } from 'vitest';
import { buildLayout,adaptiveOriginalLayout } from '../src/graphic/layout';
import { resolveSchedule } from '../src/scheduler/scheduleEngine';
import { parseSchedule } from '../src/parser/deterministicParser';
import { samples } from '../src/fixtures/samples';
describe('layout measurement and fit', () => {
  it('fits every supplied schedule without removing groups', () => {
    samples.forEach(sample => {
      const s = resolveSchedule(parseSchedule(sample.text));
      const layout = adaptiveOriginalLayout(s);
      expect(layout.diagnostics).toEqual([]);
      expect(layout.blocks.filter(b => b.type === 'group')).toHaveLength(s.groups.length);
      expect(layout.blocks.every(b => b.y >= 176 && b.y + b.height <= layout.height-84)).toBe(true);
      expect(layout.width/layout.height).toBe(16/9);
      expect(layout.bodySize).toBe(26);
    });
  });
  it('reports overflow for schedules too large to fit', () => {
    const s = resolveSchedule(parseSchedule(samples[2].text));
    s.groups.push(...Array.from({length:12},(_,i) => ({...structuredClone(s.groups[0]),id:`extra-${i}`})));
    expect(buildLayout(s).diagnostics.some(d => d.code === 'visual-overflow')).toBe(true);
  });
  it('wraps large Stay Ready headers and treatment annotations', () => {
    const s = resolveSchedule(parseSchedule(samples[2].text));
    s.groups[0].kind = 'stay-ready'; s.groups[0].athletes.push(...structuredClone(s.groups[1].athletes));
    const block = buildLayout(s).blocks.find(b => b.type === 'group' && b.number === 1);
    expect(block?.type === 'group' && block.header.length > 1).toBe(true);
  });
});
