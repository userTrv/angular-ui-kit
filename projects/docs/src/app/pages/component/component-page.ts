import { ChangeDetectionStrategy, Component, computed, effect, inject, input, resource } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { findApi } from '../../core/api';
import { COMPONENT_DOCS } from '../../generated/registry';
import { SNIPPETS } from '../../generated/snippets';
import { ApiTable } from '../../shared/api-table';
import { CodeBlock } from '../../shared/code-block';
import { ExampleViewer } from '../../shared/example-viewer';
import { InlineMarkupPipe } from '../../shared/inline-markup';
import { KeyboardTable } from '../../shared/keyboard-table';

@Component({
  selector: 'docs-component-page',
  imports: [ExampleViewer, ApiTable, KeyboardTable, CodeBlock, InlineMarkupPipe, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './component-page.html',
  styleUrl: './component-page.scss',
})
export class ComponentPage {
  /** Bound from the `:slug` route parameter. */
  readonly slug = input.required<string>();

  protected readonly entry = computed(() => COMPONENT_DOCS.find((d) => d.slug === this.slug()));
  protected readonly page = resource({
    params: () => this.entry(),
    loader: async ({ params }) => {
      const [doc, sources] = await Promise.all([params.loadDoc(), params.loadSources()]);
      return { doc, sources };
    },
  });
  protected readonly importSnippet = computed(() => {
    const doc = this.page.value()?.doc;
    return doc ? SNIPPETS[`import:${doc.entryPoint}`] : undefined;
  });
  protected readonly apiItems = computed(() => {
    const doc = this.page.value()?.doc;
    if (!doc) return [];
    return doc.api.map((name) => findApi(doc.entryPoint, name)).filter((item) => !!item);
  });
  protected readonly neighbours = computed(() => {
    const index = COMPONENT_DOCS.findIndex((d) => d.slug === this.slug());
    return { prev: COMPONENT_DOCS[index - 1], next: COMPONENT_DOCS[index + 1] };
  });

  protected scrollTo(id: string): void {
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  }

  constructor() {
    const title = inject(Title);
    effect(() => {
      const name = this.entry()?.name ?? 'Not found';
      title.setTitle(`${name} · @usertrv/ui`);
    });
  }
}
