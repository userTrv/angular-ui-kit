import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiSkeleton } from '@usertrv/ui/skeleton';

@Component({
  selector: 'docs-skeleton-shapes-example',
  imports: [UiSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <ui-skeleton shape="rect" height="8rem" />
      <div class="docs-row">
        <ui-skeleton shape="circle" width="3rem" />
        <ui-skeleton shape="circle" width="2rem" />
        <ui-skeleton shape="rect" width="6rem" height="2rem" [animated]="false" />
      </div>
      <ui-skeleton [lines]="4" />
    </div>
  `,
})
export class SkeletonShapesExample {}
