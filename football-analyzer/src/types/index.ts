export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  number: number;
  position: FootballPosition;
  team: 'offense' | 'defense';
  x: number; // Field coordinates (0-120 yards)
  y: number; // Field coordinates (0-53 yards)
  isActive: boolean;
  route?: Route;
  assignment?: string;
}

export type FootballPosition = 
  // Offense
  | 'QB' | 'RB' | 'FB' | 'WR' | 'TE' | 'LT' | 'LG' | 'C' | 'RG' | 'RT'
  // Defense
  | 'DE' | 'DT' | 'NT' | 'LB' | 'MLB' | 'OLB' | 'CB' | 'S' | 'FS' | 'SS';

export interface Route {
  id: string;
  points: Position[];
  type: 'slant' | 'out' | 'in' | 'post' | 'go' | 'comeback' | 'screen' | 'custom';
  timing: number;
  depth: number;
}

export interface Formation {
  id: string;
  name: string;
  type: 'offensive' | 'defensive';
  players: Player[];
  metadata: {
    personnel?: string; // e.g., "11 personnel", "nickel", "dime"
    down?: number;
    distance?: number;
    fieldPosition?: number;
  };
}

export interface PlaySequence {
  id: string;
  name: string;
  formation: Formation;
  timeline: TimelineEvent[];
  duration: number;
}

export interface TimelineEvent {
  timestamp: number;
  playerPositions: { [playerId: string]: Position };
  eventType: 'snap' | 'movement' | 'contact' | 'completion' | 'pressure';
}

export interface FieldDimensions {
  width: number;
  height: number;
  yardToPixel: number;
}

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}