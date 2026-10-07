import { normalize } from './roster';
export interface Opponent { id: string; name: string; short: string; aliases: string[]; venue: string; city: string }
export const homeVenue = { venue: 'Intuit Dome', city: 'Los Angeles, CA' };
export const opponents: Opponent[] = [
  { id: 'warriors', name: 'Golden State Warriors', short: 'Warriors', aliases: ['GSW', 'Golden State'], venue: 'Chase Center', city: 'San Francisco, CA' },
  { id: 'thunder', name: 'Oklahoma City Thunder', short: 'Thunder', aliases: ['OKC', 'Oklahoma City'], venue: 'Paycom Center', city: 'Oklahoma City, OK' },
  { id: 'kings', name: 'Sacramento Kings', short: 'Kings', aliases: ['SAC', 'Sacramento'], venue: 'Golden 1 Center', city: 'Sacramento, CA' },
  { id: 'trailblazers', name: 'Portland Trailblazers', short: 'Portland', aliases: ['POR', 'Trailblazers', 'Trail Blazers', 'Portland Trail Blazers'], venue: 'Moda Center', city: 'Portland, OR' },
  { id: 'pacers', name: 'Indiana Pacers', short: 'Pacers', aliases: ['IND', 'Indiana'], venue: 'Gainbridge Fieldhouse', city: 'Indianapolis, IN' },
  { id: 'raptors', name: 'Toronto Raptors', short: 'Raptors', aliases: ['TOR', 'Toronto'], venue: 'Scotiabank Arena', city: 'Toronto, ON' },
  { id: 'mavericks', name: 'Dallas Mavericks', short: 'Mavericks', aliases: ['DAL', 'Dallas', 'Mavs'], venue: 'American Airlines Center', city: 'Dallas, TX' },
  { id: 'spurs', name: 'San Antonio Spurs', short: 'Spurs', aliases: ['SAS', 'San Antonio'], venue: 'Frost Bank Center', city: 'San Antonio, TX' },
  { id: 'bucks', name: 'Milwaukee Bucks', short: 'Bucks', aliases: ['MIL', 'Milwaukee'], venue: 'Fiserv Forum', city: 'Milwaukee, WI' },
  { id: 'pelicans', name: 'New Orleans Pelicans', short: 'Pelicans', aliases: ['NOP', 'New Orleans'], venue: 'Smoothie King Center', city: 'New Orleans, LA' },
  { id: 'bulls', name: 'Chicago Bulls', short: 'Bulls', aliases: ['CHI', 'Chicago'], venue: 'United Center', city: 'Chicago, IL' },
  { id: 'timberwolves', name: 'Minnesota Timberwolves', short: 'Timberwolves', aliases: ['MIN', 'Minnesota', 'Wolves'], venue: 'Target Center', city: 'Minneapolis, MN' },
  { id: 'knicks', name: 'New York Knicks', short: 'Knicks', aliases: ['NYK', 'New York'], venue: 'Madison Square Garden', city: 'New York, NY' },
  { id: 'grizzlies', name: 'Memphis Grizzlies', short: 'Grizzlies', aliases: ['MEM', 'Memphis'], venue: 'FedExForum', city: 'Memphis, TN' },
  { id: 'magic', name: 'Orlando Magic', short: 'Magic', aliases: ['ORL', 'Orlando'], venue: 'Kia Center', city: 'Orlando, FL' },
  { id: 'lakers', name: 'Los Angeles Lakers', short: 'Lakers', aliases: ['LAL', 'LA Lakers'], venue: 'Crypto.com Arena', city: 'Los Angeles, CA' },
  { id: 'nuggets', name: 'Denver Nuggets', short: 'Nuggets', aliases: ['DEN', 'Denver'], venue: 'Ball Arena', city: 'Denver, CO' },
  { id: 'rockets', name: 'Houston Rockets', short: 'Rockets', aliases: ['HOU', 'Houston'], venue: 'Toyota Center', city: 'Houston, TX' },
  { id: 'cavaliers', name: 'Cleveland Cavaliers', short: 'Cavaliers', aliases: ['CLE', 'Cleveland', 'Cavs'], venue: 'Rocket Arena', city: 'Cleveland, OH' },
  { id: '76ers', name: 'Philadelphia 76ers', short: '76ers', aliases: ['PHI', 'Philadelphia', 'Sixers'], venue: 'Wells Fargo Center', city: 'Philadelphia, PA' },
  { id: 'suns', name: 'Phoenix Suns', short: 'Suns', aliases: ['PHX', 'Phoenix'], venue: 'Footprint Center', city: 'Phoenix, AZ' },
  { id: 'jazz', name: 'Utah Jazz', short: 'Jazz', aliases: ['UTA', 'Utah'], venue: 'Delta Center', city: 'Salt Lake City, UT' },
  { id: 'nets', name: 'Brooklyn Nets', short: 'Nets', aliases: ['BKN', 'Brooklyn'], venue: 'Barclays Center', city: 'Brooklyn, NY' },
  { id: 'wizards', name: 'Washington Wizards', short: 'Wizards', aliases: ['WAS', 'Washington'], venue: 'Capital One Arena', city: 'Washington, DC' },
  { id: 'hornets', name: 'Charlotte Hornets', short: 'Hornets', aliases: ['CHA', 'Charlotte'], venue: 'Spectrum Center', city: 'Charlotte, NC' },
  { id: 'pistons', name: 'Detroit Pistons', short: 'Pistons', aliases: ['DET', 'Detroit'], venue: 'Little Caesars Arena', city: 'Detroit, MI' },
  { id: 'celtics', name: 'Boston Celtics', short: 'Celtics', aliases: ['BOS', 'Boston'], venue: 'TD Garden', city: 'Boston, MA' },
  { id: 'hawks', name: 'Atlanta Hawks', short: 'Hawks', aliases: ['ATL', 'Atlanta'], venue: 'State Farm Arena', city: 'Atlanta, GA' },
  { id: 'heat', name: 'Miami Heat', short: 'Heat', aliases: ['MIA', 'Miami'], venue: 'Kaseya Center', city: 'Miami, FL' },
  { id: 'loong-lions', name: 'Guangzhou Loong Lions', short: 'Loong Lions', aliases: ['Guangzhou', 'Loong'], venue: '', city: '' },
];
export function findOpponent(name: string): Opponent | undefined {
  return opponents.find(opponent => [opponent.name, opponent.short, ...opponent.aliases].some(alias => normalize(alias) === normalize(name)));
}
