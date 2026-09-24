import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  output,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiBadgeVariant } from './badge';

/**
 * A chip for a selected value, filter or keyword. With `removable`, it gets a remove button whose
 * accessible name is "Remove <tag text>" (composed with `aria-labelledby`, so it follows the text).
 * Backspace or Delete on the focused remove button also removes the tag.
 *
 * The tag does not remove itself: handle `removed` by deleting the item from your state, then move
 * focus to a sensible place (the next tag, or the input that adds tags), otherwise focus falls back
 * to `<body>`.
 */
@Component({
  selector: 'ui-tag',
  template: `
    <span class="ui-tag__label" [id]="labelId"><ng-content /></span>
    @if (removable()) {
      <span [id]="removeTextId" hidden>Remove</span>
      <button
        type="button"
        class="ui-tag__remove"
        [attr.aria-labelledby]="removeTextId + ' ' + labelId"
        [disabled]="disabled()"
        (click)="remove()"
        (keydown.backspace)="onDeleteKey($event)"
        (keydown.delete)="onDeleteKey($event)"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M4.3 4.3a.75.75 0 0 1 1.06 0L8 6.94l2.64-2.64a.75.75 0 1 1 1.06 1.06L9.06 8l2.64 2.64a.75.75 0 1 1-1.06 1.06L8 9.06l-2.64 2.64a.75.75 0 0 1-1.06-1.06L6.94 8 4.3 5.36a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    }
  `,
  // Styles live in badge.css, loaded here too so a page with only tags is styled.
  styleUrl: './badge.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
})
export class UiTag {
  /** Semantic colour. */
  readonly variant = input<UiBadgeVariant>('neutral');
  /** Renders a remove button and enables Backspace/Delete removal. */
  readonly removable = input(false, { transform: booleanAttribute });
  /** Disables the remove button. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits when the user asks to remove the tag (button click, Backspace or Delete). */
  readonly removed = output<void>();

  protected readonly labelId = injectId('ui-tag-label');
  protected readonly removeTextId = injectId('ui-tag-remove');

  protected readonly hostClasses = computed(() => {
    const classes = ['ui-tag', `ui-tag--${this.variant()}`];
    if (this.removable()) classes.push('ui-tag--removable');
    if (this.disabled()) classes.push('ui-tag--disabled');
    return classes.join(' ');
  });

  /** Emits `removed` unless the tag is disabled. */
  remove(): void {
    if (!this.disabled()) this.removed.emit();
  }

  protected onDeleteKey(event: Event): void {
    event.preventDefault();
    this.remove();
  }
}
