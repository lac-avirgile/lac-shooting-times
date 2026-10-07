// PNG pHYs uses pixels/metre. Resolution metadata does not resample the image.
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export function withPngDensity(bytes: Uint8Array, dpi = 300): Uint8Array {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 33 || view.getUint32(0) !== 0x89504e47 || view.getUint32(12) !== 0x49484452) throw new Error('Invalid PNG');
  if (!Number.isFinite(dpi) || dpi <= 0) throw new Error('Invalid DPI');
  const chunk = new Uint8Array(21);
  const data = new DataView(chunk.buffer);
  data.setUint32(0, 9);
  chunk.set([112, 72, 89, 115], 4); // pHYs
  const pixelsPerMetre = Math.round(dpi / 0.0254);
  data.setUint32(8, pixelsPerMetre); data.setUint32(12, pixelsPerMetre); chunk[16] = 1;
  data.setUint32(17, crc32(chunk.subarray(4, 17)));
  const parts: Uint8Array[] = [bytes.subarray(0, 33), chunk];
  let offset = 33;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) throw new Error('Truncated PNG');
    const length = view.getUint32(offset) + 12;
    if (offset + length > bytes.length) throw new Error('Truncated PNG');
    if (view.getUint32(offset + 4) !== 0x70485973) parts.push(bytes.subarray(offset, offset + length));
    offset += length;
  }
  const result = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
  let cursor = 0;
  parts.forEach(part => { result.set(part, cursor); cursor += part.length; });
  return result;
}
