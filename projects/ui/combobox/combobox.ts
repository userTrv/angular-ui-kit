import { LiveAnnouncer } from '@angular/cdk/a11y';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewEncapsulation,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { injectId } from '@usertrv/ui/a11y';
import { injectUiControlState } from '@usertrv/ui/form-field';
import { UiFormValueControl, provideUiFormValueControl } from '@usertrv/ui/forms';
import { UiCompareWith, UiListbox, UiOption, createListboxPopup } from '@usertrv/ui/listbox';
import { UiSelectOption } from '@usertrv/ui/select';
import { UI_COMBOBOX_INTL } from './combobox-intl';
import { comboboxKeyAction } from './combobox-keys';
import { UiHighlight } from './highlight';
import { UiComboboxOptionTemplate } from './option-template';
import { UiComboboxDisplayWith, UiComboboxFilter, UiComboboxSearch, createComboboxSuggestions } from './search';

const defaultDisplay = (item: unknown): string => (item === null || item === undefined ? '' : String(item));

/**
 * Editable combobox with list autocomplete (WAI-ARIA 1.2 combobox, `aria-autocomplete="list"`).
 * DOM focus stays in the text input; the suggestions listbox opens in a CDK overlay and the active
 * option is exposed with `aria-activedescendant`.
 *
 * Suggestions come either from a static `options` array filtered as you type, or from an async
 * `search` function (debounced, stale requests cancelled, loading / empty / error states).
 */
@Component({
  selector: 'ui-combobox',
  exportAs: 'uiCombobox',
  imports: [UiListbox, UiSelectOption, UiHighlight, NgTemplateOutlet],
  providers: [provideUiFormValueControl(UiCombobox)],
  templateUrl: './combobox.html',
  styleUrl: './combobox.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ui-combobox',
    '[class.ui-combobox--open]': 'expanded()',
    '[class.ui-combobox--disabled]': 'isDisabled()',
    '[class.ui-combobox--invalid]': 'showInvalid()',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
  },
})
export class UiCombobox<T = unknown> implements FormValueControl<T | null>, UiFormValueControl<T | null> {
  private readonly injector = inject(Injector);
  private readonly announcer = inject(LiveAnnouncer);
  protected readonly intl = inject(UI_COMBOBOX_INTL);
  private readonly field = viewChild.required<ElementRef<HTMLElement>>('field');
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
  protected readonly listbox = viewChild.required<UiListbox<T>>(UiListbox);
  protected readonly optionTemplate = contentChild(UiComboboxOptionTemplate<T>);
  protected readonly listboxId = injectId('ui-combobox-listbox');
  private popup?: ReturnType<typeof createListboxPopup>;
  private readonly formDisabled = signal(false);
  private readonly state = injectUiControlState();

  /** The selected item (or the typed text with `freeText`). */
  readonly value = model<T | null>(null);
  /** @internal Model used by `UiControlValueAccessor`. */
  readonly formModel = this.value;
  /** Static items, filtered with `filterWith` as the user types. Ignored when `search` is set. */
  readonly options = input<readonly T[]>([]);
  /** Async item source; see `UiComboboxSearch`. Takes precedence over `options`. */
  readonly search = input<UiComboboxSearch<T> | null>(null);
  /** Milliseconds to wait after the last keystroke before calling `search`. */
  readonly debounce = input(300, { transform: numberAttribute });
  /** Minimum query length before `search` is called. */
  readonly minQueryLength = input(0, { transform: numberAttribute });
  /** Text for an item, shown in the input and in the default option rendering. */
  readonly displayWith = input<UiComboboxDisplayWith<T>>(defaultDisplay);
  /** Static-mode filter. Defaults to a case-insensitive "contains" on `displayWith`. */
  readonly filterWith = input<UiComboboxFilter<T> | null>(null);
  /** Equality used to mark the selected option (e.g. compare objects by id). */
  readonly compareWith = input<UiCompareWith<T>>(Object.is);
  /**
   * Accept typed text that matches no option: on Enter / blur the text itself becomes the value.
   * Only meaningful when `T` is `string`. Otherwise the text reverts to the selected item on blur.
   */
  readonly freeText = input(false, { transform: booleanAttribute });
  /** Placeholder of the text input. */
  readonly placeholder = input('');
  /** `id` of the text input, for `<label for>`. */
  readonly inputId = input(injectId('ui-combobox-input'));
  /** Disables the combobox. */
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Makes the input read-only; the suggestions never open. */
  readonly readonly = input(false, { transform: booleanAttribute });
  /**
   * Shows the error state (`aria-invalid` on the input). Bound automatically by Signal Forms and
   * then displayed only after the field is touched; with Reactive Forms / `ngModel` the state is
   * read from the bound control.
   */
  readonly invalid = input(false, { transform: booleanAttribute });
  /** Sets `aria-required` on the input. Bound automatically by Signal Forms; read from `Validators.required`. */
  readonly required = input(false, { transform: booleanAttribute });
  /** Name of the text input. */
  readonly name = input('');
  /** Accessible name when there is no visible label. */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });
  /** Id(s) of the visible label. */
  readonly ariaLabelledby = input<string | undefined>(undefined, { alias: 'aria-labelledby' });
  /** Id(s) of hint or error text. */
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** Emitted when the input loses focus (marks the control touched). */
  readonly touch = output<void>();

  /** Current query typed by the user (empty when the list was opened without typing). */
  protected readonly query = signal('');
  /** Text shown in the input; follows `value` unless the user is typing. */
  protected readonly inputText = linkedSignal(() => this.display(this.value()));
  private readonly open = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  protected readonly isRequired = computed(() => this.required() || this.state.required());
  // Signal Forms binds the raw `invalid`: like the other kit fields, show it after interaction.
  protected readonly showInvalid = computed(() =>
    this.state.source() === 'signal-forms' ? this.state.errorVisible() : this.invalid() || this.state.errorVisible(),
  );
  private readonly suggestions = createComboboxSuggestions<T>(inject(DestroyRef), {
    query: this.query,
    options: this.options,
    search: this.search,
    filterWith: this.filterWith,
    minQueryLength: this.minQueryLength,
    display: (item) => this.display(item),
  });
  protected readonly status = this.suggestions.status;
  protected readonly results = this.suggestions.results;
  protected readonly statusText = computed<string | null>(() => {
    const status = this.status();
    if (status === 'loading') return this.intl.loading;
    if (status === 'error') return this.intl.error;
    if (status === 'success' && this.results().length === 0 && (this.search() || this.query())) return this.intl.noResults;
    return null;
  });
  /** Whether the suggestions panel is shown (drives `aria-expanded`). */
  readonly expanded = computed(() => this.open() && (this.results().length > 0 || this.statusText() !== null));
  protected readonly selection = computed<readonly T[]>(() => {
    const value = this.value();
    return value === null || value === undefined ? [] : [value];
  });

  constructor() {
    // Overlay attach/detach is DOM work: run it after rendering, when the panel element exists.
    afterRenderEffect(() => {
      const show = this.expanded();
      untracked(() => {
        this.popup ??= createListboxPopup(this.injector, {
          origin: this.field().nativeElement,
          panel: this.panel().nativeElement,
          outsideClick: () => this.close(),
        });
        if (show) this.popup.open();
        else this.popup.close();
      });
    });
    effect(() => {
      if (!this.expanded()) return;
      const status = this.status();
      const count = this.results().length;
      untracked(() => {
        if (status === 'success') this.announcer.announce(count ? this.intl.resultsAvailable(count) : this.intl.noResults);
        else if (status === 'error') this.announcer.announce(this.intl.error);
      });
    });
  }

  /** Opens the suggestions without typing (APG Alt+ArrowDown), showing every option. */
  openPanel(): void {
    if (this.isDisabled() || this.readonly()) return;
    if (!this.open()) this.query.set('');
    this.suggestions.request(this.query(), 0);
    this.open.set(true);
  }

  /** Closes the suggestions, keeping the typed text. */
  close(): void {
    this.open.set(false);
    this.listbox().setActiveOption(null);
  }

  /** Clears the text and the value. */
  clear(): void {
    this.value.set(null);
    this.inputText.set('');
    this.query.set('');
  }

  /** Moves focus to the text input. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @internal Called by `UiControlValueAccessor`. */
  setDisabledState(disabled: boolean): void {
    this.formDisabled.set(disabled);
    if (disabled) this.close();
  }

  protected display(item: T | null): string {
    return item === null || item === undefined ? '' : this.displayWith()(item);
  }

  protected onInput(): void {
    const text = this.inputEl().nativeElement.value;
    this.inputText.set(text);
    this.query.set(text);
    this.listbox().setActiveOption(null);
    this.suggestions.request(text, this.debounce());
    this.open.set(true);
  }

  protected onPicked(option: UiOption<T>): void {
    this.commit(option.value());
  }

  protected onInputClick(): void {
    if (!this.open()) this.openPanel();
  }

  protected onToggleClick(): void {
    this.focus();
    if (this.expanded()) this.close();
    else this.openPanel();
  }

  protected onBlur(): void {
    this.close();
    // Force-selection mode: text that matches no option reverts to the selected item.
    if (!this.commitText()) {
      this.inputText.set(this.display(this.value()));
      this.query.set('');
    }
    this.touch.emit();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const listbox = this.listbox();
    const action = comboboxKeyAction(event, {
      open: this.open(),
      expanded: this.expanded(),
      hasActiveOption: listbox.activeOption() !== null,
      hasContent: this.inputText() !== '' || this.value() !== null,
    });
    if (!action) return;
    // Tab keeps moving focus; every other key the combobox handles is consumed.
    if (event.key !== 'Tab') event.preventDefault();
    if (action === 'navigate') listbox.handleKeydown(event);
    else if (action === 'pick') listbox.pickActive();
    else if (action === 'close') this.close();
    else if (action === 'clear') this.clear();
    else if (action === 'commit') {
      if (this.commitText()) this.close();
    } else {
      this.openPanel();
      // Static options are already rendered, so the first / last one can be highlighted right away.
      if (action === 'open-first' && !this.search()) listbox.setFirstActive();
      if (action === 'open-last' && !this.search()) listbox.setLastActive();
    }
  }

  private commit(item: T | null): void {
    this.value.set(item);
    this.inputText.set(this.display(item));
    this.query.set('');
    this.close();
  }

  /**
   * Turns the typed text into a value: empty text clears, an exact (case-insensitive) label match
   * selects that item, and with `freeText` any text is accepted. Returns false if nothing applied.
   */
  private commitText(): boolean {
    const text = this.inputText().trim();
    if (!text) {
      if (this.value() !== null) this.value.set(null);
      return true;
    }
    const lower = text.toLocaleLowerCase();
    const exact = this.results().find((item) => this.display(item).toLocaleLowerCase() === lower);
    if (exact !== undefined) {
      if (!this.selection().length || !this.compareWith()(this.selection()[0], exact)) this.value.set(exact);
      this.inputText.set(this.display(exact));
      return true;
    }
    if (this.freeText()) {
      // Documented contract: freeText is for string values.
      this.value.set(text as unknown as T);
      return true;
    }
    return lower === this.display(this.value()).toLocaleLowerCase();
  }
}
