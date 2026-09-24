import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ExampleDef } from '../core/doc-model';
import { CodeBlock } from './code-block';
import { InlineMarkupPipe } from './inline-markup';

@Component({
  selector: 'docs-example-viewer',
  imports: [NgComponentOutlet, CodeBlock, InlineMarkupPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="example" [attr.aria-labelledby]="headingId()">
      <header class="example__header">
        <div>
          <h3 class="example__title" [id]="headingId()">{{ example().title }}</h3>
          @if (example().description) {
            <p class="example__description" [innerHTML]="example().description | inlineMarkup"></p>
          }
        </div>
        <button
          type="button"
          class="example__toggle"
          [attr.aria-expanded]="showCode()"
          [attr.aria-controls]="codeId()"
          (click)="showCode.set(!showCode())"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 6 3 10l4 4M13 6l4 4-4 4" /></svg>
          {{ showCode() ? 'Hide code' : 'Show code' }}
        </button>
      </header>
      <div class="example__preview">
        <ng-container *ngComponentOutlet="example().component" />
      </div>
      <div class="example__code" [id]="codeId()" [hidden]="!showCode()">
        @if (source(); as src) {
          <docs-code-block [code]="src.code" [html]="src.html" [label]="example().title" />
        }
      </div>
    </section>
  `,
  styleUrl: './example-viewer.scss',
})
export class ExampleViewer {
  readonly example = input.required<ExampleDef>();
  readonly sources = input.required<Record<string, { code: string; html: string }>>();
  protected readonly showCode = signal(false);
  protected readonly source = computed(() => this.sources()[this.example().file]);
  protected readonly headingId = computed(() => `ex-${this.example().file.replace(/\W+/g, '-')}`);
  protected readonly codeId = computed(() => `${this.headingId()}-code`);
}
