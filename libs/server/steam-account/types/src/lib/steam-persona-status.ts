/** Persona state values as defined by Steam's protocol (`EPersonaState`). */
export const SteamPersonaStatusEnum = {
  /** Not signed in / appears offline to friends. */
  Offline: 0,
  /** Signed in and visible. */
  Online: 1,
  /** Marked as Busy. */
  Busy: 2,
  /** Marked as Away (typically auto-set after inactivity). */
  Away: 3,
  /** Extended-away "Snooze" state. */
  Snooze: 4,
  /** Advertising willingness to trade. */
  LookingToTrade: 5,
  /** Advertising willingness to play. */
  LookingToPlay: 6,
  /** Signed in but appears offline to friends. */
  Invisible: 7,
} as const;

export type SteamPersonaStatus =
  (typeof SteamPersonaStatusEnum)[keyof typeof SteamPersonaStatusEnum];
