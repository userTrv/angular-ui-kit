import { FocusMonitor } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiTooltip } from './index';

@Component({
  imports: [UiTooltip],
  template: `
    <p id="hint">Saved drafts are kept for 30 days.</p>
    <button class="save" uiTooltip="Save draft (Ctrl+S)" aria-describedby="hint" [uiTooltipDisabled]="off()">
      Save
    </button>
    <button class="locked" uiTooltip="Publishing is locked" aria-disabled="true">Publish</button>
  `,
})
class Host {
  readonly off = signal(false);
}

function pointer(el: Element, type: 'pointerenter' | 'pointerleave' | 'pointerdown', pointerType = 'mouse'): void {
  const event = new MouseEvent(type, { bubbles: type === 'pointerdown' });
  Object.defineProperty(event, 'pointerType', { value: pointerType });
  el.dispatchEvent(event);
}

const tooltip = (): HTMLElement | null => document.querySelector('.cdk-overlay-container [role="tooltip"]');

describe('UiTooltip', () => {
  let fixture: ComponentFixture<Host>;
  let save: HTMLButtonElement;

  beforeEach(() => {
    vi.useFakeTimers();
    fixture = TestBed.createComponent(Host);
    TestBed.tick();
    save = fixture.nativeElement.querySelector('.save');
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  }

  it('shows on hover after the show delay', () => {
    pointer(save, 'pointerenter');
    advance(299);
    expect(tooltip()).toBeNull();
    advance(1);
    expect(tooltip()?.textContent).toBe('Save draft (Ctrl+S)');
  });

  it('references the tooltip from aria-describedby while shown, keeping existing ids', () => {
    pointer(save, 'pointerenter');
    advance(300);
    const id = tooltip()?.id as string;
    expect(id).toMatch(/^ui-tooltip-/);
    expect(save.getAttribute('aria-describedby')).toBe(`hint ${id}`);

    pointer(save, 'pointerleave');
    advance(100);
    expect(tooltip()).toBeNull();
    expect(save.getAttribute('aria-describedby')).toBe('hint');
  });

  it('stays open while the pointer moves onto the tooltip (hoverable)', () => {
    pointer(save, 'pointerenter');
    advance(300);
    pointer(save, 'pointerleave');
    advance(50);
    pointer(tooltip() as HTMLElement, 'pointerenter');
    advance(1000);
    expect(tooltip()).not.toBeNull();

    pointer(tooltip() as HTMLElement, 'pointerleave');
    advance(100);
    expect(tooltip()).toBeNull();
  });

  it('shows immediately on keyboard focus but not on mouse focus', () => {
    const focusMonitor = TestBed.inject(FocusMonitor);
    focusMonitor.focusVia(save, 'mouse');
    advance(500);
    expect(tooltip()).toBeNull();

    save.blur();
    focusMonitor.focusVia(save, 'keyboard');
    TestBed.tick();
    expect(tooltip()).not.toBeNull();

    save.blur();
    TestBed.tick();
    expect(tooltip()).toBeNull();
  });

  it('Escape hides it without moving focus, until hover and focus end', () => {
    TestBed.inject(FocusMonitor).focusVia(save, 'keyboard');
    pointer(save, 'pointerenter');
    TestBed.tick();
    expect(tooltip()).not.toBeNull();

    const event = press(save, 'Escape');
    TestBed.tick();
    expect(event.defaultPrevented).toBe(true);
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(save);

    advance(1000);
    expect(tooltip()).toBeNull(); // still dismissed while hovered and focused

    pointer(save, 'pointerleave');
    save.blur();
    pointer(save, 'pointerenter');
    advance(300);
    expect(tooltip()).not.toBeNull();
  });

  it('hides when the trigger is pressed', () => {
    pointer(save, 'pointerenter');
    advance(300);
    pointer(save, 'pointerdown');
    TestBed.tick();
    expect(tooltip()).toBeNull();
  });

  it('is suppressed when disabled, aria-disabled or on touch', () => {
    fixture.componentInstance.off.set(true);
    TestBed.tick();
    pointer(save, 'pointerenter');
    advance(300);
    expect(tooltip()).toBeNull();

    pointer(fixture.nativeElement.querySelector('.locked'), 'pointerenter');
    advance(300);
    expect(tooltip()).toBeNull();

    fixture.componentInstance.off.set(false);
    TestBed.tick();
    pointer(save, 'pointerleave');
    pointer(save, 'pointerenter', 'touch');
    advance(300);
    expect(tooltip()).toBeNull();
  });

  it('hides when disabled while shown', () => {
    pointer(save, 'pointerenter');
    advance(300);
    fixture.componentInstance.off.set(true);
    TestBed.tick();
    expect(tooltip()).toBeNull();
  });

  it('has no axe violations while shown', async () => {
    pointer(save, 'pointerenter');
    advance(300);
    vi.useRealTimers();
    await expectNoAxeViolations(document.body);
  });
});
