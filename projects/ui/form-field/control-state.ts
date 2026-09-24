import {
  DestroyRef,
  ElementRef,
  Injector,
  Signal,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormResetEvent,
  FormSubmittedEvent,
  NgControl,
  Validators,
} from '@angular/forms';
import { FormField } from '@angular/forms/signals';

/** Which forms API drives the control, if any. */
export type UiControlSource = 'signal-forms' | 'forms' | null;

/**
 * Validation state of the form control on the current element, read from whichever forms API
 * is bound to it. Every signal is `false` when the element is not bound to a form.
 */
export interface UiControlState {
  /** `'signal-forms'` for `[formField]`, `'forms'` for `formControl` / `formControlName` / `ngModel`. */
  readonly source: Signal<UiControlSource>;
  /** The control fails validation. */
  readonly invalid: Signal<boolean>;
  /** The user has left the control at least once (or the form was submitted, in Signal Forms). */
  readonly touched: Signal<boolean>;
  /** The enclosing `<form>` was submitted (Reactive / template-driven forms only). */
  readonly submitted: Signal<boolean>;
  /** A `required` validator is active (Signal Forms `required()`, `Validators.required(True)`). */
  readonly required: Signal<boolean>;
  /** The control is disabled by the form. */
  readonly disabled: Signal<boolean>;
  /**
   * The error should be shown to the user: `invalid && (touched || submitted)`.
   * Showing errors only after interaction avoids shouting at people before they typed anything.
   */
  readonly errorVisible: Signal<boolean>;
}

interface Snapshot {
  invalid: boolean;
  touched: boolean;
  submitted: boolean;
  required: boolean;
  disabled: boolean;
}

const EMPTY: Snapshot = { invalid: false, touched: false, submitted: false, required: false, disabled: false };

/**
 * Reads the form state of the control on the host element as signals, for both form APIs:
 *
 * - **Signal Forms** — the `FormField` directive (`[formField]`) on the same element; its
 *   `FieldState` is already signal-based.
 * - **Reactive / template-driven forms** — the `NgControl` on the same element. `AbstractControl`
 *   is not signal-based, so `control.events` (plus the root form's events, for submit/reset) is
 *   turned into a signal snapshot.
 *
 * `NgControl` is resolved lazily after the first render: resolving it in a constructor would
 * create a DI cycle for components that are also the value accessor's target, and
 * `formControlName` only has its control after its own `ngOnChanges`.
 *
 * Must be called in an injection context (field initializer or constructor).
 */
export function injectUiControlState(): UiControlState {
  const field = inject(FormField, { self: true, optional: true });
  if (field) return fromSignalForms(field);

  const injector = inject(Injector);
  const destroyRef = inject(DestroyRef);
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const snapshot = signal<Snapshot>(EMPTY);
  const source = signal<UiControlSource>(null);

  afterNextRender(() => {
    const control = injector.get(NgControl, null, { self: true })?.control;
    if (!control) return;
    let submitted = false;
    const read = () => snapshot.set(readControl(control, element, submitted));
    // Status/touched events come from the control itself; submit/reset only reach the root form.
    const own = control.events.subscribe(read);
    const root = control.root.events.subscribe((event) => {
      if (event instanceof FormSubmittedEvent) submitted = true;
      else if (event instanceof FormResetEvent) submitted = false;
      else return;
      read();
    });
    destroyRef.onDestroy(() => {
      own.unsubscribe();
      root.unsubscribe();
    });
    source.set('forms');
    read();
  });

  const pick = <K extends keyof Snapshot>(key: K) => computed(() => snapshot()[key]);
  return {
    source,
    invalid: pick('invalid'),
    touched: pick('touched'),
    submitted: pick('submitted'),
    required: pick('required'),
    disabled: pick('disabled'),
    errorVisible: computed(() => {
      const s = snapshot();
      return s.invalid && (s.touched || s.submitted);
    }),
  };
}

function fromSignalForms(field: FormField<unknown>): UiControlState {
  const invalid = computed(() => field.state().invalid());
  const touched = computed(() => field.state().touched());
  return {
    source: signal<UiControlSource>('signal-forms').asReadonly(),
    invalid,
    touched,
    // Signal Forms' submit() marks every field as touched, so `touched` already covers it.
    submitted: signal(false).asReadonly(),
    required: computed(() => field.state().required()),
    disabled: computed(() => field.state().disabled()),
    errorVisible: computed(() => invalid() && touched()),
  };
}

function readControl(control: AbstractControl, element: HTMLElement, submitted: boolean): Snapshot {
  return {
    invalid: control.invalid,
    touched: control.touched,
    submitted,
    required:
      control.hasValidator(Validators.required) ||
      control.hasValidator(Validators.requiredTrue) ||
      // Template-driven `required` attribute adds its validator as a directive, not a function.
      element.hasAttribute('required'),
    disabled: control.disabled,
  };
}
