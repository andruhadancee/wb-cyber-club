export interface Regulation {
  id: number;
  discipline_name: string;
  regulation_name: string | null;
  pdf_url: string;
  created_at: string;
  updated_at: string;
}

export interface RegulationFormData {
  id?: number;
  discipline_name: string;
  regulation_name?: string | null;
  pdf_url: string;
}
