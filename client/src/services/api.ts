import { Match, Prediction, SeriousSet, PointsHistoryEntry, User, CommunityPrediction, UserProfileData } from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('fp_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async register(username: string, email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to register');
    return data;
  },

  async login(usernameOrEmail: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log in');
    return data;
  },

  async guestLogin(): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create guest account');
    return data;
  },

  async getMe(): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get user profile');
    return data;
  },

  // Matches
  async getMatches(
    filter: string = 'upcoming',
    competition?: string,
    date?: string,
    team?: string,
    tzOffset?: number,
    clientDate?: string
  ): Promise<{ matches: Match[] }> {
    const params = new URLSearchParams();
    if (filter) params.append('filter', filter);
    if (competition && competition !== 'ALL') params.append('competition', competition);
    if (date) params.append('date', date);
    if (team) params.append('team', team);
    if (tzOffset !== undefined) params.append('tzOffset', tzOffset.toString());
    if (clientDate) params.append('clientDate', clientDate);

    const res = await fetch(`${API_BASE}/matches?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch matches');
    return data;
  },

  async getApiDiagnostics(): Promise<{ diagnostics: any }> {
    const res = await fetch(`${API_BASE}/matches/api-diagnostics`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch API diagnostics');
    return data;
  },

  async getMatch(id: number): Promise<{ match: Match; userPredictions: Prediction[] }> {
    const res = await fetch(`${API_BASE}/matches/${id}`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch match');
    return data;
  },

  async syncMatches(): Promise<{ source: string; syncedCount: number; message: string }> {
    const res = await fetch(`${API_BASE}/matches/sync`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sync matches');
    return data;
  },

  async simulateMatchResult(matchId: number, homeScore: number, awayScore: number, homeCorners: number, awayCorners: number) {
    const res = await fetch(`${API_BASE}/matches/${matchId}/simulate-result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ homeScore, awayScore, homeCorners, awayCorners }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to simulate match');
    return data;
  },

  async getCompetitions(): Promise<{ competitions: Array<{ id: string; name: string; emblem?: string; match_count: number }> }> {
    const res = await fetch(`${API_BASE}/matches/competitions/list`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch competitions');
    return data;
  },

  // Predictions
  async submitBasicPredictions(predictions: Array<{ matchId: number; marketType: string; selection: string }>) {
    const res = await fetch(`${API_BASE}/predictions/basic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ predictions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit prediction');
    return data;
  },

  async submitSeriousSet(name: string, predictions: Array<{ matchId: number; marketType: string; selection: string }>) {
    const res = await fetch(`${API_BASE}/predictions/serious-set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ name, predictions }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create serious set');
    return data;
  },

  async getMyPredictions(mode?: 'BASIC' | 'SERIOUS', status?: string): Promise<{ predictions: Prediction[] }> {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (status && status !== 'ALL') params.append('status', status);

    const res = await fetch(`${API_BASE}/predictions/my?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch predictions');
    return data;
  },

  async getMySeriousSets(): Promise<{ sets: SeriousSet[] }> {
    const res = await fetch(`${API_BASE}/predictions/serious-sets/my`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch serious sets');
    return data;
  },

  async cancelPrediction(id: number) {
    const res = await fetch(`${API_BASE}/predictions/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to cancel prediction');
    return data;
  },

  // History & Analytics
  async getPointsLedger(mode?: 'BASIC' | 'SERIOUS', limit: number = 50): Promise<{ history: PointsHistoryEntry[] }> {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    params.append('limit', limit.toString());

    const res = await fetch(`${API_BASE}/history/ledger?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch points history');
    return data;
  },

  async getProgression(): Promise<{
    basicProgression: PointsHistoryEntry[];
    seriousProgression: PointsHistoryEntry[];
  }> {
    const res = await fetch(`${API_BASE}/history/progression`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch progression');
    return data;
  },

  async getStats(): Promise<{
    user: User;
    basic: { points: number; streak: number; bestStreak: number; total: number; correct: number; incorrect: number; pending: number; winRate: number };
    serious: { points: number; streak: number; bestStreak: number; totalSets: number; wonSets: number; lostSets: number; pendingSets: number; winRate: number };
  }> {
    const res = await fetch(`${API_BASE}/history/stats`, {
      headers: { ...getAuthHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch stats');
    return data;
  },

  // Leaderboards with Section Filtering & Hottest Streaks
  async getLeaderboard(
    mode: 'BASIC' | 'SERIOUS',
    section: 'points' | 'streak' | 'accuracy' | 'wins' = 'points'
  ): Promise<{
    mode: string;
    section: string;
    leaderboard: any[];
    spotlights: {
      topPoints?: any;
      hottestStreak?: any;
      bestStreakRecord?: any;
      highestAccuracy?: any;
      mostWins?: any;
    };
    hotStreakers: any[];
  }> {
    const res = await fetch(`${API_BASE}/leaderboard/${mode.toLowerCase()}?section=${section}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
    return data;
  },

  // Community & Other Users Past Predictions
  async getUserProfile(userId: number): Promise<UserProfileData> {
    const res = await fetch(`${API_BASE}/predictions/user/${userId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user predictions');
    return data;
  },

  async getCommunityPredictions(mode?: 'BASIC' | 'SERIOUS', status?: string): Promise<{ predictions: CommunityPrediction[] }> {
    const params = new URLSearchParams();
    if (mode) params.append('mode', mode);
    if (status && status !== 'ALL') params.append('status', status);

    const res = await fetch(`${API_BASE}/predictions/community?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch community predictions');
    return data;
  },

  async getMatchCommunityPredictions(matchId: number): Promise<{ predictions: CommunityPrediction[] }> {
    const res = await fetch(`${API_BASE}/predictions/match/${matchId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch match predictions');
    return data;
  },

  // Settings
  async getApiKeyStatus(): Promise<{ configured: boolean; maskedKey?: string | null }> {
    const res = await fetch(`${API_BASE}/matches/settings/football-api-key`);
    return await res.json();
  },

  async setApiKey(apiKey: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/matches/settings/football-api-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    return await res.json();
  },

  // Database & Supabase
  async getDatabaseStatus(): Promise<{ database: any }> {
    const res = await fetch(`${API_BASE}/auth/database-status`);
    return await res.json();
  },

  async syncSupabase(): Promise<{ success: boolean; totalSynced: number; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/sync-supabase`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return await res.json();
  },
};
