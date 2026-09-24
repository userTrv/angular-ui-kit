import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiToastVariant } from './toast-config';

/** @internal Decorative variant icon; the variant is also conveyed in the text and announcement. */
@Component({
  selector: 'ui-toast-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 20 20" fill="currentColor">
      @switch (variant()) {
        @case ('success') {
          <path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm3.7 5.3a1 1 0 0 0-1.4 0L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4a1 1 0 0 0 0-1.4Z" />
        }
        @case ('warning') {
          <path d="M8.3 3a2 2 0 0 1 3.4 0l6 10.5A2 2 0 0 1 16 16.5H4a2 2 0 0 1-1.7-3L8.3 3ZM10 7a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0V8a1 1 0 0 0-1-1Zm0 6.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
        }
        @case ('danger') {
          <path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 4a1 1 0 0 0-1 1v3.5a1 1 0 1 0 2 0V7a1 1 0 0 0-1-1Zm0 6.8a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
        }
        @default {
          <path d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm0 7a1 1 0 0 0-1 1v3.5a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1Zm0-3.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
        }
      }
    </svg>
  `,
})
export class UiToastIcon {
  /** Which icon to draw. */
  readonly variant = input.required<UiToastVariant>();
}
