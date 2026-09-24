import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import {
  UiMenu,
  UiMenuGroup,
  UiMenuItemCheckbox,
  UiMenuItemRadio,
  UiMenuSeparator,
  UiMenuTrigger,
} from '@usertrv/ui/menu';

type SortKey = 'updated' | 'name' | 'owner';

@Component({
  selector: 'docs-menu-selectable-example',
  imports: [UiButton, UiMenu, UiMenuGroup, UiMenuItemCheckbox, UiMenuItemRadio, UiMenuSeparator, UiMenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton [uiMenuTriggerFor]="view">View options</button>
      <span class="docs-muted">
        Sorted by {{ sortLabels[sort()] }} · archived {{ showArchived() ? 'shown' : 'hidden' }} ·
        {{ compact() ? 'compact' : 'comfortable' }} rows
      </span>
    </div>

    <ng-template #view>
      <ui-menu>
        <button uiMenuItemCheckbox [(checked)]="showArchived">Show archived</button>
        <button uiMenuItemCheckbox [(checked)]="compact">Compact rows</button>
        <ui-menu-separator />
        <div uiMenuGroup aria-label="Sort by">
          @for (key of sortKeys; track key) {
            <button uiMenuItemRadio [checked]="sort() === key" (triggered)="sort.set(key)">
              {{ sortLabels[key] }}
            </button>
          }
        </div>
      </ui-menu>
    </ng-template>
  `,
})
export class MenuSelectableExample {
  protected readonly showArchived = signal(false);
  protected readonly compact = signal(true);
  protected readonly sort = signal<SortKey>('updated');
  protected readonly sortKeys: SortKey[] = ['updated', 'name', 'owner'];
  protected readonly sortLabels: Record<SortKey, string> = {
    updated: 'Last updated',
    name: 'Name',
    owner: 'Owner',
  };
}
