import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { CodeBlock } from '../../shared/code-block';
import { brandTheme, generatePalette, themeCss } from './palette';

const PRESETS = [
  { name: 'Iris (default)', hex: '#5745e3' },
  { name: 'Teal', hex: '#0f766e' },
  { name: 'Crimson', hex: '#e11d48' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Forest', hex: '#15803d' },
  { name: 'Ocean', hex: '#0369a1' },
];

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

@Component({
  selector: 'docs-brand-generator',
  imports: [UiButton, CodeBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-generator.html',
  styleUrl: './brand-generator.scss',
})
export class BrandGenerator {
  private readonly document = inject(DOCUMENT);
  protected readonly presets = PRESETS;
  protected readonly brand = signal('#0f766e');
  protected readonly applied = signal(false);
  protected readonly hexError = signal(false);

  protected readonly palette = computed(() => generatePalette(this.brand()));
  protected readonly theme = computed(() => brandTheme(this.palette()));
  protected readonly css = computed(() => themeCss(this.theme()));
  protected readonly cssHtml = computed(() => `<pre class="shiki"><code>${escape(this.css())}</code></pre>`);
  protected readonly previewStyle = computed(() =>
    Object.entries(this.theme().light)
      .map(([k, v]) => `--ui-${k}: ${v}`)
      .join('; '),
  );
  protected readonly previewStyleDark = computed(() =>
    Object.entries(this.theme().dark)
      .map(([k, v]) => `--ui-${k}: ${v}`)
      .join('; '),
  );

  private styleEl?: HTMLStyleElement;

  constructor() {
    effect(() => {
      const css = this.applied() ? this.css() : '';
      if (!css) {
        this.styleEl?.remove();
        this.styleEl = undefined;
        return;
      }
      this.styleEl ??= this.document.head.appendChild(this.document.createElement('style'));
      this.styleEl.textContent = css;
    });
    inject(DestroyRef).onDestroy(() => this.styleEl?.remove());
  }

  protected setHex(value: string): void {
    const normalized = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`;
    const valid = /^#[0-9a-f]{6}$/i.test(normalized);
    this.hexError.set(!valid);
    if (valid) this.brand.set(normalized.toLowerCase());
  }

  protected rating(ratio: number): string {
    return ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large' : 'Fail';
  }
}
