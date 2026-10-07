import { describe, expect, it } from 'vitest';
import { withPngDensity } from '../src/graphic/pngDensity';
import { exportPresets, templates } from '../src/config/templates';

function minimalPng(): Uint8Array {
  const bytes = new Uint8Array(45);
  const data = new DataView(bytes.buffer);
  data.setUint32(0, 0x89504e47); data.setUint32(4, 0x0d0a1a0a);
  data.setUint32(8, 13); data.setUint32(12, 0x49484452);
  data.setUint32(16, 8000); data.setUint32(20, 4500);
  data.setUint32(37, 0x49454e44);
  return bytes;
}
describe('PNG export quality', () => {
  it('preserves pixel dimensions and adds 300 DPI in metres', () => {
    const original = minimalPng(); const output = withPngDensity(original);
    const view = new DataView(output.buffer);
    expect([...output.subarray(0,33)]).toEqual([...original.subarray(0,33)]);
    expect(view.getUint32(37)).toBe(0x70485973);
    expect(view.getUint32(41)).toBe(11811);
    expect(view.getUint32(45)).toBe(11811);
    expect(output[49]).toBe(1);
    expect(view.getUint32(50)).toBe(0x78a53f76); // CRC of 300-DPI pHYs payload
    expect([...output.subarray(54)]).toEqual([...original.subarray(33)]);
  });
  it('replaces density without creating duplicate chunks', () => {
    const result = withPngDensity(withPngDensity(minimalPng(),72),300);
    expect(result).toEqual(withPngDensity(minimalPng(),300));
  });
  it('rejects invalid input or DPI', () => {
    expect(() => withPngDensity(new Uint8Array(8))).toThrow('Invalid PNG');
    expect(() => withPngDensity(minimalPng(),0)).toThrow('Invalid DPI');
  });
  it('offers the optimized new design plus original and exact 16:9 presets', () => {
    expect(templates.map(t => t.id)).toEqual(['reference','reference-1','reference-2','reference-4']);
    expect(exportPresets.find(p => p.id === 'ultra')).toMatchObject({width:8000,height:4500});
    exportPresets.forEach(p => expect(p.width/p.height).toBe(16/9));
  });
});
