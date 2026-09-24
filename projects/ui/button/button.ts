import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';

export type UiButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type UiButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button styles and states on top of a native `<button>` or `<a>`.
 *
 * Applied as an attribute so the element keeps every native behaviour (form submit, focus,
 * `type`, links). `uiIconButton` renders a square icon-only button and requires an accessible
 * name (`aria-label` or `aria-labelledby`) — a dev-mode warning points out when it is missing.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute component keeps native <button>/<a> semantics
  selector: 'button[uiButton], a[uiButton], button[uiIconButton], a[uiIconButton]',
  exportAs: 'uiButton',
  template: `
    @if (loading()) {
      <span class="ui-button__spinner" aria-hidden="true"></span>
    }
    <span class="ui-button__content"><ng-content /></span>
  `,
  styleUrl: './button.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-button',
    '[class]': 'hostClasses()',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'ariaDisabled()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.tabindex]': '!isNativeButton && disabled() ? -1 : null',
  },
})
export class UiButton {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  protected readonly isNativeButton = this.element.tagName === 'BUTTON';
  private readonly isIconButton = this.element.hasAttribute('uiIconButton');

  /** Visual emphasis. */
  readonly variant = input<UiButtonVariant>('secondary');
  /** Control height and padding; follows the density tokens. */
  readonly size = input<UiButtonSize>('md');
  /**
   * Shows a spinner and blocks activation while keeping the button focusable
   * (uses `aria-disabled` instead of `disabled`, so focus is not lost mid-request).
   */
  readonly loading = input(false, { transform: booleanAttribute });
  /** Disables the button. On links this sets `aria-disabled` and removes it from the tab order. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Stretches the button to the width of its container. */
  readonly block = input(false, { transform: booleanAttribute });

  protected readonly ariaDisabled = computed(() => {
    if (this.loading()) return 'true';
    return !this.isNativeButton && this.disabled() ? 'true' : null;
  });

  protected readonly hostClasses = computed(() => {
    const classes = [`ui-button--${this.variant()}`, `ui-button--${this.size()}`];
    if (this.isIconButton) classes.push('ui-button--icon');
    if (this.loading()) classes.push('ui-button--loading');
    if (this.block()) classes.push('ui-button--block');
    return classes.join(' ');
  });

  constructor() {
    // Capture phase: runs before any (click) handler bound by the consumer on the same element,
    // so a loading or disabled link never triggers them.
    const unlisten = inject(Renderer2).listen(this.element, 'click', (e: Event) => this.onClick(e), {
      capture: true,
    });
    inject(DestroyRef).onDestroy(unlisten);

    if (isDevMode() && this.isIconButton) {
      afterNextRender(() => {
        const el = this.element;
        if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.title) {
          console.warn('[uiIconButton] Icon-only buttons need an accessible name (aria-label).', el);
        }
      });
    }
  }

  private onClick(event: Event): void {
    if (this.loading() || (this.disabled() && !this.isNativeButton)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
