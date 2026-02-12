/** Registered team entity as returned by the API */
export interface Team {
  id: number;
  tournament_id: number;
  name: string;
  captain: string;
  players: number;
  registration_date: string;
  created_at: string;
  /** Populated from tournament join */
  discipline?: string;
  /** Populated from tournament join */
  title?: string;
}

/** Form data for creating / editing a team */
export interface TeamFormData {
  id?: number;
  tournamentId: number;
  name: string;
  players: number;
}

/** API returns teams grouped by tournament ID */
export type TeamsByTournament = Record<string, Team[]>;
