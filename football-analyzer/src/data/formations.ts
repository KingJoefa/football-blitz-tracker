import { Formation, Player } from '../types';

// Offensive Formation Templates
export const offensiveFormations: Formation[] = [
  {
    id: 'i-formation',
    name: 'I-Formation',
    type: 'offensive',
    metadata: {
      personnel: '21 personnel',
      down: 1,
      distance: 10
    },
    players: [
      { id: 'qb', number: 12, position: 'QB', team: 'offense', x: 25, y: 26.5, isActive: true },
      { id: 'rb', number: 21, position: 'RB', team: 'offense', x: 18, y: 26.5, isActive: true },
      { id: 'fb', number: 44, position: 'FB', team: 'offense', x: 22, y: 26.5, isActive: true },
      { id: 'wr1', number: 80, position: 'WR', team: 'offense', x: 30, y: 5, isActive: true },
      { id: 'wr2', number: 83, position: 'WR', team: 'offense', x: 30, y: 48, isActive: true },
      { id: 'te', number: 87, position: 'TE', team: 'offense', x: 30, y: 20, isActive: false },
      { id: 'lt', number: 71, position: 'LT', team: 'offense', x: 30, y: 23, isActive: false },
      { id: 'lg', number: 65, position: 'LG', team: 'offense', x: 30, y: 25, isActive: false },
      { id: 'c', number: 55, position: 'C', team: 'offense', x: 30, y: 26.5, isActive: false },
      { id: 'rg', number: 67, position: 'RG', team: 'offense', x: 30, y: 28, isActive: false },
      { id: 'rt', number: 76, position: 'RT', team: 'offense', x: 30, y: 30, isActive: false }
    ]
  },
  {
    id: 'shotgun-spread',
    name: 'Shotgun Spread',
    type: 'offensive',
    metadata: {
      personnel: '11 personnel',
      down: 2,
      distance: 8
    },
    players: [
      { id: 'qb', number: 12, position: 'QB', team: 'offense', x: 22, y: 26.5, isActive: true },
      { id: 'rb', number: 21, position: 'RB', team: 'offense', x: 18, y: 26.5, isActive: true },
      { id: 'wr1', number: 80, position: 'WR', team: 'offense', x: 30, y: 3, isActive: true },
      { id: 'wr2', number: 83, position: 'WR', team: 'offense', x: 30, y: 50, isActive: true },
      { id: 'wr3', number: 11, position: 'WR', team: 'offense', x: 30, y: 15, isActive: true },
      { id: 'wr4', number: 19, position: 'WR', team: 'offense', x: 30, y: 38, isActive: true },
      { id: 'lt', number: 71, position: 'LT', team: 'offense', x: 30, y: 23, isActive: false },
      { id: 'lg', number: 65, position: 'LG', team: 'offense', x: 30, y: 25, isActive: false },
      { id: 'c', number: 55, position: 'C', team: 'offense', x: 30, y: 26.5, isActive: false },
      { id: 'rg', number: 67, position: 'RG', team: 'offense', x: 30, y: 28, isActive: false },
      { id: 'rt', number: 76, position: 'RT', team: 'offense', x: 30, y: 30, isActive: false }
    ]
  },
  {
    id: 'pistol',
    name: 'Pistol Formation',
    type: 'offensive',
    metadata: {
      personnel: '11 personnel',
      down: 1,
      distance: 10
    },
    players: [
      { id: 'qb', number: 12, position: 'QB', team: 'offense', x: 26, y: 26.5, isActive: true },
      { id: 'rb', number: 21, position: 'RB', team: 'offense', x: 21, y: 26.5, isActive: true },
      { id: 'wr1', number: 80, position: 'WR', team: 'offense', x: 30, y: 5, isActive: true },
      { id: 'wr2', number: 83, position: 'WR', team: 'offense', x: 30, y: 48, isActive: true },
      { id: 'wr3', number: 11, position: 'WR', team: 'offense', x: 30, y: 15, isActive: true },
      { id: 'te', number: 87, position: 'TE', team: 'offense', x: 30, y: 38, isActive: false },
      { id: 'lt', number: 71, position: 'LT', team: 'offense', x: 30, y: 23, isActive: false },
      { id: 'lg', number: 65, position: 'LG', team: 'offense', x: 30, y: 25, isActive: false },
      { id: 'c', number: 55, position: 'C', team: 'offense', x: 30, y: 26.5, isActive: false },
      { id: 'rg', number: 67, position: 'RG', team: 'offense', x: 30, y: 28, isActive: false },
      { id: 'rt', number: 76, position: 'RT', team: 'offense', x: 30, y: 30, isActive: false }
    ]
  },
  {
    id: 'empty-backfield',
    name: 'Empty Backfield',
    type: 'offensive',
    metadata: {
      personnel: '10 personnel',
      down: 3,
      distance: 12
    },
    players: [
      { id: 'qb', number: 12, position: 'QB', team: 'offense', x: 22, y: 26.5, isActive: true },
      { id: 'wr1', number: 80, position: 'WR', team: 'offense', x: 30, y: 3, isActive: true },
      { id: 'wr2', number: 83, position: 'WR', team: 'offense', x: 30, y: 50, isActive: true },
      { id: 'wr3', number: 11, position: 'WR', team: 'offense', x: 30, y: 12, isActive: true },
      { id: 'wr4', number: 19, position: 'WR', team: 'offense', x: 30, y: 41, isActive: true },
      { id: 'wr5', number: 14, position: 'WR', team: 'offense', x: 28, y: 18, isActive: true },
      { id: 'lt', number: 71, position: 'LT', team: 'offense', x: 30, y: 23, isActive: false },
      { id: 'lg', number: 65, position: 'LG', team: 'offense', x: 30, y: 25, isActive: false },
      { id: 'c', number: 55, position: 'C', team: 'offense', x: 30, y: 26.5, isActive: false },
      { id: 'rg', number: 67, position: 'RG', team: 'offense', x: 30, y: 28, isActive: false },
      { id: 'rt', number: 76, position: 'RT', team: 'offense', x: 30, y: 30, isActive: false }
    ]
  }
];

// Defensive Formation Templates
export const defensiveFormations: Formation[] = [
  {
    id: '4-3-defense',
    name: '4-3 Defense',
    type: 'defensive',
    metadata: {
      personnel: 'Base defense',
      down: 1,
      distance: 10
    },
    players: [
      { id: 'de1', number: 94, position: 'DE', team: 'defense', x: 32, y: 19, isActive: true },
      { id: 'dt1', number: 99, position: 'DT', team: 'defense', x: 32, y: 24, isActive: true },
      { id: 'dt2', number: 92, position: 'DT', team: 'defense', x: 32, y: 29, isActive: true },
      { id: 'de2', number: 96, position: 'DE', team: 'defense', x: 32, y: 34, isActive: true },
      { id: 'mlb', number: 54, position: 'MLB', team: 'defense', x: 26, y: 26.5, isActive: true },
      { id: 'olb1', number: 52, position: 'OLB', team: 'defense', x: 26, y: 21, isActive: true },
      { id: 'olb2', number: 56, position: 'OLB', team: 'defense', x: 26, y: 32, isActive: true },
      { id: 'cb1', number: 24, position: 'CB', team: 'defense', x: 20, y: 8, isActive: false },
      { id: 'cb2', number: 27, position: 'CB', team: 'defense', x: 20, y: 45, isActive: false },
      { id: 'fs', number: 29, position: 'FS', team: 'defense', x: 15, y: 26.5, isActive: false },
      { id: 'ss', number: 31, position: 'SS', team: 'defense', x: 18, y: 35, isActive: false }
    ]
  },
  {
    id: '3-4-defense',
    name: '3-4 Defense',
    type: 'defensive',
    metadata: {
      personnel: 'Base defense',
      down: 1,
      distance: 10
    },
    players: [
      { id: 'de1', number: 94, position: 'DE', team: 'defense', x: 32, y: 21, isActive: true },
      { id: 'nt', number: 99, position: 'NT', team: 'defense', x: 32, y: 26.5, isActive: true },
      { id: 'de2', number: 96, position: 'DE', team: 'defense', x: 32, y: 32, isActive: true },
      { id: 'olb1', number: 58, position: 'OLB', team: 'defense', x: 28, y: 17, isActive: true },
      { id: 'mlb1', number: 54, position: 'MLB', team: 'defense', x: 26, y: 24, isActive: true },
      { id: 'mlb2', number: 52, position: 'MLB', team: 'defense', x: 26, y: 29, isActive: true },
      { id: 'olb2', number: 56, position: 'OLB', team: 'defense', x: 28, y: 36, isActive: true },
      { id: 'cb1', number: 24, position: 'CB', team: 'defense', x: 20, y: 8, isActive: false },
      { id: 'cb2', number: 27, position: 'CB', team: 'defense', x: 20, y: 45, isActive: false },
      { id: 'fs', number: 29, position: 'FS', team: 'defense', x: 15, y: 26.5, isActive: false },
      { id: 'ss', number: 31, position: 'SS', team: 'defense', x: 18, y: 35, isActive: false }
    ]
  },
  {
    id: 'nickel-defense',
    name: 'Nickel Defense',
    type: 'defensive',
    metadata: {
      personnel: 'Nickel package',
      down: 2,
      distance: 8
    },
    players: [
      { id: 'de1', number: 94, position: 'DE', team: 'defense', x: 32, y: 19, isActive: true },
      { id: 'dt1', number: 99, position: 'DT', team: 'defense', x: 32, y: 24, isActive: true },
      { id: 'dt2', number: 92, position: 'DT', team: 'defense', x: 32, y: 29, isActive: true },
      { id: 'de2', number: 96, position: 'DE', team: 'defense', x: 32, y: 34, isActive: true },
      { id: 'mlb', number: 54, position: 'MLB', team: 'defense', x: 26, y: 26.5, isActive: true },
      { id: 'olb', number: 52, position: 'OLB', team: 'defense', x: 26, y: 32, isActive: true },
      { id: 'cb1', number: 24, position: 'CB', team: 'defense', x: 20, y: 8, isActive: false },
      { id: 'cb2', number: 27, position: 'CB', team: 'defense', x: 20, y: 45, isActive: false },
      { id: 'cb3', number: 22, position: 'CB', team: 'defense', x: 22, y: 18, isActive: false },
      { id: 'fs', number: 29, position: 'FS', team: 'defense', x: 15, y: 26.5, isActive: false },
      { id: 'ss', number: 31, position: 'SS', team: 'defense', x: 18, y: 35, isActive: false }
    ]
  },
  {
    id: 'dime-defense',
    name: 'Dime Defense',
    type: 'defensive',
    metadata: {
      personnel: 'Dime package',
      down: 3,
      distance: 12
    },
    players: [
      { id: 'de1', number: 94, position: 'DE', team: 'defense', x: 32, y: 21, isActive: true },
      { id: 'dt1', number: 99, position: 'DT', team: 'defense', x: 32, y: 26, isActive: true },
      { id: 'dt2', number: 92, position: 'DT', team: 'defense', x: 32, y: 27.5, isActive: true },
      { id: 'de2', number: 96, position: 'DE', team: 'defense', x: 32, y: 32, isActive: true },
      { id: 'mlb', number: 54, position: 'MLB', team: 'defense', x: 26, y: 26.5, isActive: true },
      { id: 'cb1', number: 24, position: 'CB', team: 'defense', x: 20, y: 6, isActive: false },
      { id: 'cb2', number: 27, position: 'CB', team: 'defense', x: 20, y: 47, isActive: false },
      { id: 'cb3', number: 22, position: 'CB', team: 'defense', x: 22, y: 16, isActive: false },
      { id: 'cb4', number: 23, position: 'CB', team: 'defense', x: 22, y: 37, isActive: false },
      { id: 'fs', number: 29, position: 'FS', team: 'defense', x: 15, y: 26.5, isActive: false },
      { id: 'ss', number: 31, position: 'SS', team: 'defense', x: 18, y: 35, isActive: false }
    ]
  }
];

export const formationTemplates = {
  offensive: offensiveFormations,
  defensive: defensiveFormations
};

export function getFormationById(id: string): Formation | undefined {
  return [...offensiveFormations, ...defensiveFormations].find(f => f.id === id);
}

export function getFormationsByType(type: 'offensive' | 'defensive'): Formation[] {
  return type === 'offensive' ? offensiveFormations : defensiveFormations;
}

export function getFormationsByPersonnel(personnel: string): Formation[] {
  return [...offensiveFormations, ...defensiveFormations].filter(
    f => f.metadata.personnel?.includes(personnel)
  );
}

export function createCustomFormation(
  name: string, 
  type: 'offensive' | 'defensive', 
  players: Player[]
): Formation {
  return {
    id: `custom-${Date.now()}`,
    name,
    type,
    players,
    metadata: {
      personnel: 'Custom'
    }
  };
}