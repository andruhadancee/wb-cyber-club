/** Standard API success response wrapper */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
