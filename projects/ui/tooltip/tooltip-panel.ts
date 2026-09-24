import { ChangeDetectionStrategy, Component, ViewEncapsulation, input, output } from '@angular/core';

/**
 * The rendered tooltip bubble. Created by `uiTooltip` inside an overlay; not used directly.
 * @internal
 */
@Component({
  selector: 'ui-tooltip',
  template: `{{ text() }}`,
  styleUrl: './tooltip.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-tooltip',
    role: 'tooltip',
    '[id]': 'tooltipId()',
    '(pointerenter)': 'hoverChange.emit(true)',
    '(pointerleave)': 'hoverChange.emit(false)',
  },
})
export class UiTooltipPanel {
  /** Tooltip text. */
  readonly text = input.required<string>();
  /** DOM id referenced by the trigger's `aria-describedby`. */
  readonly tooltipId = input.required<string>();
  /** Pointer entered or left the bubble (tooltips are hoverable, WCAG 1.4.13). */
  readonly hoverChange = output<boolean>();
}
