import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardComponent } from './card.component';

@Component({
  imports: [CardComponent],
  template: `<si-card><span class="projected">Hello card</span></si-card>`,
})
class HostComponent {}

describe('CardComponent', () => {
  const setupHost = async (): Promise<ComponentFixture<HostComponent>> => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    return fixture;
  };

  it('creates the component', async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CardComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeInstanceOf(CardComponent);
  });

  it('renders as the si-card element', async () => {
    const fixture = await setupHost();

    expect(fixture.nativeElement.querySelector('si-card')).toBeTruthy();
  });

  it('projects content into the card', async () => {
    const fixture = await setupHost();

    const projected =
      fixture.nativeElement.querySelector<HTMLElement>('.projected');

    expect(projected).toBeTruthy();
    expect(projected?.textContent?.trim()).toBe('Hello card');
  });
});
