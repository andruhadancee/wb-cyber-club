/** Tournament entity as returned by the API (snake_case — matches DB columns) */
export interface Tournament {
  id: number;
  title: string;
  discipline: string;
  date: string;
  prize: string;
  teams: number;
  max_teams: number;
  registration_link: string | null;
  custom_link: string | null;
  status: 'active' | 'finished';
  winner: string | null;
  watch_url: string | null;
  start_time: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

/** Form data for creating / editing a tournament (camelCase — frontend convention) */
export interface TournamentFormData {
  id?: number;
  title: string;
  discipline: string;
  date: string;
  prize: string;
  maxTeams: number;
  customLink?: string | null;
  winner?: string | null;
  watchUrl?: string | null;
  imageUrl?: string | null;
  startTime?: string | null;
  status: 'active' | 'finished';
  teams?: number;
}
