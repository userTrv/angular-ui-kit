import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiTooltip, UiTooltipPosition } from '@usertrv/ui/tooltip';

@Component({
  selector: 'docs-tooltip-positions-example',
  imports: [UiButton, UiTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      @for (position of positions; track position) {
        <button uiButton [uiTooltip]="'Opens on the ' + position" [uiTooltipPosition]="position">{{ position }}</button>
      }
      <span class="docs-muted" tabindex="0" uiTooltip="Tooltips also work on non-button elements that can take focus.">
        What is this?
      </span>
    </div>
  `,
})
export class TooltipPositionsExample {
  protected readonly positions: UiTooltipPosition[] = ['top', 'bottom', 'start', 'end'];
}
