import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { UiButton } from '@usertrv/ui/button';
import { UiCombobox } from '@usertrv/ui/combobox';
import { UiError } from '@usertrv/ui/form-field';

interface Member {
  id: number;
  name: string;
  team: string;
}

@Component({
  selector: 'docs-combobox-objects-example',
  imports: [UiCombobox, FormField, UiButton, UiError],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
  `,
  template: `
    <form class="docs-stack" novalidate (submit)="assign($event)">
      <div>
        <label for="assignee">Assignee</label>
        <ui-combobox
          inputId="assignee"
          aria-describedby="assignee-error"
          placeholder="Type a name or a team"
          [formField]="issue.assignee"
          [options]="members"
          [displayWith]="memberName"
          [filterWith]="byNameOrTeam"
          [compareWith]="sameId"
        />
        <div id="assignee-error">
          @if (showError()) {
            <ui-error>Pick someone from the list.</ui-error>
          }
        </div>
      </div>
      <div class="docs-row">
        <button uiButton variant="primary" type="submit">Assign</button>
        <span class="docs-muted" aria-live="polite">{{ saved() }}</span>
      </div>
    </form>
  `,
})
export class ComboboxObjectsExample {
  protected readonly members: Member[] = [
    { id: 1, name: 'Amelia Novak', team: 'Platform' },
    { id: 2, name: 'Bruno Costa', team: 'Design systems' },
    { id: 3, name: 'Chen Wei', team: 'Payments' },
    { id: 4, name: 'Dana Kowalski', team: 'Platform' },
    { id: 5, name: 'Emeka Obi', team: 'Mobile' },
    { id: 6, name: 'Freya Lind', team: 'Design systems' },
  ];
  private readonly model = signal<{ assignee: Member | null }>({ assignee: null });
  protected readonly issue = form(this.model, (path) => required(path.assignee));
  protected readonly showError = computed(() => this.issue.assignee().touched() && this.issue.assignee().invalid());
  protected readonly saved = signal('');

  protected readonly memberName = (member: Member) => member.name;
  protected readonly byNameOrTeam = (member: Member, query: string) =>
    `${member.name} ${member.team}`.toLowerCase().includes(query);
  protected readonly sameId = (a: Member, b: Member) => a.id === b.id;

  protected async assign(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.issue, async () => undefined);
    const assignee = this.model().assignee;
    this.saved.set(ok && assignee ? `Assigned to ${assignee.name} (#${assignee.id})` : '');
  }
}
