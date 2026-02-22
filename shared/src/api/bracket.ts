export type BracketSide = 'upper' | 'lower' | 'grand_final';
export type BracketFormat = 'single' | 'double';

export interface BracketMatch {
  id: number;
  tournament_id: number;
  round: number;
  position: number;
  bracket_side: BracketSide;

  team1_id: number | null;
  team2_id: number | null;
  winner_id: number | null;

  /** Cached display names (denormalized from RegisteredTeam) */
  team1_name: string | null;
  team2_name: string | null;
  winner_name: string | null;

  score1: number | null;
  score2: number | null;
  status: 'pending' | 'live' | 'completed';
  scheduled_at: string | null;
}

export interface BracketMatchUpdateData {
  team1Id?: number | null;
  team2Id?: number | null;
  winnerId?: number | null;
  score1?: number | null;
  score2?: number | null;
  status?: 'pending' | 'live' | 'completed';
}
