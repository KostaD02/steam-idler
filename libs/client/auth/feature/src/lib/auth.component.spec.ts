import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LayoutService } from '@steam-idler/client/infra/core';

import { AuthComponent } from './auth.component';

describe('AuthComponent', () => {
  const sizing = {
    header: 70,
    innerPadding: 32,
    maxContentWidth: 1400,
    innerContentHeight: () => 'calc(100dvh - 134px)',
  };

  const setup = async (): Promise<ComponentFixture<AuthComponent>> => {
    await TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideRouter([]),
        { provide: LayoutService, useValue: { sizing } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AuthComponent);
    fixture.detectChanges();

    return fixture;
  };

  it('exposes the layout sizing config', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.sizing).toBe(sizing);
  });

  it('applies the inner content height to the auth screen', async () => {
    const fixture = await setup();
    const section =
      fixture.nativeElement.querySelector<HTMLElement>('.auth-screen');

    expect(section.style.height).toBe('calc(100dvh - 134px)');
  });

  it('renders the card with a router outlet inside', async () => {
    const fixture = await setup();

    expect(fixture.nativeElement.querySelector('si-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
  });
});
