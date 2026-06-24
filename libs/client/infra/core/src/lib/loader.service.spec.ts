import { TestBed } from '@angular/core/testing';

import { LoaderService } from './loader.service';

const setup = () => {
  TestBed.configureTestingModule({});
  const service = TestBed.inject(LoaderService);

  return { service };
};

describe('LoaderService', () => {
  it('starts hidden', () => {
    const { service } = setup();

    expect(service.isVisible()).toBe(false);
  });

  it('becomes visible after show', () => {
    const { service } = setup();

    service.show();

    expect(service.isVisible()).toBe(true);
  });

  it('becomes hidden again after hide', () => {
    const { service } = setup();
    service.show();

    service.hide();

    expect(service.isVisible()).toBe(false);
  });
});
