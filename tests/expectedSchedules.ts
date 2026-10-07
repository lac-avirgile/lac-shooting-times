/** Independent expected values approved from the raw messages and rules. Null is intentional. */
export type ExpectedGroup = { players: string[]; table: [string | null, string | null]; performance: [string, string] | null; court: [string, string]; clock: number | null; location?: string };
export interface ExpectedSchedule { opponent: string; homeAway: 'home' | 'away'; tip: string; walkthrough: [string, string] | null; groups: ExpectedGroup[] }
/** Independent transcription of the user's current partnership list. */
export const expectedClinicians: Record<string,string> = {
  loyer:'Lorin',
  beal:'Jesse', jackson:'Jesse', hachimura:'Jesse', miller:'Jesse',
  garland:'Maggie', ingram:'Maggie', jones:'Maggie', wagler:'Maggie',
  pickett:'Jasen', dick:'Jasen', strus:'Dan', lopez:'Dan', christie:'Dan', sanders:'Dan', martinelli:'Dan',
  niederhauser:'Colby', baba:'Colby', dunn:'Colby', wesley:'Lorin', kawamura:'Lorin',
};
export const expected: ExpectedSchedule[] = [
  { opponent: 'warriors', homeAway: 'home', tip: '17:30', walkthrough: ['15:00','15:30'], groups: [
    { players:['omier','pedulla'],table:['13:45','14:00'],performance:['14:00','14:15'],court:['14:15','14:30'],clock:null },
    { players:['christie','washington'],table:['14:00','14:15'],performance:['14:15','14:30'],court:['14:30','14:45'],clock:null },
    { players:['dunn','sanders'],table:['14:15','14:30'],performance:['14:30','14:45'],court:['14:45','15:00'],clock:null },
    { players:['leonard'],table:['14:30','15:00'],performance:null,court:['15:30','15:55'],clock:null },
    { players:['batum','jones'],table:[null,null],performance:['15:40','15:55'],court:['15:55','16:10'],clock:95 },
    { players:['miller','mathurin'],table:['15:40','15:55'],performance:['15:55','16:10'],court:['16:10','16:25'],clock:80 },
    { players:['garland','collins'],table:['15:40','16:10'],performance:['16:10','16:25'],court:['16:25','16:40'],clock:65 },
    { players:['lopez','bogdanovic'],table:['16:10','16:25'],performance:['16:25','16:40'],court:['16:40','16:55'],clock:50 },
  ]},
  { opponent: 'thunder', homeAway: 'home', tip: '19:00', walkthrough: ['16:30','17:00'], groups: [
    { players:['christie'],table:['15:00','15:15'],performance:['15:15','15:30'],court:['15:30','16:15'],clock:null },
    { players:['dunn','sanders'],table:['15:45','16:00'],performance:['16:00','16:15'],court:['16:15','16:30'],clock:null },
    { players:['washington','pedulla','omier'],table:['16:00','16:15'],performance:['16:15','16:30'],court:['17:00','17:45'],clock:null,location:'practice' },
    { players:['leonard'],table:['16:00','16:30'],performance:null,court:['17:00','17:25'],clock:null },
    { players:['batum','jones'],table:[null,null],performance:['17:10','17:25'],court:['17:25','17:40'],clock:95 },
    { players:['miller','mathurin'],table:['17:10','17:25'],performance:['17:25','17:40'],court:['17:40','17:55'],clock:80 },
    { players:['garland','collins'],table:['17:10','17:40'],performance:['17:40','17:55'],court:['17:55','18:10'],clock:65 },
    { players:['lopez','bogdanovic'],table:['17:40','17:55'],performance:['17:55','18:10'],court:['18:10','18:25'],clock:50 },
  ]},
  { opponent: 'kings', homeAway: 'away', tip: '18:00', walkthrough:null, groups:[
    { players:['pedulla','omier'],table:['14:35','14:50'],performance:['14:50','15:05'],court:['15:05','15:25'],clock:null },
    { players:['washington','christie'],table:['14:55','15:10'],performance:['15:10','15:25'],court:['15:25','15:45'],clock:null },
    { players:['dunn','sanders'],table:['15:15','15:30'],performance:['15:30','15:45'],court:['15:45','16:00'],clock:null },
    { players:['leonard'],table:['15:30','16:00'],performance:null,court:['16:00','16:25'],clock:null },
    { players:['batum','jones'],table:['15:55','16:10'],performance:['16:10','16:25'],court:['16:25','16:40'],clock:95 },
    { players:['miller','mathurin'],table:['16:10','16:25'],performance:['16:25','16:40'],court:['16:40','16:55'],clock:80 },
    { players:['garland','collins'],table:['16:10','16:40'],performance:['16:40','16:55'],court:['16:55','17:10'],clock:65 },
    { players:['lopez','bogdanovic'],table:['16:40','16:55'],performance:['16:55','17:10'],court:['17:10','17:25'],clock:50 },
  ]},
  { opponent: 'trailblazers', homeAway: 'home', tip: '20:00', walkthrough:['17:30','18:00'],groups:[
    { players:['christie'],table:['16:30','16:45'],performance:['16:45','17:00'],court:['17:00','17:15'],clock:null },
    { players:['dunn','sanders'],table:['16:45','17:00'],performance:['17:00','17:15'],court:['17:15','17:30'],clock:null },
    { players:['washington','pedulla','omier'],table:['17:00','17:15'],performance:['17:15','17:30'],court:['18:00','18:45'],clock:null,location:'practice' },
    { players:['leonard'],table:['17:00','17:30'],performance:null,court:['18:00','18:25'],clock:null },
    { players:['batum','jones'],table:[null,null],performance:['18:10','18:25'],court:['18:25','18:40'],clock:95 },
    { players:['miller','mathurin'],table:['18:10','18:25'],performance:['18:25','18:40'],court:['18:40','18:55'],clock:80 },
    { players:['garland','collins'],table:['18:10','18:40'],performance:['18:40','18:55'],court:['18:55','19:10'],clock:65 },
    { players:['lopez','bogdanovic'],table:['18:40','18:55'],performance:['18:55','19:10'],court:['19:10','19:25'],clock:50 },
  ]},
  { opponent: 'pacers',homeAway:'away',tip:'19:00',walkthrough:null,groups:[
    { players:['leonard'],table:['16:30','17:00'],performance:null,court:['17:00','17:25'],clock:null },
    { players:['dunn','sanders'],table:['16:50','17:05'],performance:['17:05','17:20'],court:['17:20','17:30'],clock:null },
    { players:['batum','jones'],table:['17:00','17:15'],performance:['17:15','17:30'],court:['17:30','17:40'],clock:null },
    { players:['jackson','christie'],table:['17:10','17:25'],performance:['17:25','17:40'],court:['17:40','17:50'],clock:null },
    { players:['miller','mathurin'],table:['17:20','17:35'],performance:['17:35','17:50'],court:['17:50','18:00'],clock:null },
    { players:['garland','collins'],table:['17:15','17:45'],performance:['17:45','18:00'],court:['18:00','18:15'],clock:null },
    { players:['lopez','bogdanovic'],table:['17:45','18:00'],performance:['18:00','18:15'],court:['18:15','18:25'],clock:null },
  ]},
  { opponent:'raptors',homeAway:'home',tip:'19:30',walkthrough:['17:00','17:30'],groups:[
    { players:['christie','jackson'],table:['16:00','16:15'],performance:['16:15','16:30'],court:['16:30','16:45'],clock:null },
    { players:['dunn','sanders'],table:['16:15','16:30'],performance:['16:30','16:45'],court:['16:45','17:00'],clock:null },
    { players:['washington','pedulla','omier'],table:['16:30','16:45'],performance:['16:45','17:00'],court:['17:30','18:15'],clock:null,location:'practice' },
    { players:['leonard'],table:['16:30','17:00'],performance:null,court:['17:30','17:55'],clock:null },
    { players:['batum','jones'],table:[null,null],performance:['17:40','17:55'],court:['17:55','18:10'],clock:95 },
    { players:['miller','mathurin'],table:['17:40','17:55'],performance:['17:55','18:10'],court:['18:10','18:25'],clock:80 },
    { players:['garland','collins'],table:['17:40','18:10'],performance:['18:10','18:25'],court:['18:25','18:40'],clock:65 },
    { players:['lopez','bogdanovic'],table:['18:10','18:25'],performance:['18:25','18:40'],court:['18:40','18:55'],clock:50 },
  ]},
];
