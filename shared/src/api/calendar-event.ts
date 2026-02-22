/** Calendar event entity as returned by the API */
export interface CalendarEvent {
  id: number;
  title: string;
  description: string | null;
  event_date: string;
  image_url: string | null;
  discipline_id: number | null;
  discipline: string | null;
  discipline_color: string | null;
  discipline_logo_url: string | null;
  prize: string | null;
  max_teams: number | null;
  registration_link: string | null;
  custom_link: string | null;
  tournament_id: number | null;
  start_time: string | null;
  watch_url: string | null;
  created_at: string;
  updated_at: string;
  /** Present for archived tournament entries */
  is_archived?: boolean;
  winner?: string | null;
  winner_2nd?: string | null;
  winner_3rd?: string | null;
  teams?: number | null;
}

/** Form data for creating / editing a calendar event */
export interface CalendarEventFormData {
  id?: number;
  title: string;
  eventDate: string;
  description?: string | null;
  imageUrl?: string | null;
  disciplineId?: number | null;
  prize?: string | null;
  maxTeams?: number | null;
  registrationLink?: string | null;
  customLink?: string | null;
  startTime?: string | null;
  watchUrl?: string | null;
}
