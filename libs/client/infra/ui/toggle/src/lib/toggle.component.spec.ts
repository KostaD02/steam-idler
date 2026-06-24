import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ToggleComponent } from './toggle.component';

describe('ToggleComponent', () => {
  const setup = async (): Promise<ComponentFixture<ToggleComponent>> => {
    await TestBed.configureTestingModule({
      imports: [ToggleComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ToggleComponent);
    fixture.detectChanges();

    return fixture;
  };

  const inputOf = (
    fixture: ComponentFixture<ToggleComponent>,
  ): HTMLInputElement =>
    fixture.nativeElement.querySelector<HTMLInputElement>('input');

  it('renders unchecked and enabled by default', async () => {
    const fixture = await setup();
    const input = inputOf(fixture);

    expect(input.checked).toBe(false);
    expect(input.disabled).toBe(false);
    expect(
      fixture.nativeElement.querySelector('.kd-toggle--disabled'),
    ).toBeNull();
  });

  it('reflects the checked input on the underlying checkbox', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('checked', true);
    fixture.detectChanges();

    expect(inputOf(fixture).checked).toBe(true);
  });

  it('reflects the disabled input on the checkbox and label', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    expect(inputOf(fixture).disabled).toBe(true);
    expect(
      fixture.nativeElement.querySelector('.kd-toggle--disabled'),
    ).not.toBeNull();
  });

  it('coerces truthy attribute values via booleanAttribute', async () => {
    const fixture = await setup();
    fixture.componentRef.setInput('checked', '');
    fixture.detectChanges();

    expect(fixture.componentInstance.checked()).toBe(true);
  });

  describe('onChange', () => {
    it('emits the next value when the checkbox is toggled on', async () => {
      const fixture = await setup();
      const emitted: boolean[] = [];
      fixture.componentInstance.checkedChange.subscribe((value) => {
        emitted.push(value);
      });

      const input = inputOf(fixture);
      input.checked = true;
      input.dispatchEvent(new Event('change'));

      expect(emitted).toEqual([true]);
    });

    it('emits the next value when the checkbox is toggled off', async () => {
      const fixture = await setup();
      fixture.componentRef.setInput('checked', true);
      fixture.detectChanges();

      const emitted: boolean[] = [];
      fixture.componentInstance.checkedChange.subscribe((value) => {
        emitted.push(value);
      });

      const input = inputOf(fixture);
      input.checked = false;
      input.dispatchEvent(new Event('change'));

      expect(emitted).toEqual([false]);
    });

    it('reverts the checkbox to the bound value so the parent stays the source of truth', async () => {
      const fixture = await setup();
      const input = inputOf(fixture);

      input.checked = true;
      input.dispatchEvent(new Event('change'));

      expect(input.checked).toBe(false);
    });
  });
});
