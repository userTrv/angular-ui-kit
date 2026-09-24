import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';

@Component({
  selector: 'docs-button-variants-example',
  imports: [UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row">
      <button uiButton variant="primary">Primary</button>
      <button uiButton>Secondary</button>
      <button uiButton variant="outline">Outline</button>
      <button uiButton variant="ghost">Ghost</button>
      <button uiButton variant="danger">Delete</button>
      <a uiButton variant="ghost" href="#/theming">Link as button</a>
    </div>
  `,
})
export class ButtonVariantsExample {}
