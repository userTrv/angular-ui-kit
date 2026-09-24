import { Directive, TemplateRef, inject } from '@angular/core';

/** Template context of `ng-template[uiComboboxOption]`. */
export interface UiComboboxOptionContext<T> {
  /** The option item. */
  $implicit: T;
  /** The text the user typed, for highlighting. */
  query: string;
}

/**
 * Custom content for each suggestion, rendered inside a `ui-option` (keep it non-interactive):
 *
 * ```html
 * <ng-template uiComboboxOption let-repo let-query="query">
 *   <ui-highlight [text]="repo.fullName" [query]="query" /> <span>★ {{ repo.stars }}</span>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[uiComboboxOption]' })
export class UiComboboxOptionTemplate<T> {
  /** @internal */
  readonly template = inject<TemplateRef<UiComboboxOptionContext<T>>>(TemplateRef);

  /** @internal Types `let-` variables in the template. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by the Angular compiler
  static ngTemplateContextGuard<T>(_dir: UiComboboxOptionTemplate<T>, ctx: unknown): ctx is UiComboboxOptionContext<T> {
    return true;
  }
}
