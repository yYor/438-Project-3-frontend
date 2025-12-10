export interface User {
  userId: number;          // DB primary key
  email: string;
  name?: string;
  profilePicture?: string;
  oauthProvider?: string;
  oauthId?: string;
  role?: string;
  createdAt?: string;

  // Optional legacy fields if other code still uses them:
  id?: string;             // can mirror userId as a string if you want
  created_at?: string;     // old snake_case version
}