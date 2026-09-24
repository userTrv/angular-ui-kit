import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KeyboardRow } from '../core/doc-model';
import { InlineMarkupPipe } from './inline-markup';

@Component({
  selector: 'docs-keyboard-table',
  imports: [InlineMarkupPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="kbd-table">
      <table>
        <thead>
          <tr><th scope="col">Key</th><th scope="col">Action</th></tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.keys) {
            <tr>
              <td class="kbd-table__keys">
                @for (alt of split(row.keys, ' / '); track $index; let lastAlt = $last) {
                  @for (key of split(alt, ' + '); track $index; let lastKey = $last) {
                    <kbd>{{ key }}</kbd>
                    @if (!lastKey) {
                      <span aria-hidden="true">+</span>
                    }
                  }
                  @if (!lastAlt) {
                    <span class="kbd-table__or">or</span>
                  }
                }
              </td>
              <td [innerHTML]="row.action | inlineMarkup"></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: `
    .kbd-table {
      overflow-x: auto;
      border: 1px solid var(--ui-color-border);
      border-radius: var(--ui-radius-lg);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--ui-font-size-sm);
    }
    th,
    td {
      padding: 0.625rem 0.875rem;
      text-align: left;
      border-bottom: 1px solid var(--ui-color-border);
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: 0;
    }
    th {
      background: var(--ui-color-surface-sunken);
      color: var(--ui-color-text-muted);
      font-weight: 500;
    }
    .kbd-table__keys {
      white-space: nowrap;
    }
    .kbd-table__or {
      margin: 0 0.375rem;
      color: var(--ui-color-text-muted);
      font-size: var(--ui-font-size-xs);
    }
  `,
})
export class KeyboardTable {
  readonly rows = input.required<KeyboardRow[]>();
  protected split(text: string, separator: string): string[] {
    return text.split(separator);
  }
}
