export interface Team {
  id: number;
  tournament_id: number;
  name: string;
  captain: string;
  players: number;
  registration_date: string;
  created_at: string;
  // Added from tournament join
  discipline?: string;
  title?: string;
}

export interface TeamFormData {
  id?: number;
  tournamentId: number;
  name: string;
  players: number;
}

/** API returns teams grouped by tournament ID */
export type TeamsByTournament = Record<string, Team[]>;
