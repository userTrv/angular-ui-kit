import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAccordion, UiAccordionItem } from '@usertrv/ui/accordion';

@Component({
  selector: 'docs-accordion-faq-example',
  imports: [UiAccordion, UiAccordionItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-accordion>
      @for (item of faq; track item.question; let first = $first) {
        <ui-accordion-item [label]="item.question" [expanded]="first">
          <p>{{ item.answer }}</p>
        </ui-accordion-item>
      }
      <ui-accordion-item label="Can I pay by invoice?" disabled>
        <p>Invoicing is available on the Enterprise plan.</p>
      </ui-accordion-item>
    </ui-accordion>
  `,
})
export class AccordionFaqExample {
  protected readonly faq = [
    {
      question: 'Which Angular versions are supported?',
      answer: 'Angular 22 and newer. The kit is zoneless-ready and uses signal inputs throughout.',
    },
    {
      question: 'Do I need Angular Material?',
      answer: 'No. Behaviour comes from the Angular CDK; styles come from the kit’s design tokens.',
    },
    {
      question: 'How do I change the brand colour?',
      answer: 'Override the semantic tokens, e.g. --ui-color-primary, on :root or on any themed container.',
    },
  ];
}
