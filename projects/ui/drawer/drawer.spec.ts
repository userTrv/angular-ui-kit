import { Component, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UiDialogClose, UiDialogContent, UiDialogRef, UiDialogTitle } from '@usertrv/ui/dialog';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiDrawer, UiDrawerPosition } from './index';

@Component({
  imports: [UiDialogTitle, UiDialogContent, UiDialogClose],
  template: `
    <h2 uiDialogTitle>Filters</h2>
    <div uiDialogContent>
      <label><input type="checkbox" /> Only open issues</label>
    </div>
    <button class="apply" [uiDialogClose]="'applied'">Apply</button>
  `,
})
class FiltersDrawer {
  readonly ref = inject(UiDialogRef);
}

@Component({ template: `<button class="opener">Filters</button>` })
class Host {
  readonly drawer = inject(UiDrawer);
}

const pane = (): HTMLElement => document.querySelector('.cdk-overlay-pane') as HTMLElement;
const surface = (): HTMLElement | null => document.querySelector('ui-dialog-container');

describe('UiDrawer', () => {
  let fixture: ComponentFixture<Host>;
  let opener: HTMLButtonElement;

  async function open(position?: UiDrawerPosition): Promise<UiDialogRef<string, FiltersDrawer>> {
    opener.focus();
    const ref = fixture.componentInstance.drawer.open<string, void, FiltersDrawer>(FiltersDrawer, { position });
    await fixture.whenStable();
    await Promise.resolve();
    await fixture.whenStable();
    return ref;
  }

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    opener = fixture.nativeElement.querySelector('.opener');
  });

  it('opens at the end edge by default as a labelled modal dialog', async () => {
    await open();
    expect(pane().classList).toContain('ui-drawer-pane--end');
    expect(pane().classList).not.toContain('ui-dialog-pane');
    expect((pane().parentElement as HTMLElement).style.justifyContent).toBe('flex-end');
    const el = surface() as HTMLElement;
    expect(el.getAttribute('role')).toBe('dialog');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('aria-labelledby')).toBe(el.querySelector('h2')?.id);
  });

  it('supports start and bottom sheets', async () => {
    const start = await open('start');
    expect(pane().classList).toContain('ui-drawer-pane--start');
    expect((pane().parentElement as HTMLElement).style.justifyContent).toBe('flex-start');
    start.close();
    await fixture.whenStable();

    await open('bottom');
    expect(pane().classList).toContain('ui-drawer-pane--bottom');
    expect((pane().parentElement as HTMLElement).style.alignItems).toBe('flex-end');
  });

  it('shares the dialog behaviour: inert page, Escape, focus restore', async () => {
    const ref = await open();
    expect(fixture.nativeElement.closest('[inert]')).not.toBeNull();
    expect(surface()?.contains(document.activeElement)).toBe(true);

    press(document.activeElement as Element, 'Escape');
    await fixture.whenStable();
    await expect(ref.result).resolves.toBeUndefined();
    expect(surface()).toBeNull();
    expect(fixture.nativeElement.closest('[inert]')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('returns results through uiDialogClose', async () => {
    const ref = await open();
    (surface()?.querySelector('.apply') as HTMLButtonElement).click();
    await expect(ref.result).resolves.toBe('applied');
  });

  it('has no axe violations when open', async () => {
    await open();
    await expectNoAxeViolations(document.querySelector('.cdk-overlay-container') as HTMLElement);
  });
});
