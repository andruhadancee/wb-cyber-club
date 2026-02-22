/** Regulation entity as returned by the API */
export interface Regulation {
  id: number;
  discipline_id: number;
  discipline_name: string;
  regulation_name: string | null;
  pdf_url: string;
  created_at: string;
  updated_at: string;
}

/** Form data for creating / editing a regulation */
export interface RegulationFormData {
  id?: number;
  disciplineId: number;
  regulation_name?: string | null;
  pdf_url: string;
}
