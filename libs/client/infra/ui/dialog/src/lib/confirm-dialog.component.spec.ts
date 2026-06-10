import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  const close = jest.fn();

  const setup = async (
    data: ConfirmDialogData,
  ): Promise<ComponentFixture<ConfirmDialogComponent>> => {
    close.mockClear();

    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.detectChanges();
    return fixture;
  };

  const buttonByText = (
    fixture: ComponentFixture<ConfirmDialogComponent>,
    text: string,
  ): HTMLButtonElement | undefined =>
    Array.from(
      fixture.nativeElement.querySelectorAll<HTMLButtonElement>('button'),
    ).find((button) => button.textContent?.trim() === text);

  it('renders the title and body', async () => {
    const fixture = await setup({
      title: 'Remove account',
      body: 'Are you sure?',
    });

    expect(fixture.nativeElement.textContent).toContain('Remove account');
    expect(fixture.nativeElement.textContent).toContain('Are you sure?');
  });

  it('uses the default OK / Close labels', async () => {
    const fixture = await setup({ title: 'T', body: 'B' });

    expect(buttonByText(fixture, 'OK')).toBeTruthy();
    expect(buttonByText(fixture, 'Close')).toBeTruthy();
  });

  it('renders custom button labels when provided', async () => {
    const fixture = await setup({
      title: 'T',
      body: 'B',
      okLabel: 'Delete',
      closeLabel: 'Cancel',
    });

    expect(buttonByText(fixture, 'Delete')).toBeTruthy();
    expect(buttonByText(fixture, 'Cancel')).toBeTruthy();
  });

  it('closes with true when the confirm button is clicked', async () => {
    const fixture = await setup({ title: 'T', body: 'B' });

    buttonByText(fixture, 'OK')?.click();

    expect(close).toHaveBeenCalledWith(true);
  });

  it('closes with false when the dismiss button is clicked', async () => {
    const fixture = await setup({ title: 'T', body: 'B' });

    buttonByText(fixture, 'Close')?.click();

    expect(close).toHaveBeenCalledWith(false);
  });
});
