export interface SteamAccountCredentials {
  /** SteamID64 the account's unique 64-bit Steam identifier. */
  id: string;
  /** Web session cookies for steamcommunity.com / store.steampowered.com requests. */
  cookies: string[];
  /** JWT refresh token used to mint new auth tokens without re-entering the password. */
  refreshToken: string;
}
