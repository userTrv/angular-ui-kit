import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { UiButton } from '@usertrv/ui/button';
import { UiError } from '@usertrv/ui/form-field';
import { UiRadioButton, UiRadioGroup } from '@usertrv/ui/radio';

type Frequency = 'daily' | 'weekly' | 'never';

@Component({
  selector: 'docs-radio-signal-forms-example',
  imports: [FormField, UiRadioGroup, UiRadioButton, UiError, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="docs-stack" novalidate (submit)="save($event)">
      <ui-radio-group label="Email summary" aria-describedby="frequency-error" [formField]="settings.frequency">
        <ui-radio-button value="daily">Every morning</ui-radio-button>
        <ui-radio-button value="weekly">Monday mornings</ui-radio-button>
        <ui-radio-button value="never">Never</ui-radio-button>
      </ui-radio-group>
      <div id="frequency-error">
        @if (showError()) {
          <ui-error>Choose how often you want the summary.</ui-error>
        }
      </div>
      <div class="docs-row">
        <button uiButton variant="primary" type="submit">Save</button>
        <span class="docs-muted" aria-live="polite">{{ saved() }}</span>
      </div>
    </form>
  `,
})
export class RadioSignalFormsExample {
  private readonly model = signal<{ frequency: Frequency | null }>({ frequency: null });
  protected readonly settings = form(this.model, (s) => required(s.frequency));
  protected readonly showError = computed(() => this.settings.frequency().touched() && this.settings.frequency().invalid());
  protected readonly saved = signal('');

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    const ok = await submit(this.settings, async () => undefined);
    this.saved.set(ok ? `Saved: ${this.model().frequency}` : '');
  }
}
