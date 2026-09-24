import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiToast, UiToaster } from './index';

@Component({ template: `<button class="save">Save</button>` })
class Host {
  readonly toast = inject(UiToast);
}

@Component({ imports: [UiToaster], template: `<ui-toaster position="top-end" />` })
class PlacedHost {
  readonly toast = inject(UiToast);
}

const toaster = (): HTMLElement => document.querySelector('ui-toaster') as HTMLElement;
const toasts = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.ui-toast'));
const texts = (): string[] => toasts().map((t) => t.querySelector('.ui-toast__message')?.textContent ?? '');

describe('UiToast', () => {
  let fixture: ComponentFixture<Host>;
  let toast: UiToast;
  let announce: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    fixture = TestBed.createComponent(Host);
    toast = fixture.componentInstance.toast;
    TestBed.tick();
  });

  afterEach(() => {
    toast.dismissAll();
    fixture.destroy();
    vi.useRealTimers();
  });

  async function advance(ms: number): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    TestBed.tick();
  }

  it('auto-creates a toaster region in the overlay container and renders the toast', async () => {
    toast.show({ title: 'Invoice sent', message: 'INV-2041 was emailed to Acme Corp.', variant: 'success' });
    await advance(0);
    expect(toaster().closest('.cdk-overlay-container')).not.toBeNull();
    expect(toaster().getAttribute('role')).toBe('region');
    expect(toaster().getAttribute('aria-label')).toBe('Notifications');
    expect(toaster().classList).toContain('ui-toaster--bottom-end');
    expect(toasts()[0].classList).toContain('ui-toast--success');
    expect(toasts()[0].querySelector('.ui-toast__title')?.textContent).toBe('Invoice sent');
    expect(document.activeElement).toBe(document.body); // never steals focus
  });

  it('auto-dismisses after the duration', async () => {
    const ref = toast.show({ message: 'Copied', duration: 2000 });
    await advance(1999);
    expect(toasts()).toHaveLength(1);
    await advance(1);
    expect(toasts()).toHaveLength(0);
    await expect(ref.dismissed).resolves.toBe('timeout');
  });

  it('keeps toasts with duration 0 until closed', async () => {
    toast.show({ message: 'Connection lost', variant: 'danger', duration: 0 });
    await advance(60_000);
    expect(toasts()).toHaveLength(1);
  });

  it('queues beyond maxVisible and promotes queued toasts as others leave', async () => {
    const refs = [1, 2, 3, 4, 5].map((n) => toast.show({ message: `Upload ${n} done`, duration: 1000 * n }));
    await advance(0);
    expect(texts()).toEqual(['Upload 1 done', 'Upload 2 done', 'Upload 3 done']);
    expect(toast.queued()).toBe(2);
    expect(announce).toHaveBeenCalledTimes(3);

    refs[1].dismiss();
    await advance(0);
    expect(texts()).toEqual(['Upload 1 done', 'Upload 3 done', 'Upload 4 done']);
    expect(announce).toHaveBeenLastCalledWith('Upload 4 done', 'polite');

    // The countdown of a queued toast only starts once it is visible.
    await advance(1000);
    expect(texts()).toEqual(['Upload 3 done', 'Upload 4 done', 'Upload 5 done']);
  });

  it('pauses on hover and resumes with the remaining time', async () => {
    toast.show({ message: 'Draft saved', duration: 5000 });
    await advance(3000);
    toaster().dispatchEvent(new Event('pointerenter'));
    await advance(10_000);
    expect(toasts()).toHaveLength(1);
    toaster().dispatchEvent(new Event('pointerleave'));
    await advance(1999);
    expect(toasts()).toHaveLength(1);
    await advance(1);
    expect(toasts()).toHaveLength(0);
  });

  it('pauses while focus is inside the region', async () => {
    toast.show({ message: 'Draft saved', duration: 5000 });
    await advance(0);
    (toasts()[0].querySelector('.ui-toast__close') as HTMLElement).focus();
    await advance(10_000);
    expect(toasts()).toHaveLength(1);
    (fixture.nativeElement.querySelector('.save') as HTMLElement).focus();
    await advance(5000);
    expect(toasts()).toHaveLength(0);
  });

  it('closes from the labelled close button and keeps focus in the region', async () => {
    const first = toast.show({ title: 'Export ready', message: 'orders.csv' });
    toast.show({ message: 'Second' });
    await advance(0);
    const close = toasts()[0].querySelector('.ui-toast__close') as HTMLButtonElement;
    expect(close.getAttribute('aria-label')).toBe('Dismiss: Export ready');
    close.focus();
    close.click();
    await advance(0);
    await expect(first.dismissed).resolves.toBe('close');
    expect(document.activeElement).toBe(toasts()[0].querySelector('.ui-toast__close'));
  });

  it('runs the action and dismisses the toast', async () => {
    const undo = vi.fn();
    const ref = toast.show({ title: 'Task deleted', message: '"Q3 report"', action: { label: 'Undo', handler: undo } });
    await advance(0);
    (toasts()[0].querySelector('.ui-toast__action') as HTMLButtonElement).click();
    expect(undo).toHaveBeenCalledOnce();
    await expect(ref.dismissed).resolves.toBe('action');
  });

  it('gives action toasts a longer default duration', async () => {
    toast.show({ message: 'Archived', action: { label: 'Undo', handler: () => undefined } });
    await advance(9999);
    expect(toasts()).toHaveLength(1);
    await advance(1);
    expect(toasts()).toHaveLength(0);
  });

  it('announces politely, and assertively for danger', async () => {
    toast.show({ title: 'Saved', message: 'All changes are saved.', variant: 'success' });
    toast.show({ title: 'Payment failed', message: 'The card was declined.', variant: 'danger' });
    toast.show({ title: 'Deleted', message: 'Invoice removed.', action: { label: 'Undo', handler: () => undefined } });
    await advance(0);
    expect(announce).toHaveBeenNthCalledWith(1, 'Saved. All changes are saved.', 'polite');
    expect(announce).toHaveBeenNthCalledWith(2, 'Payment failed. The card was declined.', 'assertive');
    expect(announce).toHaveBeenNthCalledWith(3, 'Deleted. Invoice removed. Press F8 to reach notifications.', 'polite');
  });

  it('dismissAll clears visible and queued toasts', async () => {
    for (let i = 0; i < 5; i++) toast.show({ message: `Toast ${i}` });
    await advance(0);
    toast.dismissAll();
    await advance(0);
    expect(toasts()).toHaveLength(0);
    expect(toast.queued()).toBe(0);
  });

  it('F8 moves focus to the region and Escape returns it', async () => {
    const save = fixture.nativeElement.querySelector('.save') as HTMLButtonElement;
    save.focus();
    press(save, 'F8');
    expect(document.activeElement).toBe(save); // no toasts: F8 does nothing

    toast.show({ message: 'Saved' });
    await advance(0);
    const f8 = press(save, 'F8');
    expect(f8.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(toaster());
    press(toaster(), 'Escape');
    expect(document.activeElement).toBe(save);
  });

  it('has no axe violations with toasts of every variant', async () => {
    toast.show({ title: 'Info', message: 'A new version is available.' });
    toast.show({ title: 'Warning', message: 'Storage is 90% full.', variant: 'warning' });
    toast.show({ title: 'Error', message: 'Upload failed.', variant: 'danger', action: { label: 'Retry', handler: () => undefined } });
    await advance(0);
    vi.useRealTimers();
    await expectNoAxeViolations(toaster());
  });
});

describe('UiToaster placed by the app', () => {
  it('is used instead of an auto-created one', async () => {
    const fixture = TestBed.createComponent(PlacedHost);
    await fixture.whenStable();
    fixture.componentInstance.toast.show({ message: 'Hello' });
    await fixture.whenStable();
    const placed = fixture.nativeElement.querySelector('ui-toaster') as HTMLElement;
    expect(document.querySelectorAll('ui-toaster')).toHaveLength(1);
    expect(placed.classList).toContain('ui-toaster--top-end');
    expect(placed.querySelectorAll('.ui-toast')).toHaveLength(1);
    fixture.componentInstance.toast.dismissAll();
  });
});
