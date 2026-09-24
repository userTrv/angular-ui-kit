import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
} from '@angular/core';

/** Semantic colour of a badge or tag. */
export type UiBadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
/** `subtle`: tinted background with coloured text. `solid`: filled with the variant colour. */
export type UiBadgeAppearance = 'subtle' | 'solid';
/** Badge height and text size. */
export type UiBadgeSize = 'sm' | 'md';

/**
 * A short status or count label, e.g. "Paid", "Beta", "12". Colour is never the only signal: the
 * text carries the meaning, and `dot` adds a shape cue for status lists. For a number next to an
 * icon button, include the context in the text or with `ui-sr-only` ("3 unread").
 */
@Component({
  selector: 'ui-badge',
  template: `
    @if (dot()) {
      <span class="ui-badge__dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styleUrl: './badge.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'hostClasses()' },
})
export class UiBadge {
  /** Semantic colour. */
  readonly variant = input<UiBadgeVariant>('neutral');
  /** Tinted (`subtle`) or filled (`solid`). */
  readonly appearance = input<UiBadgeAppearance>('subtle');
  /** Height and text size. */
  readonly size = input<UiBadgeSize>('md');
  /** Shows a leading status dot (decorative; the text still states the status). */
  readonly dot = input(false, { transform: booleanAttribute });

  protected readonly hostClasses = computed(
    () =>
      `ui-badge ui-badge--${this.variant()} ui-badge--${this.appearance()} ui-badge--${this.size()}`,
  );
}
