import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SNIPPETS } from '../../generated/snippets';
import { CodeBlock } from '../../shared/code-block';
import { BrandGenerator } from './brand-generator';
import { DENSITIES, THEMES, TOKEN_ROWS, TokenTier, displayValue } from './tokens';

@Component({
  selector: 'docs-theming-page',
  imports: [CodeBlock, BrandGenerator],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './theming-page.html',
  styleUrl: './theming-page.scss',
})
export class ThemingPage {
  protected readonly snippets = SNIPPETS;
  protected readonly tiers: { id: TokenTier; label: string; hint: string }[] = [
    { id: 'semantic', label: 'Semantic', hint: 'Intent-based tokens, one value per theme. Components read these.' },
    { id: 'component', label: 'Component', hint: 'Per-component knobs that reference semantic or primitive tokens.' },
    { id: 'density', label: 'Density', hint: 'Control heights, paddings and row heights per density.' },
    { id: 'primitive', label: 'Primitive', hint: 'Raw palette and scales. Never themed, never used directly by components.' },
  ];
  protected readonly tier = signal<TokenTier>('semantic');
  protected readonly query = signal('');
  protected readonly themes = THEMES;
  protected readonly densities = DENSITIES;
  protected readonly display = displayValue;
  protected readonly counts = computed(() => {
    const counts: Record<string, number> = {};
    for (const row of TOKEN_ROWS) counts[row.tier] = (counts[row.tier] ?? 0) + 1;
    return counts;
  });
  protected readonly columns = computed(() => {
    const tier = this.tier();
    if (tier === 'semantic') return this.themes;
    if (tier === 'density') return this.densities;
    return ['value'];
  });
  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    return TOKEN_ROWS.filter((r) => r.tier === this.tier() && (!q || r.cssVar.includes(q)));
  });
  protected readonly activeHint = computed(() => this.tiers.find((t) => t.id === this.tier())?.hint ?? '');
}
