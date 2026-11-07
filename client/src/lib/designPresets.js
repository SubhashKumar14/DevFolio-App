export const DESIGN_PRESETS = [
  {
    id: 'workshop',
    name: 'The Workshop',
    number: '01',
    category: 'Editorial product',
    description: 'Warm paper, considered typography, and confident blue accents. A portfolio that feels built rather than generated.',
    fit: 'Recommended default · developers, mentors, recruiters',
  },
  {
    id: 'terminal',
    name: 'Terminal / 02',
    number: '02',
    category: 'Technical utility',
    description: 'Graphite, command-line rhythm, restrained lime. Dense enough for analytics without turning into a hacker cliché.',
    fit: 'Power users · statistics-heavy workspaces',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    number: '03',
    category: 'Data-forward',
    description: 'Structured blue-white grids, confident hierarchy, and sharp boundaries that make metrics easier to compare.',
    fit: 'Recruiters · dashboards · discovery',
  },
  {
    id: 'edition',
    name: 'The Edition',
    number: '04',
    category: 'Creative portfolio',
    description: 'Bookish typography, cream surfaces, and brick-red detailing. Distinctive without hiding the actual work.',
    fit: 'Public profiles · portfolios · storytelling',
  },
  {
    id: 'afterhours',
    name: 'After Hours',
    number: '05',
    category: 'Contemporary dark',
    description: 'Inky navy, soft contrast, and precise cyan accents. A sophisticated evolution of the existing DevFolio palette.',
    fit: 'Dark-mode users · all product screens',
  },
];

export const DEFAULT_DESIGN = 'workshop';
export const DESIGN_IDS = DESIGN_PRESETS.map((preset) => preset.id);
