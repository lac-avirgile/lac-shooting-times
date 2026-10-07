import { brand } from '../config/brand';
import { exportPresets, type ExportPresetId } from '../config/templates';
import type { Schedule } from '../domain/models';
import { withPngDensity } from './pngDensity';

const assetCache = new Map<string, Promise<string>>();
export function exportDimensions(viewWidth:number,preset:ExportPresetId='standard'):{width:number;height:number} {
  const dimensions=exportPresets.find(option=>option.id===preset)??exportPresets[0];
  const width=Math.max(dimensions.width,Math.ceil((viewWidth*(dimensions.width/brand.width)-1e-7)/16)*16);
  return {width,height:width*9/16};
}
function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Asset decode failed'));
    reader.onerror = () => reject(new Error('Asset read failed'));
    reader.readAsDataURL(blob);
  });
}
async function fetchAsset(url: string): Promise<string> {
  let task = assetCache.get(url);
  if (!task) {
    task = fetch(url).then(async response => {
      if (!response.ok) throw new Error(`Asset unavailable: ${url}`);
      return asDataUrl(await response.blob());
    });
    assetCache.set(url, task);
    task.catch(() => assetCache.delete(url));
  }
  return task;
}
export async function renderPng(svg: SVGSVGElement, preset: ExportPresetId = 'standard'): Promise<Blob> {
  await document.fonts.ready;
  // Canvas uses the document's loaded/local fonts. Chromium can omit heavy text
  // when webfonts are embedded inside an SVG image. Draw each SVG text run using
  // the same browser font engine after rasterizing the shapes and approved assets.
  const textNodes = Array.from(svg.querySelectorAll('text'));
  await Promise.all(textNodes.map(node => {
    const style = getComputedStyle(node);
    return document.fonts.load(`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`);
  }));
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute('class');
  clone.querySelectorAll('text').forEach(node => node.remove());
  const images = Array.from(clone.querySelectorAll('image'));
  await Promise.all(images.map(async node => {
    const href = node.getAttribute('href');
    if (!href) throw new Error('Missing graphic asset');
    node.setAttribute('href', await fetchAsset(href));
  }));
  const source = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' });
  const sourceUrl = URL.createObjectURL(source);
  try {
    const img = new Image();
    img.src = sourceUrl;
    await img.decode();
    const canvas = document.createElement('canvas');
    const viewWidth=svg.viewBox.baseVal.width||brand.width,viewHeight=svg.viewBox.baseVal.height||brand.height;
    // Preserve physical 10pt minimum even when the renderer grows its 16:9 canvas.
    const dimensions=exportDimensions(viewWidth,preset);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser does not support PNG export.');
    context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    context.save();
    context.scale(canvas.width / viewWidth, canvas.height / viewHeight);
    context.textBaseline = 'alphabetic';
    const rootMatrix=svg.getScreenCTM();
    if(!rootMatrix)throw new Error('The graphic must be visible before exporting.');
    const screenToRoot=rootMatrix.inverse();
    textNodes.forEach(node => {
      const nodeMatrix=node.getScreenCTM();
      if(!nodeMatrix)throw new Error('Unable to locate a text element for export.');
      const transform=screenToRoot.multiply(nodeMatrix);
      context.save();
      context.transform(transform.a,transform.b,transform.c,transform.d,transform.e,transform.f);
      const style = getComputedStyle(node);
      const x = Number(node.getAttribute('x') ?? 0);
      const y = Number(node.getAttribute('y') ?? 0);
      const children = Array.from(node.querySelectorAll('tspan'));
      const runs = children.length ? children : [node];
      const measured = runs.map(run => {
        const runStyle = getComputedStyle(run);
        context.font = `${runStyle.fontWeight} ${runStyle.fontSize} ${runStyle.fontFamily}`;
        return {run,style:runStyle,width:context.measureText(run.textContent ?? '').width};
      });
      const totalWidth = measured.reduce((n, run) => n + run.width, 0);
      let cursor = x - (style.textAnchor === 'middle' ? totalWidth / 2 : style.textAnchor === 'end' ? totalWidth : 0);
      measured.forEach(({run,style:runStyle,width}) => {
        context.font = `${runStyle.fontWeight} ${runStyle.fontSize} ${runStyle.fontFamily}`;
        context.fillStyle = runStyle.fill;
        context.fillText(run.textContent ?? '', cursor, y);
        if (runStyle.textDecorationLine.includes('underline')) {
          context.fillRect(cursor, y + 3, width, Math.max(1, parseFloat(runStyle.fontSize) / 18));
        }
        cursor += width;
      });
      context.restore();
    });
    context.restore();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG encoding failed')), 'image/png'));
    const pixels = withPngDensity(new Uint8Array(await blob.arrayBuffer()));
    return new Blob([new Uint8Array(pixels).buffer], { type: 'image/png' });
  } finally { URL.revokeObjectURL(sourceUrl); }
}
export function filename(schedule: Schedule): string {
  const opponent = schedule.game.opponentId ?? schedule.game.opponent.value ?? 'opponent';
  const name = opponent.replace(/[^a-z0-9-]/gi, '_');
  return `${schedule.game.date}_${schedule.game.homeAway.value === 'away' ? 'at' : 'vs'}_${name}_pregame-workout.png`;
}
export async function downloadPng(svg: SVGSVGElement, schedule: Schedule, preset: ExportPresetId): Promise<void> {
  const blob = await renderPng(svg, preset);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename(schedule); anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
