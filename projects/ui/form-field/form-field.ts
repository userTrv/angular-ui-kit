import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  DOCUMENT,
  ViewEncapsulation,
  computed,
  contentChild,
  contentChildren,
  forwardRef,
  inject,
  input,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UI_FORM_FIELD_CONTEXT, UI_FORM_FIELD_CONTROL, UiFormFieldContext, UiInput } from './input';

export type UiFormFieldSize = 'sm' | 'md' | 'lg';

/** Helper text under the control. Always linked to the control via `aria-describedby`. */
@Component({
  selector: 'ui-hint',
  template: '<ng-content />',
  styleUrl: './messages.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-hint',
    '[class.ui-hint--end]': 'align() === "end"',
    '[id]': 'id()',
  },
})
export class UiHint {
  /** DOM id, referenced from the control's `aria-describedby`. */
  readonly id = input(injectId('ui-hint'));
  /** `end` pushes the hint to the trailing edge (e.g. a character counter). */
  readonly align = input<'start' | 'end'>('start');
}

/**
 * Error message. Inside `ui-form-field` it is rendered only while the control shows errors (invalid
 * and touched, or after the form was submitted) and is then linked via `aria-describedby`.
 * Outside a field (e.g. under a checkbox) render it conditionally and reference its `id` yourself.
 */
@Component({
  selector: 'ui-error',
  template: `
    <svg class="ui-error__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 1a7 7 0 1 1 0 14A7 7 0 0 1 8 1Zm0 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM8 4a1 1 0 0 0-1 1v3.5a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1Z" />
    </svg>
    <span><ng-content /></span>
  `,
  styleUrl: './messages.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-error', '[id]': 'id()' },
})
export class UiError {
  /** DOM id, referenced from the control's `aria-describedby` while the error is shown. */
  readonly id = input(injectId('ui-error'));
}

/** Content before the control inside the field's box: an icon, a currency sign, a unit. */
@Directive({ selector: '[uiPrefix]', host: { class: 'ui-form-field__prefix' } })
export class UiPrefix {}

/** Content after the control inside the field's box: a unit, a clear button, a toggle. */
@Directive({ selector: '[uiSuffix]', host: { class: 'ui-form-field__suffix' } })
export class UiSuffix {}

/**
 * Layout and accessibility wiring around one form control: label, prefix/suffix, hints and errors.
 *
 * ```html
 * <ui-form-field>
 *   <ui-label>Email</ui-label>
 *   <input uiInput type="email" [formField]="form.email" />
 *   <ui-hint>We never share it.</ui-hint>
 *   <ui-error>Enter a valid email address.</ui-error>
 * </ui-form-field>
 * ```
 *
 * Validation state comes from the control (`[formField]`, `formControl`/`formControlName`,
 * `ngModel`); `invalid` overrides it for custom rules.
 */
@Component({
  selector: 'ui-form-field',
  exportAs: 'uiFormField',
  template: `
    <ng-content select="ui-label" />
    <div class="ui-form-field__control">
      <ng-content select="[uiPrefix]" />
      <ng-content />
      <ng-content select="[uiSuffix]" />
    </div>
    <div class="ui-form-field__messages">
      @if (errorVisible()) {
        <div class="ui-form-field__errors"><ng-content select="ui-error" /></div>
      }
      <div class="ui-form-field__hints"><ng-content select="ui-hint" /></div>
    </div>
  `,
  styleUrl: './form-field.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_FORM_FIELD_CONTEXT, useExisting: UiFormField }],
  host: {
    class: 'ui-form-field',
    '[class]': '"ui-form-field--" + size()',
    '[class.ui-form-field--invalid]': 'errorVisible()',
    '[class.ui-form-field--bare]': 'bare()',
    '(click)': 'onClick($event)',
  },
})
export class UiFormField implements UiFormFieldContext {
  /** Control height; follows the density tokens. */
  readonly size = input<UiFormFieldSize>('md');
  /**
   * Forces the error state on (`true`) or off (`false`) regardless of the form state.
   * Leave unset to derive it from the bound control.
   */
  readonly invalid = input<boolean | undefined, unknown>(undefined, {
    transform: (v: unknown) => (v === undefined || v === null ? undefined : booleanish(v)),
  });

  /** The projected control (`input[uiInput]`, or any kit control providing `UI_FORM_FIELD_CONTROL`). */
  readonly control = contentChild(UI_FORM_FIELD_CONTROL);
  private readonly label = contentChild(forwardRef(() => UiLabel));
  /**
   * Kit controls such as `ui-select` draw their own box; the field then only does label, hints,
   * errors and ARIA wiring.
   */
  protected readonly bare = computed(() => {
    const control = this.control();
    return !!control && !(control instanceof UiInput);
  });
  private readonly hints = contentChildren(UiHint);
  private readonly errors = contentChildren(UiError);

  /** Whether errors are currently shown. */
  readonly errorVisible = computed(() => this.control()?.errorVisible() ?? this.invalid() ?? false);
  /** Whether the control is required (the label shows a marker). */
  readonly required = computed(() => this.control()?.required() ?? false);

  /** @internal */
  readonly invalidOverride = this.invalid;
  /** @internal */
  readonly labelId = computed(() => this.label()?.id ?? null);
  /** @internal Ids of the visible errors (first) and of the hints. */
  readonly describedBy = computed(() => {
    const errorIds = this.errorVisible() ? this.errors().map((e) => e.id()) : [];
    const ids = [...errorIds, ...this.hints().map((h) => h.id())];
    return ids.length ? ids.join(' ') : null;
  });

  protected onClick(event: MouseEvent): void {
    const target = event.target as Element;
    // Clicks on the box padding or a decorative prefix focus the control, like a native input.
    if (target.closest('.ui-form-field__control') && !target.closest('input, textarea, select, button, a, [tabindex]')) {
      this.control()?.focus();
    }
  }
}

/**
 * Label of a `ui-form-field`, rendered as a native `<label for>` pointing at the control.
 * Shows a required marker (`*`, hidden from screen readers — the control has `aria-required`).
 */
@Component({
  selector: 'ui-label',
  template: `
    <label class="ui-label__text" [id]="id" [attr.for]="field?.control()?.id()">
      <ng-content />
      @if (field?.required()) {
        <span class="ui-label__required" aria-hidden="true">*</span>
      }
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-label', '(click)': 'onClick()' },
})
export class UiLabel {
  protected readonly field = inject(UiFormField, { optional: true });
  private readonly document = inject(DOCUMENT);
  /** DOM id of the `<label>`; controls that are not labelable elements reference it with `aria-labelledby`. */
  readonly id = injectId('ui-label');

  protected onClick(): void {
    const control = this.field?.control();
    if (!control) return;
    // `<label for>` only focuses labelable elements; a `role="combobox"` trigger needs a hand.
    const target = this.document.getElementById(control.id());
    if (!target?.matches('input, textarea, select, button')) control.focus();
  }
}

function booleanish(value: unknown): boolean {
  return value === '' || (value !== false && value !== 'false');
}
