import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UI_DIALOG_DATA, UiDialogContent, UiDialogRef, UiDialogTitle } from '@usertrv/ui/dialog';
import { UiDrawer } from '@usertrv/ui/drawer';

const SECTIONS = ['Dashboard', 'Projects', 'Team', 'Billing', 'Settings'];

@Component({
  selector: 'docs-navigation-drawer',
  imports: [UiButton, UiDialogTitle, UiDialogContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 uiDialogTitle>Acme workspace</h2>
    <nav uiDialogContent aria-label="Main">
      <ul class="docs-stack">
        @for (section of sections; track section) {
          <li>
            <button
              uiButton
              block
              [variant]="section === current ? 'secondary' : 'ghost'"
              [attr.aria-current]="section === current ? 'page' : null"
              (click)="ref.close(section)"
            >
              {{ section }}
            </button>
          </li>
        }
      </ul>
    </nav>
  `,
  styles: `ul { list-style: none; margin: 0; padding: 0; }`,
})
class NavigationDrawer {
  protected readonly ref = inject<UiDialogRef<string>>(UiDialogRef);
  protected readonly current = inject(UI_DIALOG_DATA) as string;
  protected readonly sections = SECTIONS;
}

@Component({
  selector: 'docs-drawer-navigation-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiIconButton aria-label="Open navigation" (click)="openMenu()">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M3 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm0 5a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1Zm1 4a1 1 0 1 0 0 2h12a1 1 0 1 0 0-2H4Z" /></svg>
      </button>
      <span>Current page: <strong>{{ section() }}</strong></span>
    </div>
  `,
})
export class DrawerNavigationExample {
  private readonly drawer = inject(UiDrawer);
  protected readonly section = signal('Projects');

  protected async openMenu(): Promise<void> {
    const next = await this.drawer.open<string, string>(NavigationDrawer, { position: 'start', data: this.section() }).result;
    if (next) this.section.set(next);
  }
}
