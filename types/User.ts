export interface User {
  id: string;                   // local/mobile user ID (for now)
  email: string;
  created_at: string;

  // Optional fields for OAuth
  name?: string;
  profilePicture?: string;
  oauthProvider?: string;
}