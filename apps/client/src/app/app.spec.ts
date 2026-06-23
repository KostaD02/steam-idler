import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { of, throwError } from 'rxjs';

import { LayoutService, LoaderService } from '@steam-idler/client/infra/core';

import { AuthService } from '@steam-idler/client/auth/data-access';
import { HeaderComponent } from '@steam-idler/client/header/ui';

import { App } from './app';

@Component({ selector: 'si-header', template: '' })
class HeaderStubComponent {}

const sizing = {
  header: 70,
  innerPadding: 32,
  maxContentWidth: 1400,
  innerContentHeight: () => 'calc(100dvh - 134px)',
};

const buildAuthStub = () => ({
  loadCurrentUser: jest.fn().mockReturnValue(of(null)),
});

const buildLoaderStub = () => ({
  isVisible: signal(false),
});

type AuthStub = ReturnType<typeof buildAuthStub>;
type LoaderStub = ReturnType<typeof buildLoaderStub>;

const setup = async () => {
  const auth = buildAuthStub();
  const loader = buildLoaderStub();

  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: LayoutService, useValue: { sizing } },
      { provide: LoaderService, useValue: loader },
    ],
  })
    .overrideComponent(App, {
      remove: { imports: [HeaderComponent] },
      add: { imports: [HeaderStubComponent] },
    })
    .compileComponents();

  const fixture: ComponentFixture<App> = TestBed.createComponent(App);

  return {
    fixture,
    component: fixture.componentInstance,
    auth: auth as AuthStub,
    loader: loader as LoaderStub,
  };
};

describe('App', () => {
  it('exposes the layout sizing config', async () => {
    const { component } = await setup();

    expect(component.sizing).toBe(sizing);
  });

  it('reflects the loader visibility signal', async () => {
    const { component, loader } = await setup();

    expect(component.loading()).toBe(false);

    loader.isVisible.set(true);

    expect(component.loading()).toBe(true);
  });

  describe('ngOnInit', () => {
    it('loads the current user', async () => {
      const { component, auth } = await setup();

      await component.ngOnInit();

      expect(auth.loadCurrentUser).toHaveBeenCalledTimes(1);
    });

    it('completes even when loading the current user resolves to null', async () => {
      const { component, auth } = await setup();
      auth.loadCurrentUser.mockReturnValueOnce(of(null));

      await expect(component.ngOnInit()).resolves.toBeUndefined();
    });

    it('rejects when loading the current user errors', async () => {
      const { component, auth } = await setup();
      auth.loadCurrentUser.mockReturnValueOnce(
        throwError(() => new Error('boom')),
      );

      await expect(component.ngOnInit()).rejects.toThrow('boom');
    });
  });

  describe('template', () => {
    it('renders the loader when loading is true', async () => {
      const { fixture, loader } = await setup();
      loader.isVisible.set(true);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-loader')).not.toBeNull();
    });

    it('hides the loader when loading is false', async () => {
      const { fixture } = await setup();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.app-loader')).toBeNull();
    });
  });
});
