import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { press } from '../test-utils';
import { UiRovingFocusGroup, UiRovingFocusItem } from './index';

@Component({
  imports: [UiRovingFocusGroup, UiRovingFocusItem],
  template: `
    <div uiRovingFocusGroup="horizontal" role="toolbar" aria-label="Formatting">
      <button uiRovingFocusItem>Bold</button>
      <button uiRovingFocusItem [uiRovingFocusItemDisabled]="true">Italic</button>
      <button uiRovingFocusItem>Underline</button>
    </div>
  `,
})
class Host {}

describe('UiRovingFocusGroup', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const group = fixture.nativeElement.querySelector('[role=toolbar]') as HTMLElement;
    return { fixture, buttons, group };
  }

  it('puts only the first enabled item in the tab order', async () => {
    const { buttons } = await setup();
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });

  it('moves focus with arrows, skipping disabled items, and wraps', async () => {
    const { fixture, buttons } = await setup();
    buttons[0].focus();
    press(buttons[0], 'ArrowRight');
    await fixture.whenStable();
    expect(document.activeElement).toBe(buttons[2]);
    expect(buttons.map((b) => b.tabIndex)).toEqual([-1, -1, 0]);
    press(buttons[2], 'ArrowRight');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('supports Home and End', async () => {
    const { buttons } = await setup();
    buttons[0].focus();
    press(buttons[0], 'End');
    expect(document.activeElement).toBe(buttons[2]);
    press(buttons[2], 'Home');
    expect(document.activeElement).toBe(buttons[0]);
  });

  it('ignores vertical arrows in horizontal orientation', async () => {
    const { buttons } = await setup();
    buttons[0].focus();
    press(buttons[0], 'ArrowDown');
    expect(document.activeElement).toBe(buttons[0]);
  });
});
