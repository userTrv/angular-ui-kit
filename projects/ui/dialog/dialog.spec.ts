import { Component, TemplateRef, inject, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import {
  UI_DIALOG_DATA,
  UiDialog,
  UiDialogActions,
  UiDialogClose,
  UiDialogContent,
  UiDialogRef,
  UiDialogTemplateContext,
  UiDialogTitle,
} from './index';

@Component({
  imports: [UiDialogTitle, UiDialogContent, UiDialogActions, UiDialogClose],
  template: `
    <h2 uiDialogTitle>Rename file</h2>
    <div uiDialogContent>
      <label for="name">Name</label>
      <input id="name" [value]="data.name" />
      <button type="button" class="open-nested" (click)="openNested()">Advanced…</button>
    </div>
    <div uiDialogActions>
      <button uiDialogClose>Cancel</button>
      <button class="save" [uiDialogClose]="'saved'">Save</button>
    </div>
  `,
})
class RenameDialog {
  protected readonly data = inject(UI_DIALOG_DATA) as { name: string };
  readonly ref = inject<UiDialogRef<string>>(UiDialogRef);
  private readonly dialog = inject(UiDialog);

  protected openNested(): void {
    this.dialog.open(AdvancedDialog);
  }
}

@Component({
  imports: [UiDialogTitle, UiDialogContent, UiDialogClose],
  template: `
    <h2 uiDialogTitle>Advanced</h2>
    <p uiDialogContent>Nested settings</p>
    <button uiDialogClose class="close-nested">Done</button>
  `,
})
class AdvancedDialog {}

@Component({
  imports: [UiDialogTitle, UiDialogClose],
  template: `
    <button class="opener" (click)="open()">Rename</button>
    <p inert class="already-inert">Unrelated</p>
    <ng-template #tpl let-data let-ref="dialogRef">
      <h2 uiDialogTitle>{{ data }}</h2>
      <button class="tpl-close" [uiDialogClose]="42">OK</button>
    </ng-template>
  `,
})
class Host {
  readonly dialog = inject(UiDialog);
  readonly tpl = viewChild.required<TemplateRef<UiDialogTemplateContext<string, number>>>('tpl');
  ref?: UiDialogRef<string, RenameDialog>;

  open(disableClose = false): void {
    this.ref = this.dialog.open<string, { name: string }, RenameDialog>(RenameDialog, {
      data: { name: 'report.pdf' },
      disableClose,
    });
  }
}

const overlay = (): HTMLElement => document.querySelector('.cdk-overlay-container') as HTMLElement;
const surfaces = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('ui-dialog-container'));
const backdrops = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.cdk-overlay-backdrop'));

describe('UiDialog', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let opener: HTMLButtonElement;

  async function openFromButton(disableClose = false): Promise<HTMLElement> {
    opener.focus();
    host.open(disableClose);
    await fixture.whenStable();
    await Promise.resolve(); // uiDialogTitle registers its id in a microtask
    await fixture.whenStable();
    return surfaces().at(-1) as HTMLElement;
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    opener = fixture.nativeElement.querySelector('.opener');
  });

  afterEach(() => host.dialog.closeAll());

  it('renders a labelled modal dialog with injected data', async () => {
    const surface = await openFromButton();
    const title = surface.querySelector('h2') as HTMLElement;
    expect(surface.getAttribute('role')).toBe('dialog');
    expect(surface.getAttribute('aria-modal')).toBe('true');
    expect(surface.getAttribute('aria-labelledby')).toBe(title.id);
    expect(title.id).toMatch(/^ui-dialog-title-/);
    expect((surface.querySelector('input') as HTMLInputElement).value).toBe('report.pdf');
    expect(surface.closest('.cdk-overlay-pane')?.classList).toContain('ui-dialog-pane--md');
  });

  it('moves focus into the dialog', async () => {
    const surface = await openFromButton();
    expect(surface.contains(document.activeElement)).toBe(true);
  });

  it('closes with a result from uiDialogClose and restores focus to the opener', async () => {
    const surface = await openFromButton();
    const closed = vi.fn();
    host.ref?.closed.subscribe(closed);
    (surface.querySelector('.save') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(closed).toHaveBeenCalledWith('saved');
    await expect(host.ref?.result).resolves.toBe('saved');
    expect(surfaces()).toHaveLength(0);
    expect(document.activeElement).toBe(opener);
  });

  it('defaults uiDialogClose buttons to type="button"', async () => {
    const surface = await openFromButton();
    expect(surface.querySelector('.save')?.getAttribute('type')).toBe('button');
  });

  it('closes on Escape with an undefined result and restores focus', async () => {
    await openFromButton();
    press(document.activeElement as Element, 'Escape');
    await fixture.whenStable();
    await expect(host.ref?.result).resolves.toBeUndefined();
    expect(surfaces()).toHaveLength(0);
    expect(document.activeElement).toBe(opener);
  });

  it('closes on backdrop click', async () => {
    await openFromButton();
    backdrops()[0].click();
    await fixture.whenStable();
    expect(surfaces()).toHaveLength(0);
  });

  it('ignores Escape and backdrop clicks when disableClose is set', async () => {
    await openFromButton(true);
    press(document.activeElement as Element, 'Escape');
    backdrops()[0].click();
    await fixture.whenStable();
    expect(surfaces()).toHaveLength(1);
  });

  it('makes the page inert while open and restores it afterwards', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const alreadyInert = root.querySelector('.already-inert') as HTMLElement;
    await openFromButton();
    const pageRoot = Array.from(document.body.children).find((c) => c.contains(root)) as HTMLElement;
    expect(pageRoot.hasAttribute('inert')).toBe(true);
    expect(pageRoot.getAttribute('aria-hidden')).toBe('true'); // CDK's part
    expect(overlay().hasAttribute('inert')).toBe(false);

    host.ref?.close();
    await fixture.whenStable();
    expect(pageRoot.hasAttribute('inert')).toBe(false);
    expect(alreadyInert.hasAttribute('inert')).toBe(true); // not ours, left alone
  });

  it('opens templates with data and dialogRef in the context', async () => {
    const ref = host.dialog.open<number, string>(host.tpl(), { data: 'Saved', size: 'sm' });
    await fixture.whenStable();
    await Promise.resolve();
    await fixture.whenStable();
    const surface = surfaces()[0];
    expect(surface.querySelector('h2')?.textContent).toBe('Saved');
    expect(surface.getAttribute('aria-labelledby')).toBe(surface.querySelector('h2')?.id);
    expect(surface.closest('.cdk-overlay-pane')?.classList).toContain('ui-dialog-pane--sm');
    (surface.querySelector('.tpl-close') as HTMLButtonElement).click();
    await expect(ref.result).resolves.toBe(42);
  });

  it('exposes open dialogs as a signal', async () => {
    await openFromButton();
    expect(host.dialog.openDialogs()).toEqual([host.ref]);
    host.dialog.closeAll();
    expect(host.dialog.openDialogs()).toEqual([]);
  });

  it('has no axe violations when open', async () => {
    await openFromButton();
    await expectNoAxeViolations(overlay());
  });

  describe('stacked dialogs', () => {
    it('Escape closes only the top dialog and focus returns into the one below', async () => {
      const first = await openFromButton();
      const nestedOpener = first.querySelector('.open-nested') as HTMLButtonElement;
      nestedOpener.focus();
      nestedOpener.click();
      await fixture.whenStable();
      expect(surfaces()).toHaveLength(2);
      const firstHost = first.closest('.cdk-overlay-pane')?.parentElement as HTMLElement;
      expect(firstHost.hasAttribute('inert')).toBe(true);

      press(document.activeElement as Element, 'Escape');
      await fixture.whenStable();
      expect(surfaces()).toEqual([first]);
      expect(firstHost.hasAttribute('inert')).toBe(false);
      expect(document.activeElement).toBe(nestedOpener);
      expect(fixture.nativeElement.closest('[inert]')).not.toBeNull(); // page still inert

      press(document.activeElement as Element, 'Escape');
      await fixture.whenStable();
      expect(surfaces()).toHaveLength(0);
      expect(fixture.nativeElement.closest('[inert]')).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });

  describe('confirm()', () => {
    async function openConfirm(): Promise<{ result: Promise<boolean>; surface: HTMLElement }> {
      opener.focus();
      const result = host.dialog.confirm({
        title: 'Delete project?',
        message: 'All 12 boards and their history will be removed.',
        confirmLabel: 'Delete',
        variant: 'danger',
      });
      await fixture.whenStable();
      await Promise.resolve();
      await fixture.whenStable();
      return { result, surface: surfaces()[0] };
    }

    it('is an alertdialog labelled by the title and described by the message', async () => {
      const { surface } = await openConfirm();
      expect(surface.getAttribute('role')).toBe('alertdialog');
      const describedBy = surface.getAttribute('aria-describedby') as string;
      expect(document.getElementById(describedBy)?.textContent).toContain('12 boards');
      expect(surface.getAttribute('aria-labelledby')).toBe(surface.querySelector('h2')?.id);
      await expectNoAxeViolations(surface);
    });

    it('focuses Cancel first (least destructive)', async () => {
      const { surface } = await openConfirm();
      expect(document.activeElement).toBe(surface.querySelector('[data-ui-confirm-cancel]'));
    });

    it('resolves true on confirm and false on Escape', async () => {
      const first = await openConfirm();
      const buttons = first.surface.querySelectorAll('button');
      (buttons[1] as HTMLButtonElement).click();
      await expect(first.result).resolves.toBe(true);

      const second = await openConfirm();
      press(document.activeElement as Element, 'Escape');
      await expect(second.result).resolves.toBe(false);
    });
  });
});
