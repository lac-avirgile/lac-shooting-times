export interface GLeagueOpponent { id:string; name:string; venue:string; city:string; logo:string }
// Team identities: https://gleague.nba.com/teams
// Venue reference: https://en.wikipedia.org/wiki/NBA_G_League#Current_teams
// Venues are starting suggestions; special-event games may use another arena.
const teams:[string,string,string,string][]=[
  ['1612709890','Austin Spurs','H-E-B Center at Cedar Park','Cedar Park, TX'],
  ['1612709928','Capital City Go-Go','CareFirst Arena','Washington, DC'],
  ['1612709893','Cleveland Charge','Cleveland Public Auditorium','Cleveland, OH'],
  ['1612709905','Coachella Valley Lakers','Acrisure Arena','Thousand Palms, CA'],
  ['1612709929','College Park Skyhawks','Gateway Center Arena','College Park, GA'],
  ['1612709909','Delaware Blue Coats','Chase Fieldhouse','Wilmington, DE'],
  ['1612709917','Grand Rapids Gold','Van Andel Arena','Grand Rapids, MI'],
  ['1612709922','Greensboro Swarm','Novant Health Fieldhouse','Greensboro, NC'],
  ['1612709911','Iowa Wolves',"Casey's Center",'Des Moines, IA'],
  ['1612709913','Laketown Squadron','Pontchartrain Center','Kenner, LA'],
  ['1612709921','Long Island Nets','Nassau Coliseum','Uniondale, NY'],
  ['1612709915','Maine Celtics','Portland Exposition Building','Portland, ME'],
  ['1612709926','Memphis Hustle','Landers Center','Southaven, MS'],
  ['1612709931','Mexico City Capitanes','Arena CDMX','Mexico City, Mexico'],
  ['1612709932','Motor City Cruise','Wayne State Fieldhouse','Detroit, MI'],
  ['1612709910','Noblesville Boom','Riverview Health Arena','Noblesville, IN'],
  ['1612709889','Oklahoma City Blue','Paycom Center','Oklahoma City, OK'],
  ['1612709925','Osceola Magic','Silver Spurs Arena','Kissimmee, FL'],
  ['1612709920','Raptors 905','Mississauga Sports and Entertainment Centre','Mississauga, ON'],
  ['1612709908','Rio Grande Valley Vipers','Bert Ogden Arena','Edinburg, TX'],
  ['1612709933','Rip City Remix','Chiles Center','Portland, OR'],
  ['1612709903','Salt Lake City Stars','Maverik Center','West Valley City, UT'],
  ['1612709924','San Diego Clippers','Frontwave Arena','Oceanside, CA'],
  ['1612709902','Santa Cruz Warriors','Kaiser Permanente Arena','Santa Cruz, CA'],
  ['1612709904','Sioux Falls Skyforce','Sanford Pentagon','Sioux Falls, SD'],
  ['1612709914','Stockton Kings','Adventist Health Arena','Stockton, CA'],
  ['1612709918','Texas Legends','Comerica Center','Frisco, TX'],
  ['1612709934','Valley Suns','Mullett Arena','Tempe, AZ'],
  ['1612709919','Westchester Knicks','Westchester County Center','White Plains, NY'],
  ['1612709923','Windy City Bulls','NOW Arena','Hoffman Estates, IL'],
  ['1612709927','Wisconsin Herd','Oshkosh Arena','Oshkosh, WI'],
];
export const gLeagueHome={venue:'Frontwave Arena',city:'Oceanside, CA'};
export const gLeagueOpponents:GLeagueOpponent[]=teams.filter(team=>team[0]!=='1612709924').map(([id,name,venue,city])=>({id,name,venue,city,logo:`/assets/gleague/${id}.svg`}));
