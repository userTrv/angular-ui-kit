import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface Part {
  text: string;
  match: boolean;
}

/**
 * Renders `text` with every case-insensitive occurrence of `query` wrapped in `<mark>`.
 * Used by `ui-combobox` for its default option rendering; handy in custom option templates.
 */
@Component({
  selector: 'ui-highlight',
  template: `
    @for (part of parts(); track $index) {
      @if (part.match) {
        <mark>{{ part.text }}</mark>
      } @else {
        <ng-container>{{ part.text }}</ng-container>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiHighlight {
  /** Full text to render. */
  readonly text = input.required<string>();
  /** Substring to highlight; nothing is highlighted when empty. */
  readonly query = input('');

  protected readonly parts = computed<Part[]>(() => {
    const text = this.text();
    const query = this.query().trim().toLocaleLowerCase();
    if (!query) return [{ text, match: false }];
    const lower = text.toLocaleLowerCase();
    const parts: Part[] = [];
    let from = 0;
    for (let at = lower.indexOf(query); at !== -1; at = lower.indexOf(query, from)) {
      if (at > from) parts.push({ text: text.slice(from, at), match: false });
      parts.push({ text: text.slice(at, at + query.length), match: true });
      from = at + query.length;
    }
    if (from < text.length) parts.push({ text: text.slice(from), match: false });
    return parts;
  });
}
