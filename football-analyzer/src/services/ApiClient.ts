import { Formation, PlaySequence, Player } from '../types';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PlayFilters {
  teamId?: number;
  formationType?: string;
  down?: number;
  distance?: number;
  fieldPosition?: number;
  gameId?: number;
  season?: number;
  week?: number;
  personnelGroup?: string;
  playResult?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export interface DefensiveMetrics {
  pressureRate: number;
  sackRate: number;
  hurryRate: number;
  completionAllowed: number;
  yardsAllowed: number;
  thirdDownStops: number;
  redZoneStops: number;
  turnoversForced: number;
}

export interface PlayData {
  id: string;
  gameId: number;
  quarter: number;
  timeRemaining: string;
  down: number;
  distance: number;
  fieldPosition: number;
  offenseTeamId: number;
  defenseTeamId: number;
  formation: Formation;
  playSequence?: PlaySequence;
  playResult: string;
  yardsGained: number;
  defensiveMetrics?: DefensiveMetrics;
  createdAt: string;
  updatedAt: string;
}

export class ApiClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl;
    this.loadAuthToken();
  }

  private loadAuthToken(): void {
    this.authToken = localStorage.getItem('auth_token');
  }

  private saveAuthToken(token: string): void {
    this.authToken = token;
    localStorage.setItem('auth_token', token);
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Authentication
  public async login(username: string, password: string): Promise<string> {
    const response = await this.request<{ token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (response.success && response.data.token) {
      this.saveAuthToken(response.data.token);
      return response.data.token;
    }

    throw new Error(response.message || 'Login failed');
  }

  public async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    this.authToken = null;
  }

  // Plays API
  public async getPlays(filters: PlayFilters = {}): Promise<PlayData[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/plays?${queryParams.toString()}`;
    const response = await this.request<PlayData[]>(endpoint);
    
    return response.data;
  }

  public async getPlay(playId: string): Promise<PlayData> {
    const response = await this.request<PlayData>(`/plays/${playId}`);
    return response.data;
  }

  public async createPlay(playData: Partial<PlayData>): Promise<PlayData> {
    const response = await this.request<PlayData>('/plays', {
      method: 'POST',
      body: JSON.stringify(playData)
    });
    
    return response.data;
  }

  public async updatePlay(playId: string, playData: Partial<PlayData>): Promise<PlayData> {
    const response = await this.request<PlayData>(`/plays/${playId}`, {
      method: 'PUT',
      body: JSON.stringify(playData)
    });
    
    return response.data;
  }

  public async deletePlay(playId: string): Promise<void> {
    await this.request(`/plays/${playId}`, {
      method: 'DELETE'
    });
  }

  // Formations API
  public async getFormations(): Promise<Formation[]> {
    const response = await this.request<Formation[]>('/formations');
    return response.data;
  }

  public async saveFormation(formation: Formation): Promise<Formation> {
    const response = await this.request<Formation>('/formations', {
      method: 'POST',
      body: JSON.stringify(formation)
    });
    
    return response.data;
  }

  public async updateFormation(formationId: string, formation: Formation): Promise<Formation> {
    const response = await this.request<Formation>(`/formations/${formationId}`, {
      method: 'PUT',
      body: JSON.stringify(formation)
    });
    
    return response.data;
  }

  // Defensive Metrics API
  public async getDefensiveMetrics(filters: PlayFilters = {}): Promise<DefensiveMetrics> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/defensive/metrics?${queryParams.toString()}`;
    const response = await this.request<DefensiveMetrics>(endpoint);
    
    return response.data;
  }

  public async getDefensiveAnalytics(filters: PlayFilters = {}): Promise<any> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/defensive/analytics?${queryParams.toString()}`;
    const response = await this.request<any>(endpoint);
    
    return response.data;
  }

  // Teams API
  public async getTeams(): Promise<any[]> {
    const response = await this.request<any[]>('/teams');
    return response.data;
  }

  public async getTeam(teamId: number): Promise<any> {
    const response = await this.request<any>(`/teams/${teamId}`);
    return response.data;
  }

  // Games API
  public async getGames(filters: { season?: number; week?: number; teamId?: number } = {}): Promise<any[]> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const endpoint = `/games?${queryParams.toString()}`;
    const response = await this.request<any[]>(endpoint);
    
    return response.data;
  }

  public async getGame(gameId: number): Promise<any> {
    const response = await this.request<any>(`/games/${gameId}`);
    return response.data;
  }

  // Players API
  public async getPlayers(teamId?: number): Promise<Player[]> {
    const endpoint = teamId ? `/players?teamId=${teamId}` : '/players';
    const response = await this.request<Player[]>(endpoint);
    return response.data;
  }

  public async getPlayer(playerId: string): Promise<Player> {
    const response = await this.request<Player>(`/players/${playerId}`);
    return response.data;
  }

  // Bulk Operations
  public async bulkCreatePlays(plays: Partial<PlayData>[]): Promise<PlayData[]> {
    const response = await this.request<PlayData[]>('/plays/bulk', {
      method: 'POST',
      body: JSON.stringify({ plays })
    });
    
    return response.data;
  }

  public async importGameData(gameId: number, data: any): Promise<any> {
    const response = await this.request<any>(`/games/${gameId}/import`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    return response.data;
  }

  // Real-time Updates
  public subscribeToPlayUpdates(callback: (play: PlayData) => void): void {
    if ('WebSocket' in window) {
      const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'play_update') {
            callback(data.play);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    }
  }

  // Export/Import
  public async exportPlays(filters: PlayFilters = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}/plays/export?${queryParams.toString()}`;
    
    const headers: HeadersInit = {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  public async importPlays(file: File): Promise<{ imported: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);

    const headers: HeadersInit = {};
    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}/plays/import`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Import failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;
  }

  // Health Check
  public async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.request<{ status: string; timestamp: string }>('/health');
    return response.data;
  }

  // Utility methods
  public isAuthenticated(): boolean {
    return !!this.authToken;
  }

  public setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();