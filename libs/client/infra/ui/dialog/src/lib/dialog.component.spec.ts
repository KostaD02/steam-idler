import { DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  const close = jest.fn();

  const setup = async (
    providers: unknown[] = [{ provide: DialogRef, useValue: { close } }],
  ): Promise<ComponentFixture<DialogComponent>> => {
    close.mockClear();

    await TestBed.configureTestingModule({
      imports: [DialogComponent],
      providers: providers as never,
    }).compileComponents();

    const fixture = TestBed.createComponent(DialogComponent);
    fixture.detectChanges();
    return fixture;
  };

  const closeButton = (
    fixture: ComponentFixture<DialogComponent>,
  ): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector<HTMLButtonElement>('.si-dialog__close');

  it('defaults closable to true', async () => {
    const fixture = await setup();

    expect(fixture.componentInstance.closable()).toBe(true);
  });

  it('renders the close button when closable and a DialogRef is present', async () => {
    const fixture = await setup();

    expect(closeButton(fixture)).toBeTruthy();
  });

  it('hides the close button when closable is false', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('closable', false);
    fixture.detectChanges();

    expect(closeButton(fixture)).toBeNull();
  });

  it('hides the close button when no DialogRef is provided', async () => {
    const fixture = await setup([]);

    expect(closeButton(fixture)).toBeNull();
  });

  it('closes the dialog when the close button is clicked', async () => {
    const fixture = await setup();

    closeButton(fixture)?.click();

    expect(close).toHaveBeenCalledTimes(1);
  });

  it('does not throw on close when no DialogRef is provided', async () => {
    const fixture = await setup([]);

    expect(() => fixture.componentInstance.close()).not.toThrow();
    expect(close).not.toHaveBeenCalled();
  });
});
