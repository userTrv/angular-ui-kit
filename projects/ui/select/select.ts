import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { injectId } from '@usertrv/ui/a11y';
import { injectUiControlState } from '@usertrv/ui/form-field';
import { UiFormValueControl, provideUiFormValueControl } from '@usertrv/ui/forms';
import { UiCompareWith, UiListbox, UiOption, createListboxPopup } from '@usertrv/ui/listbox';

/**
 * Select-only combobox (WAI-ARIA APG): a focusable trigger with `role="combobox"` that opens a
 * listbox of projected `ui-option`s in a CDK overlay. Focus never leaves the trigger; the active
 * option is exposed through `aria-activedescendant`.
 *
 * `value` holds one option value, or an array of them with `multiple`. Works with Signal Forms
 * (`[formField]`) natively and with Reactive Forms / `ngModel` through `UiControlValueAccessor`.
 */
@Component({
  selector: 'ui-select',
  exportAs: 'uiSelect',
  imports: [UiListbox],
  providers: [provideUiFormValueControl(UiSelect)],
  templateUrl: './select.html',
  styleUrl: './select.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-select',
    '[class.ui-select--open]': 'isOpen()',
    '[class.ui-select--disabled]': 'isDisabled()',
    '[class.ui-select--invalid]': 'showInvalid()',
    // The ARIA attributes belong on the trigger, not on the host element.
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiSelect<T = unknown> implements FormValueControl<T | readonly T[] | null>, UiFormValueControl<T | readonly T[] | null> {
  private readonly injector = inject(Injector);
  private readonly trigger = viewChild.required<ElementRef<HTMLElement>>('trigger');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  protected readonly listboxRef = viewChild.required<UiListbox<T>>(UiListbox);
  protected readonly options = contentChildren<UiOption<T>>(UiOption, { descendants: true });
  protected readonly listboxId = injectId('ui-select-listbox');
  private readonly formDisabled = signal(false);
  private readonly state = injectUiControlState();
  private popup?: ReturnType<typeof createListboxPopup>;

  /** Selected option value; an array of values when `multiple`. `null` when nothing is selected. */
  readonly value = model<T | readonly T[] | null>(null);
  /** @internal Model used by `UiControlValueAccessor`. */
  readonly formModel = this.value;
  /** Allows selecting several options; the panel stays open while picking. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Text shown while nothing is selected. */
  readonly placeholder = input('');
  /** Equality used to match `value` against option values (e.g. compare objects by id). */
  readonly compareWith = input<UiCompareWith<T>>(Object.is);
  /** Disables the select. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Keeps the value visible but prevents changing it. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Shows the error state (`aria-invalid` on the trigger). Bound automatically by Signal Forms and
   * then displayed only after the field is touched; with Reactive Forms / `ngModel` the state is
   * read from the bound control.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Sets `aria-required` on the trigger. Bound automatically by Signal Forms; read from `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Accessible name when there is no visible label. Applied to the trigger and the listbox. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Id(s) of the visible label. Applied to the trigger and the listbox. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** Id(s) of hint or error text, applied to the trigger. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Emitted when the user leaves the select or closes its panel (marks the control touched). */
  readonly touch = output<void>();
  /** Emitted when the panel opens or closes. */
  readonly openedChange = output<boolean>();

  private readonly opened = signal(false);
  /** Whether the panel is open. */
  readonly isOpen = this.opened.asReadonly();

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  // Signal Forms binds the raw `invalid`: like the other kit fields, show it after interaction.
  protected readonly showInvalid = computed(() =>
    this.state.source() === 'signal-forms' ? this.state.errorVisible() : this.invalid() || this.state.errorVisible(),
  );
  protected readonly selection = computed<readonly T[]>(() => {
    const value = this.value();
    if (this.multiple()) return Array.isArray(value) ? (value as readonly T[]) : [];
    return value === null || value === undefined ? [] : [value as T];
  });
  protected readonly displayText = computed(() =>
    this.options()
      .filter((option) => option.selected())
      .map((option) => option.getLabel())
      .join(', '),
  );

  /** Opens the panel and highlights the selected option (or the first one). */
  open(highlight: 'selected' | 'first' | 'last' = 'selected'): void {
    if (this.isOpen() || this.isDisabled() || this.readonly()) return;
    this.popup ??= createListboxPopup(this.injector, {
      origin: this.trigger().nativeElement,
      panel: this.panel().nativeElement,
      outsideClick: () => this.close(),
    });
    this.popup.open();
    this.opened.set(true);
    const listbox = this.listboxRef();
    if (highlight === 'first') listbox.setFirstActive();
    else if (highlight === 'last') listbox.setLastActive();
    else listbox.setActiveToSelected('first');
    this.openedChange.emit(true);
  }

  /** Closes the panel without changing the value. */
  close(): void {
    if (!this.isOpen()) return;
    this.popup?.close();
    this.opened.set(false);
    this.openedChange.emit(false);
    this.touch.emit();
  }

  /** Moves focus to the trigger. */
  focus(options?: FocusOptions): void {
    this.trigger().nativeElement.focus(options);
  }

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.close();
  }

  protected toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  protected onSelectionChange(selection: readonly T[]): void {
    this.value.set(this.multiple() ? selection : (selection[0] ?? null));
  }

  protected onPicked(): void {
    if (!this.multiple()) this.close();
  }

  protected onBlur(): void {
    if (this.isOpen()) this.close();
    else this.touch.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) this.handleOpenKey(event);
    else this.handleClosedKey(event);
  }

  private handleClosedKey(event: KeyboardEvent): void {
    const listbox = this.listboxRef();
    const isSpace = event.key === ' ' && !listbox.isTyping();
    const opens: Record<string, 'selected' | 'first' | 'last'> = {
      ArrowDown: 'selected',
      ArrowUp: 'selected',
      Enter: 'selected',
      Home: 'first',
      End: 'last',
    };
    const highlight = isSpace ? 'selected' : opens[event.key];
    if (highlight) {
      event.preventDefault();
      this.open(highlight);
    } else if (this.isPrintable(event) && !this.readonly()) {
      // Native <select> behaviour: typing on a closed single select changes the value.
      if (!listbox.isTyping()) listbox.setActiveToSelected('none');
      listbox.handleKeydown(event);
      if (this.multiple()) this.open('selected');
    }
  }

  private handleOpenKey(event: KeyboardEvent): void {
    const listbox = this.listboxRef();
    const isSpace = event.key === ' ' && !listbox.isTyping();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    } else if (event.key === 'Tab') {
      this.close();
    } else if (event.key === 'Enter' || isSpace) {
      event.preventDefault();
      listbox.pickActive();
    } else if (event.key === 'ArrowUp' && event.altKey) {
      event.preventDefault();
      if (!this.multiple()) listbox.pickActive();
      this.close();
    } else {
      listbox.handleKeydown(event);
    }
  }

  private isPrintable(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
  }
}
