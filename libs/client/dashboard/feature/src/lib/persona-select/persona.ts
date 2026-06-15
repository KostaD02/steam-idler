import {
  SteamPersonaStatus,
  SteamPersonaStatusEnum,
} from '@steam-idler/server/steam-account/types';

export interface PersonaPresentation {
  value: SteamPersonaStatus;
  labelKey: string;
  color: string;
}

const PERSONA_PRESENTATIONS: readonly PersonaPresentation[] = [
  {
    value: SteamPersonaStatusEnum.Online,
    labelKey: 'ui.dashboard.persona.online',
    color: 'var(--kd-accent)',
  },
  {
    value: SteamPersonaStatusEnum.Away,
    labelKey: 'ui.dashboard.persona.away',
    color: 'var(--kd-warning)',
  },
  {
    value: SteamPersonaStatusEnum.Snooze,
    labelKey: 'ui.dashboard.persona.snooze',
    color: 'var(--kd-warning)',
  },
  {
    value: SteamPersonaStatusEnum.Busy,
    labelKey: 'ui.dashboard.persona.busy',
    color: 'var(--kd-danger)',
  },
  {
    value: SteamPersonaStatusEnum.LookingToTrade,
    labelKey: 'ui.dashboard.persona.looking_to_trade',
    color: 'var(--kd-accent)',
  },
  {
    value: SteamPersonaStatusEnum.LookingToPlay,
    labelKey: 'ui.dashboard.persona.looking_to_play',
    color: 'var(--kd-accent)',
  },
  {
    value: SteamPersonaStatusEnum.Invisible,
    labelKey: 'ui.dashboard.persona.invisible',
    color: 'var(--kd-text-muted)',
  },
  {
    value: SteamPersonaStatusEnum.Offline,
    labelKey: 'ui.dashboard.persona.offline',
    color: 'var(--kd-text-muted)',
  },
];

export const PERSONA_OPTIONS: readonly PersonaPresentation[] =
  PERSONA_PRESENTATIONS.filter(
    (persona) => persona.value !== SteamPersonaStatusEnum.Offline,
  );

const UNKNOWN_PERSONA: PersonaPresentation = {
  value: SteamPersonaStatusEnum.Offline,
  labelKey: 'ui.dashboard.persona.unknown',
  color: 'var(--kd-text-muted)',
};

const PERSONA_BY_VALUE = new Map<number, PersonaPresentation>(
  PERSONA_PRESENTATIONS.map((persona) => [persona.value, persona]),
);

export function personaPresentation(value: number): PersonaPresentation {
  return PERSONA_BY_VALUE.get(value) ?? UNKNOWN_PERSONA;
}
