/** Oct 10, 2026: user-supplied shooting order and medical pairings. */
export const vancouverGame={
  name:'Oct 10 · Vancouver at Raptors',
  date:'2026-10-10',
  label:'DRAFT · PRESEASON · VANCOUVER',
  opponentId:'raptors',
  homeAway:'away' as const,
  tip:15*60+30,
  venue:'Rogers Arena',
  city:'Vancouver, BC',
  draft:true,
  activeAthleteIds:['telfort'],
  treatmentOverrides:[
    {id:'garland',clinician:'Joann'},
    {id:'telfort',clinician:'Jesse'},
    {id:'kawamura',clinician:'Dan'},
    {id:'jones',clinician:'Jasen'},
    {id:'wagler',clinician:'Jasen'},
  ],
  text:`Shooting times vs Raptors

12:25 - Kobe (Tim)

12:55 - Jahmyl (Quan) + Yuki (Spencer)

1:10 - Gradey (Spencer) + Baba (Jay)

1:25 - KD (Shaun) + Keaton (Tim)

1:40 - Isaiah (Jay) + Pick (Cookie)

1:55 (95:00 on game clock) - DJ (Jay) + Cam (Conor)

2:10 (80:00 on game clock) - Nick (Quan) + Blake (Cookie)

2:25 (65:00 on game clock) - DG (Shaun) + Rui (Conor)

2:40 (50:00 on game clock) - Brook (JVG)

Meeting 35:00 on clock

Game 3:30`,
};
