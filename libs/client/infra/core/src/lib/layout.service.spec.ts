import { BreakpointObserver } from '@angular/cdk/layout';
import { TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import { LayoutService } from './layout.service';

const buildObserverStub = (matches: boolean) => ({
  observe: jest.fn().mockReturnValue(of({ matches, breakpoints: {} })),
});

type ObserverStub = ReturnType<typeof buildObserverStub>;

const setup = (matches = false) => {
  const observer = buildObserverStub(matches);
  TestBed.configureTestingModule({
    providers: [{ provide: BreakpointObserver, useValue: observer }],
  });
  const service = TestBed.inject(LayoutService);

  return { service, observer: observer as ObserverStub };
};

describe('LayoutService', () => {
  it('observes the handset breakpoint', () => {
    const { observer } = setup();

    expect(observer.observe).toHaveBeenCalledTimes(1);
  });

  it('reports a mobile view when the breakpoint matches', () => {
    const { service } = setup(true);

    expect(service.isMobileView()).toBe(true);
  });

  it('reports a desktop view when the breakpoint does not match', () => {
    const { service } = setup(false);

    expect(service.isMobileView()).toBe(false);
  });

  describe('sizing', () => {
    it('exposes the layout sizing constants', () => {
      const { service } = setup();

      expect(service.sizing.header).toBe(70);
      expect(service.sizing.innerPadding).toBe(32);
      expect(service.sizing.maxContentWidth).toBe(1400);
    });

    it('computes the inner content height from header and padding', () => {
      const { service } = setup();

      expect(service.sizing.innerContentHeight()).toBe('calc(100dvh - 134px)');
    });
  });
});
