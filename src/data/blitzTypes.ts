import { BlitzType } from '../types'

export const blitzTypes: BlitzType[] = [
  // Zone Blitzes
  {
    id: 'fire-zone',
    name: 'Fire Zone',
    category: 'Zone',
    description: 'A zone blitz where 5 players rush and 6 drop into coverage, typically with a linebacker or safety blitzing',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'cover-0-blitz',
    name: 'Cover 0 Blitz',
    category: 'Zone',
    description: 'All-out blitz with man-to-man coverage, no safety help over the top',
    commonFormations: ['3-4', '4-3', 'Dime']
  },
  {
    id: 'cover-1-blitz',
    name: 'Cover 1 Blitz',
    category: 'Zone',
    description: 'Single high safety with man coverage underneath, typically 6 rushers',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'cover-2-blitz',
    name: 'Cover 2 Blitz',
    category: 'Zone',
    description: 'Two deep safeties with zone coverage underneath, 5 rushers',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },

  // Man Blitzes
  {
    id: 'man-blitz-cover-0',
    name: 'Man Blitz Cover 0',
    category: 'Man',
    description: 'Pure man coverage with no safety help, maximum pressure',
    commonFormations: ['3-4', '4-3', 'Dime']
  },
  {
    id: 'man-blitz-cover-1',
    name: 'Man Blitz Cover 1',
    category: 'Man',
    description: 'Single high safety with man coverage underneath',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'man-blitz-cover-2',
    name: 'Man Blitz Cover 2',
    category: 'Man',
    description: 'Two deep safeties with man coverage underneath',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },

  // Stunt Blitzes
  {
    id: 'twist-blitz',
    name: 'Twist Blitz',
    category: 'Stunt',
    description: 'Defensive linemen cross paths to confuse blocking assignments',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'loop-blitz',
    name: 'Loop Blitz',
    category: 'Stunt',
    description: 'Defensive end loops around defensive tackle to create pressure',
    commonFormations: ['4-3', '3-4']
  },
  {
    id: 'cross-blitz',
    name: 'Cross Blitz',
    category: 'Stunt',
    description: 'Two defenders cross paths to create confusion and pressure',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },

  // Edge Blitzes
  {
    id: 'edge-blitz-olb',
    name: 'Edge Blitz - OLB',
    category: 'Edge',
    description: 'Outside linebacker blitzes off the edge',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'edge-blitz-cb',
    name: 'Edge Blitz - CB',
    category: 'Edge',
    description: 'Cornerback blitzes off the edge',
    commonFormations: ['Nickel', 'Dime']
  },
  {
    id: 'edge-blitz-safety',
    name: 'Edge Blitz - Safety',
    category: 'Edge',
    description: 'Safety blitzes off the edge',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },

  // A-Gap Blitzes
  {
    id: 'a-gap-mlb',
    name: 'A-Gap Blitz - MLB',
    category: 'A-Gap',
    description: 'Middle linebacker blitzes through the A-gap',
    commonFormations: ['3-4', '4-3']
  },
  {
    id: 'a-gap-nose',
    name: 'A-Gap Blitz - Nose',
    category: 'A-Gap',
    description: 'Nose tackle blitzes through the A-gap',
    commonFormations: ['3-4', '4-3']
  },
  {
    id: 'a-gap-safety',
    name: 'A-Gap Blitz - Safety',
    category: 'A-Gap',
    description: 'Safety blitzes through the A-gap',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },

  // Delayed Blitzes
  {
    id: 'delayed-mlb',
    name: 'Delayed MLB Blitz',
    category: 'Delayed',
    description: 'Middle linebacker shows coverage then blitzes after a delay',
    commonFormations: ['3-4', '4-3']
  },
  {
    id: 'delayed-safety',
    name: 'Delayed Safety Blitz',
    category: 'Delayed',
    description: 'Safety shows coverage then blitzes after a delay',
    commonFormations: ['3-4', '4-3', 'Nickel']
  },
  {
    id: 'delayed-corner',
    name: 'Delayed Corner Blitz',
    category: 'Delayed',
    description: 'Cornerback shows coverage then blitzes after a delay',
    commonFormations: ['Nickel', 'Dime']
  }
]
