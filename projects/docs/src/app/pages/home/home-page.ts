import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton } from '@usertrv/ui/button';
import { COMPONENT_DOCS } from '../../generated/registry';
import { SNIPPETS } from '../../generated/snippets';
import { CodeBlock } from '../../shared/code-block';

@Component({
  selector: 'docs-home-page',
  imports: [CodeBlock, RouterLink, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly snippets = SNIPPETS;
  protected readonly components = COMPONENT_DOCS;
  protected readonly firstSlug = COMPONENT_DOCS[0]?.slug ?? '';
}
