/** Prepared assets: original files are preserved; no runtime network dependency. */
const vectorOpponents=new Set(['hawks','celtics','cavaliers','pelicans','bulls','mavericks','nuggets','warriors','rockets','lakers','heat','bucks','timberwolves','nets','knicks','magic','pacers','76ers','suns','trailblazers','kings','spurs','thunder','raptors','jazz','grizzlies','wizards','pistons','hornets']);
export function opponentLogo(id:string):string {
  return vectorOpponents.has(id)?`/assets/logos/${id}.svg`:`/assets/${id}.png`;
}
export const iconBounds={
  table:[10,10,76,76], performance:[4,24,88,48], court:[10,10,76,76], meeting:[15,14,67,68],
} satisfies Record<string,[number,number,number,number]>;
