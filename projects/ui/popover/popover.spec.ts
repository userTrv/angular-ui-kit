import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiPopover, UiPopoverAutoFocus, UiPopoverClose, UiPopoverCloseReason, UiPopoverTrigger } from './index';

@Component({
  imports: [UiPopover, UiPopoverTrigger, UiPopoverClose],
  template: `
    <button
      class="trigger"
      [uiPopoverTrigger]="filters"
      [uiPopoverAutoFocus]="autoFocus()"
      [(uiPopoverOpen)]="open"
      (uiPopoverClosed)="reasons.push($event)"
    >
      Filters
    </button>
    <button class="elsewhere">Export</button>
    <ng-template uiPopover #filters="uiPopover" uiPopoverLabelledBy="filters-title">
      <h3 id="filters-title">Filter issues</h3>
      <label><input type="checkbox" class="first" /> Only open</label>
      <label><input type="checkbox" /> Assigned to me</label>
      <button class="apply" uiPopoverClose>Apply</button>
    </ng-template>
  `,
})
class Host {
  readonly open = signal(false);
  readonly autoFocus = signal<UiPopoverAutoFocus>('first-tabbable');
  readonly reasons: UiPopoverCloseReason[] = [];
}

const panel = (): HTMLElement | null => document.querySelector('.cdk-overlay-container ui-popover-panel');

describe('UiPopover', () => {
  let fixture: ComponentFixture<Host>;
  let trigger: HTMLButtonElement;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    trigger = fixture.nativeElement.querySelector('.trigger');
  });

  async function openByClick(): Promise<HTMLElement> {
    trigger.focus();
    trigger.click();
    await fixture.whenStable();
    return panel() as HTMLElement;
  }

  it('exposes a collapsed dialog trigger', () => {
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
  });

  it('opens on click as a labelled non-modal dialog and focuses the first tabbable element', async () => {
    const el = await openByClick();
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.hasAttribute('aria-modal')).toBe(false);
    expect(el.getAttribute('aria-labelledby')).toBe('filters-title');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(el.id);
    expect(document.activeElement).toBe(el.querySelector('.first'));
    expect(fixture.componentInstance.open()).toBe(true);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    await openByClick();
    press(document.activeElement as Element, 'Escape');
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(fixture.componentInstance.reasons).toEqual(['escape']);
  });

  it('toggles on a second trigger click', async () => {
    await openByClick();
    trigger.click();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['trigger']);
  });

  it('closes on an outside click; focus returns to the trigger only if it was lost', async () => {
    await openByClick();
    (document.activeElement as HTMLElement).blur(); // pressing on a non-focusable area
    document.body.click();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    await openByClick();
    const elsewhere = fixture.nativeElement.querySelector('.elsewhere') as HTMLButtonElement;
    elsewhere.focus();
    elsewhere.click();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(elsewhere);
    expect(fixture.componentInstance.reasons).toEqual(['outside', 'outside']);
  });

  it('closes when Tab leaves the last element or Shift+Tab leaves the first', async () => {
    let el = await openByClick();
    (el.querySelector('.apply') as HTMLElement).focus();
    const tab = press(document.activeElement as Element, 'Tab');
    await fixture.whenStable();
    expect(tab.defaultPrevented).toBe(true);
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);

    el = await openByClick();
    const inner = press(el.querySelectorAll('input')[1], 'Tab');
    expect(inner.defaultPrevented).toBe(false); // moving within the panel
    press(el.querySelector('.first') as Element, 'Tab', { shiftKey: true });
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(fixture.componentInstance.reasons).toEqual(['tab', 'tab']);
  });

  it('closes from a uiPopoverClose button', async () => {
    const el = await openByClick();
    const apply = el.querySelector('.apply') as HTMLButtonElement;
    expect(apply.getAttribute('type')).toBe('button');
    apply.click();
    await fixture.whenStable();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('keeps focus on the trigger with autoFocus "none"; Tab then enters the panel', async () => {
    fixture.componentInstance.autoFocus.set('none');
    await fixture.whenStable();
    const el = await openByClick();
    expect(document.activeElement).toBe(trigger);
    press(trigger, 'Tab');
    expect(document.activeElement).toBe(el.querySelector('.first'));
  });

  it('follows the two-way open binding', async () => {
    fixture.componentInstance.open.set(true);
    await fixture.whenStable();
    expect(panel()).not.toBeNull();
    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(panel()).toBeNull();
  });

  it('has no axe violations when open', async () => {
    await openByClick();
    await expectNoAxeViolations(document.body);
  });
});
