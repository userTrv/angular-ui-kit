import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiCheckbox } from '@usertrv/ui/checkbox';

interface Permission {
  id: string;
  label: string;
  granted: boolean;
}

@Component({
  selector: 'docs-checkbox-select-all-example',
  imports: [UiCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="docs-stack">
      <legend>Repository permissions</legend>
      <ui-checkbox [checked]="allGranted()" [indeterminate]="someGranted()" (checkedChange)="setAll($event)">
        All permissions
      </ui-checkbox>
      <div class="docs-stack" style="padding-inline-start: 1.75rem">
        @for (permission of permissions(); track permission.id) {
          <ui-checkbox [checked]="permission.granted" (checkedChange)="set(permission.id, $event)">
            {{ permission.label }}
          </ui-checkbox>
        }
      </div>
    </fieldset>
  `,
})
export class CheckboxSelectAllExample {
  protected readonly permissions = signal<Permission[]>([
    { id: 'read', label: 'Read code', granted: true },
    { id: 'write', label: 'Push to branches', granted: true },
    { id: 'issues', label: 'Manage issues', granted: false },
    { id: 'settings', label: 'Change settings', granted: false },
  ]);

  protected readonly allGranted = computed(() => this.permissions().every((p) => p.granted));
  protected readonly someGranted = computed(() => !this.allGranted() && this.permissions().some((p) => p.granted));

  protected setAll(granted: boolean): void {
    this.permissions.update((list) => list.map((p) => ({ ...p, granted })));
  }

  protected set(id: string, granted: boolean): void {
    this.permissions.update((list) => list.map((p) => (p.id === id ? { ...p, granted } : p)));
  }
}
