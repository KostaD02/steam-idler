import { SteamPersonaStatusEnum } from '@steam-idler/server/steam-account/types';

import { PERSONA_OPTIONS, personaPresentation } from './persona';

describe('PERSONA_OPTIONS', () => {
  it('excludes the Offline status', () => {
    const hasOffline = PERSONA_OPTIONS.some(
      (option) => option.value === SteamPersonaStatusEnum.Offline,
    );

    expect(hasOffline).toBe(false);
  });

  it('includes Online as a selectable option', () => {
    const online = PERSONA_OPTIONS.find(
      (option) => option.value === SteamPersonaStatusEnum.Online,
    );

    expect(online).toEqual({
      value: SteamPersonaStatusEnum.Online,
      labelKey: 'ui.dashboard.persona.online',
      color: 'var(--kd-accent)',
    });
  });
});

describe('personaPresentation', () => {
  it('returns the matching presentation for a known status', () => {
    const result = personaPresentation(SteamPersonaStatusEnum.Busy);

    expect(result).toEqual({
      value: SteamPersonaStatusEnum.Busy,
      labelKey: 'ui.dashboard.persona.busy',
      color: 'var(--kd-danger)',
    });
  });

  it('resolves the Offline presentation when present in the lookup', () => {
    const result = personaPresentation(SteamPersonaStatusEnum.Offline);

    expect(result.value).toBe(SteamPersonaStatusEnum.Offline);
    expect(result.labelKey).toBe('ui.dashboard.persona.offline');
  });

  it('falls back to the unknown presentation for an unmapped value', () => {
    const result = personaPresentation(999);

    expect(result).toEqual({
      value: SteamPersonaStatusEnum.Offline,
      labelKey: 'ui.dashboard.persona.unknown',
      color: 'var(--kd-text-muted)',
    });
  });
});
