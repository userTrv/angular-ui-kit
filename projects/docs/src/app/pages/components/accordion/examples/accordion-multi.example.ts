import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiAccordion, UiAccordionItem } from '@usertrv/ui/accordion';
import { UiButton } from '@usertrv/ui/button';

@Component({
  selector: 'docs-accordion-multi-example',
  imports: [UiAccordion, UiAccordionItem, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <div class="docs-row">
        <button uiButton size="sm" (click)="filters.openAll()">Expand all</button>
        <button uiButton size="sm" variant="ghost" (click)="filters.closeAll()">Collapse all</button>
      </div>
      <ui-accordion #filters="uiAccordion" multi>
        <ui-accordion-item [headingLevel]="4" [(expanded)]="statusOpen">
          <span uiAccordionTitle>Status <span class="docs-muted">(2 selected)</span></span>
          <p>Open, In review</p>
        </ui-accordion-item>
        <ui-accordion-item label="Assignee" [headingLevel]="4">
          <p>Anyone</p>
        </ui-accordion-item>
        <ui-accordion-item label="Due date" [headingLevel]="4">
          <p>Next 7 days</p>
        </ui-accordion-item>
      </ui-accordion>
      <p class="docs-muted">Status section is {{ statusOpen() ? 'expanded' : 'collapsed' }}.</p>
    </div>
  `,
})
export class AccordionMultiExample {
  protected readonly statusOpen = signal(true);
}
