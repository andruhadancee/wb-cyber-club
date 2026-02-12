/** Discipline entity as returned by the API */
export interface Discipline {
  id: number;
  name: string;
  color: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}
