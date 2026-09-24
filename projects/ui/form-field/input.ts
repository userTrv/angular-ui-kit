import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import {
  Directive,
  ElementRef,
  InjectionToken,
  Provider,
  Type,
  Signal,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { injectUiControlState } from '@usertrv/ui/forms';

/**
 * What `ui-form-field` needs from the control it wraps. `uiInput` implements it; other kit
 * controls (select, combobox, datepicker) can provide the same token to sit inside a form field.
 */
export interface UiFormFieldControl {
  /** DOM id of the focusable element, used for `<label for>`. */
  readonly id: Signal<string>;
  /** Whether the control should show its errors now (invalid and touched/submitted). */
  readonly errorVisible: Signal<boolean>;
  /** Whether a value is required (renders the label's required marker). */
  readonly required: Signal<boolean>;
  /** Moves focus into the control (used when the field's padding/prefix area is clicked). */
  focus(): void;
}

/** DI token for the control projected into a `ui-form-field`. */
export const UI_FORM_FIELD_CONTROL = new InjectionToken<UiFormFieldControl>('UI_FORM_FIELD_CONTROL');

/**
 * What a control needs from its enclosing `ui-form-field` (kept as a token so controls do not
 * import the field component and vice versa). Inject it optionally in a custom control.
 */
export interface UiFormFieldContext {
  /** Ids of the field's visible errors and hints, for the control's `aria-describedby`. */
  readonly describedBy: Signal<string | null>;
  /** The field's `invalid` input: forces the error state on/off, `undefined` when not set. */
  readonly invalidOverride: Signal<boolean | undefined>;
  /** Id of the field's `<label>`, for controls that are not labelable elements (`aria-labelledby`). */
  readonly labelId: Signal<string | null>;
}

/** DI token of the enclosing `ui-form-field`, provided by the field to its content. */
export const UI_FORM_FIELD_CONTEXT = new InjectionToken<UiFormFieldContext>('UI_FORM_FIELD_CONTEXT');

/**
 * Registers a component as the control of an enclosing `ui-form-field`. The component exposes the
 * contract as its `formFieldControl` member (kept separate so the component's own `required` /
 * `id` inputs keep their meaning).
 *
 * ```ts
 * providers: [provideUiFormFieldControl(UiSelect)]
 * ```
 */
export function provideUiFormFieldControl(
  component: Type<{ readonly formFieldControl: UiFormFieldControl }>,
): Provider {
  return { provide: UI_FORM_FIELD_CONTROL, useFactory: () => inject(component, { self: true }).formFieldControl };
}

/**
 * Styles a native `<input>` or `<textarea>` and wires it to its `ui-form-field`: `id` for the label,
 * `aria-describedby` for hints and errors, `aria-invalid` and `aria-required` from the bound form
 * state (Signal Forms `[formField]`, `formControl` / `formControlName` or `ngModel`).
 *
 * The element stays a real native control, so value binding, `type`, autocomplete, IME and
 * browser validation keep working unchanged. Styles ship with `ui-form-field`: always place the
 * input inside one (use a visually hidden label if the design has none).
 */
@Directive({
  selector: 'input[uiInput], textarea[uiInput]',
  exportAs: 'uiInput',
  providers: [{ provide: UI_FORM_FIELD_CONTROL, useExisting: UiInput }],
  host: {
    class: 'ui-input',
    '[class.ui-input--invalid]': 'errorVisible()',
    '[id]': 'id()',
    '[attr.aria-invalid]': 'errorVisible() || null',
    '[attr.aria-required]': 'required() || null',
    '[attr.aria-describedby]': 'describedBy()',
  },
})
export class UiInput implements UiFormFieldControl {
  private readonly element = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef).nativeElement;
  private readonly field = inject(UI_FORM_FIELD_CONTEXT, { optional: true });
  private readonly state = injectUiControlState();

  /** DOM id of the control. Generated when not set, so the label can always point to it. */
  readonly id = input(injectId('ui-input'));
  /** Extra ids for `aria-describedby`; merged with the field's hint and error ids. */
  readonly ariaDescribedBy = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Whether the control should show its errors now. */
  readonly errorVisible = computed(() => this.field?.invalidOverride() ?? this.state.errorVisible());
  /** Whether a value is required (from the form validators or the native `required` attribute). */
  readonly required = computed(() => this.state.required());

  protected readonly describedBy = computed(() => {
    const ids = [this.ariaDescribedBy(), this.field?.describedBy()].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  /** Focuses the native control. */
  focus(): void {
    this.element.focus();
  }
}

/**
 * Grows a `textarea[uiInput]` with its content, between `minRows` and `maxRows`.
 * Wraps CDK `CdkTextareaAutosize` as a host directive (the CDK directive's `cdkTextareaAutosize`
 * input does not coerce a bare `autosize` attribute, so enabling goes through `autosize` here).
 */
@Directive({
  selector: 'textarea[uiInput][autosize]',
  exportAs: 'uiTextareaAutosize',
  hostDirectives: [
    { directive: CdkTextareaAutosize, inputs: ['cdkAutosizeMinRows: minRows', 'cdkAutosizeMaxRows: maxRows'] },
  ],
})
export class UiTextareaAutosize {
  /** Enables auto-sizing. `<textarea uiInput autosize>` turns it on. */
  readonly autosize = input(true, { transform: booleanAttribute });

  private readonly cdk = inject(CdkTextareaAutosize, { self: true });

  constructor() {
    effect(() => (this.cdk.enabled = this.autosize()));
  }

  /** Recomputes the height, e.g. after the value was changed programmatically while hidden. */
  resize(): void {
    this.cdk.resizeToFitContent(true);
  }
}
