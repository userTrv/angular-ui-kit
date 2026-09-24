import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { LiveAnnouncer } from '@angular/cdk/a11y';

/** Pre-highlighted (build-time Shiki) code with a copy button. */
@Component({
  selector: 'docs-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="code-block">
      <button
        type="button"
        class="code-block__copy"
        [attr.aria-label]="copied() ? 'Copied' : 'Copy code' + (label() ? ': ' + label() : '')"
        (click)="copy()"
      >
        {{ copied() ? 'Copied' : 'Copy' }}
      </button>
      <div class="code-block__scroll" tabindex="0" role="region" [attr.aria-label]="(label() || 'Code') + ' source'" [innerHTML]="trustedHtml()"></div>
    </div>
  `,
  styleUrl: './code-block.scss',
})
export class CodeBlock {
  readonly code = input.required<string>();
  readonly html = input.required<string>();
  readonly label = input('');
  protected readonly copied = signal(false);
  private readonly clipboard = inject(Clipboard);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly sanitizer = inject(DomSanitizer);

  // The HTML is produced at build time by Shiki from files in this repository (never user input).
  // Bypassing is required because Angular's sanitizer strips the inline colour styles Shiki emits.
  protected readonly trustedHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.html()));

  protected copy(): void {
    if (this.clipboard.copy(this.code())) {
      this.copied.set(true);
      void this.announcer.announce('Code copied to clipboard');
      setTimeout(() => this.copied.set(false), 1600);
    }
  }
}
