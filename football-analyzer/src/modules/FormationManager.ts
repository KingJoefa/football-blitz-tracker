import { Formation, Player } from '../types';
import { formationTemplates, getFormationById, createCustomFormation } from '../data/formations';

export class FormationManager {
  private currentFormation: Formation | null = null;
  private customFormations: Formation[] = [];
  private onFormationChangeCallback?: (formation: Formation) => void;

  constructor() {
    this.loadCustomFormations();
  }

  public setOnFormationChange(callback: (formation: Formation) => void): void {
    this.onFormationChangeCallback = callback;
  }

  public getCurrentFormation(): Formation | null {
    return this.currentFormation;
  }

  public loadFormation(formationId: string): Formation | null {
    const formation = getFormationById(formationId) || 
                     this.customFormations.find(f => f.id === formationId);
    
    if (formation) {
      this.currentFormation = { ...formation };
      this.onFormationChangeCallback?.(this.currentFormation);
      return this.currentFormation;
    }
    
    return null;
  }

  public getAvailableFormations(): { offensive: Formation[]; defensive: Formation[] } {
    return {
      offensive: [...formationTemplates.offensive, ...this.customFormations.filter(f => f.type === 'offensive')],
      defensive: [...formationTemplates.defensive, ...this.customFormations.filter(f => f.type === 'defensive')]
    };
  }

  public saveCurrentFormationAsCustom(name: string): Formation | null {
    if (!this.currentFormation) return null;

    const customFormation = createCustomFormation(
      name,
      this.currentFormation.type,
      this.currentFormation.players
    );

    this.customFormations.push(customFormation);
    this.saveCustomFormations();
    
    return customFormation;
  }

  public updatePlayerPosition(playerId: string, x: number, y: number): boolean {
    if (!this.currentFormation) return false;

    const player = this.currentFormation.players.find(p => p.id === playerId);
    if (player) {
      player.x = x;
      player.y = y;
      this.onFormationChangeCallback?.(this.currentFormation);
      return true;
    }

    return false;
  }

  public setPlayerActive(playerId: string, active: boolean): boolean {
    if (!this.currentFormation) return false;

    const player = this.currentFormation.players.find(p => p.id === playerId);
    if (player) {
      player.isActive = active;
      this.onFormationChangeCallback?.(this.currentFormation);
      return true;
    }

    return false;
  }

  public getPlayerById(playerId: string): Player | null {
    if (!this.currentFormation) return null;
    return this.currentFormation.players.find(p => p.id === playerId) || null;
  }

  public getPlayersByTeam(team: 'offense' | 'defense'): Player[] {
    if (!this.currentFormation) return [];
    return this.currentFormation.players.filter(p => p.team === team);
  }

  public getActivePlayers(): Player[] {
    if (!this.currentFormation) return [];
    return this.currentFormation.players.filter(p => p.isActive);
  }

  public snapToGrid(x: number, y: number, gridSize: number = 1): { x: number; y: number } {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }

  public validateFormation(): { valid: boolean; errors: string[] } {
    if (!this.currentFormation) {
      return { valid: false, errors: ['No formation loaded'] };
    }

    const errors: string[] = [];
    const offensivePlayers = this.getPlayersByTeam('offense');
    const defensivePlayers = this.getPlayersByTeam('defense');

    // Check player counts
    if (offensivePlayers.length !== 11) {
      errors.push(`Offense has ${offensivePlayers.length} players, needs 11`);
    }

    if (defensivePlayers.length !== 11) {
      errors.push(`Defense has ${defensivePlayers.length} players, needs 11`);
    }

    // Check for position overlaps
    const positions = this.currentFormation.players.map(p => `${p.x},${p.y}`);
    const uniquePositions = new Set(positions);
    if (positions.length !== uniquePositions.size) {
      errors.push('Players cannot occupy the same position');
    }

    // Check field boundaries
    this.currentFormation.players.forEach(player => {
      if (player.x < 0 || player.x > 120) {
        errors.push(`Player ${player.number} is out of field bounds (x-axis)`);
      }
      if (player.y < 0 || player.y > 53.33) {
        errors.push(`Player ${player.number} is out of field bounds (y-axis)`);
      }
    });

    return { valid: errors.length === 0, errors };
  }

  public resetFormation(): void {
    if (this.currentFormation) {
      const originalFormation = getFormationById(this.currentFormation.id);
      if (originalFormation) {
        this.currentFormation = { ...originalFormation };
        this.onFormationChangeCallback?.(this.currentFormation);
      }
    }
  }

  public flipFormation(axis: 'horizontal' | 'vertical'): void {
    if (!this.currentFormation) return;

    this.currentFormation.players.forEach(player => {
      if (axis === 'horizontal') {
        player.y = 53.33 - player.y;
      } else {
        player.x = 120 - player.x;
      }
    });

    this.onFormationChangeCallback?.(this.currentFormation);
  }

  public getFormationMetadata(): any {
    return this.currentFormation?.metadata || {};
  }

  public updateFormationMetadata(metadata: any): void {
    if (this.currentFormation) {
      this.currentFormation.metadata = { ...this.currentFormation.metadata, ...metadata };
      this.onFormationChangeCallback?.(this.currentFormation);
    }
  }

  public deleteCustomFormation(formationId: string): boolean {
    const index = this.customFormations.findIndex(f => f.id === formationId);
    if (index !== -1) {
      this.customFormations.splice(index, 1);
      this.saveCustomFormations();
      return true;
    }
    return false;
  }

  public exportFormation(): string | null {
    if (!this.currentFormation) return null;
    return JSON.stringify(this.currentFormation, null, 2);
  }

  public importFormation(formationJson: string): Formation | null {
    try {
      const formation = JSON.parse(formationJson) as Formation;
      
      // Validate the imported formation
      if (!formation.id || !formation.name || !formation.type || !formation.players) {
        throw new Error('Invalid formation format');
      }

      // Generate new ID to avoid conflicts
      formation.id = `imported-${Date.now()}`;
      
      this.customFormations.push(formation);
      this.saveCustomFormations();
      
      return formation;
    } catch (error) {
      console.error('Failed to import formation:', error);
      return null;
    }
  }

  private loadCustomFormations(): void {
    try {
      const saved = localStorage.getItem('football-analyzer-custom-formations');
      if (saved) {
        this.customFormations = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load custom formations:', error);
      this.customFormations = [];
    }
  }

  private saveCustomFormations(): void {
    try {
      localStorage.setItem(
        'football-analyzer-custom-formations', 
        JSON.stringify(this.customFormations)
      );
    } catch (error) {
      console.error('Failed to save custom formations:', error);
    }
  }

  public searchFormations(query: string): Formation[] {
    const allFormations = [
      ...formationTemplates.offensive,
      ...formationTemplates.defensive,
      ...this.customFormations
    ];

    const lowercaseQuery = query.toLowerCase();
    
    return allFormations.filter(formation => 
      formation.name.toLowerCase().includes(lowercaseQuery) ||
      formation.metadata.personnel?.toLowerCase().includes(lowercaseQuery) ||
      formation.type.toLowerCase().includes(lowercaseQuery)
    );
  }

  public getFormationStats(): {
    totalFormations: number;
    offensiveFormations: number;
    defensiveFormations: number;
    customFormations: number;
  } {
    return {
      totalFormations: formationTemplates.offensive.length + formationTemplates.defensive.length + this.customFormations.length,
      offensiveFormations: formationTemplates.offensive.length + this.customFormations.filter(f => f.type === 'offensive').length,
      defensiveFormations: formationTemplates.defensive.length + this.customFormations.filter(f => f.type === 'defensive').length,
      customFormations: this.customFormations.length
    };
  }
}