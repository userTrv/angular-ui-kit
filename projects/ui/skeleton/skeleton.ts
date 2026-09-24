import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
} from '@angular/core';

/** Placeholder shape: lines of text, a circle (avatar) or a rectangle (image, card, chart). */
export type UiSkeletonShape = 'text' | 'circle' | 'rect';

/**
 * A loading placeholder in the shape of the content that is coming. Purely visual: it is
 * `aria-hidden="true"`, so mark the loading region with `[uiBusy]` (or `aria-busy`) and keep a
 * text alternative such as a visually hidden "Loading orders…" for screen readers.
 *
 * The shimmer uses the duration tokens and is switched off entirely under
 * `prefers-reduced-motion: reduce`.
 */
@Component({
  selector: 'ui-skeleton',
  template: `
    @if (shape() === 'text') {
      @for (line of lineList(); track line) {
        <span class="ui-skeleton__line ui-skeleton__piece"></span>
      }
    } @else {
      <span class="ui-skeleton__piece"></span>
    }
  `,
  styleUrl: './skeleton.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[class]': '"ui-skeleton ui-skeleton--" + shape()',
    '[class.ui-skeleton--static]': '!animated()',
    '[style.width]': 'width()',
    '[style.height]': 'shape() === "text" ? null : height()',
  },
})
export class UiSkeleton {
  /** Shape of the placeholder. */
  readonly shape = input<UiSkeletonShape>('text');
  /** Number of text lines (for `shape="text"`); the last of several lines is shorter. */
  readonly lines = input(1, { transform: numberAttribute });
  /** CSS width, e.g. `12rem` or `100%`. Circles default to 2.5rem, other shapes to 100%. */
  readonly width = input<string | undefined>(undefined);
  /** CSS height for `circle` and `rect`, e.g. `8rem`. Circles default to their width. */
  readonly height = input<string | undefined>(undefined);
  /** Set to false to render a static placeholder without the shimmer. */
  readonly animated = input(true, { transform: booleanAttribute });

  protected readonly lineList = computed(() =>
    Array.from({ length: Math.max(1, Math.floor(this.lines())) }, (_, i) => i),
  );
}

/**
 * Marks a region as loading: sets `aria-busy="true"` while the bound value is true, so screen
 * readers wait for the final content instead of reading placeholders. Pair it with a polite status
 * message if the wait is long.
 */
@Directive({
  selector: '[uiBusy]',
  host: { '[attr.aria-busy]': 'busy() || null' },
})
export class UiBusy {
  /** Whether the region is loading. */
  readonly busy = input(false, { alias: 'uiBusy', transform: booleanAttribute });
}
