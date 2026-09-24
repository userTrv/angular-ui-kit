import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';

@Component({
  selector: 'docs-button-sizes-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="primary" size="sm">Small</button>
      <button uiButton variant="primary">Medium</button>
      <button uiButton variant="primary" size="lg">Large</button>
      <button uiButton disabled>Disabled</button>
    </div>
  `,
})
export class ButtonSizesExample {}
