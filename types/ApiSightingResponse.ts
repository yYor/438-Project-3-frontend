export type ApiSightingResponse = {
  id: number;
  birdId: number;
  birdName: string;
  userId: number;
  username: string | null;
  count: number;
  latitude: number;
  longitude: number;
  location: string;
  notes?: string | null;
  observedAt: string; // ISO timestamp from backend
};