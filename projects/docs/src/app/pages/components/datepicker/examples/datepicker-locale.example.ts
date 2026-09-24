import { Dir } from '@angular/cdk/bidi';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { UiDatepicker } from '@usertrv/ui/datepicker';

const LOCALES = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'de-DE', name: 'Deutsch' },
  { id: 'ja-JP', name: '日本語' },
  { id: 'ar-EG', name: 'العربية (مصر)' },
];

@Component({
  selector: 'docs-datepicker-locale-example',
  imports: [UiDatepicker, Dir],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <label for="locale-select">Locale</label>
      <select id="locale-select" (change)="onLocaleChange($event)">
        @for (option of locales; track option.id) {
          <option [value]="option.id" [selected]="option.id === locale()" [attr.lang]="option.id">{{ option.name }}</option>
        }
      </select>

      <div class="docs-stack" [dir]="direction()" [attr.lang]="locale()">
        <label for="locale-date">Travel date</label>
        <ui-datepicker inputId="locale-date" [locale]="locale()" [(value)]="date" />
      </div>
      <span class="docs-muted">
        Month and weekday names, digits, the typed format and the first day of the week all come from
        <code>Intl</code> for the chosen locale.
      </span>
    </div>
  `,
})
export class DatepickerLocaleExample {
  protected readonly locales = LOCALES;
  protected readonly locale = signal('de-DE');
  protected readonly date = signal<Date | null>(new Date(2026, 11, 24));
  protected readonly direction = computed(() => (this.locale().startsWith('ar') ? 'rtl' : 'ltr'));

  protected onLocaleChange(event: Event): void {
    this.locale.set((event.target as HTMLSelectElement).value);
  }
}
