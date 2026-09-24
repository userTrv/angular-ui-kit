import { Component, computed, input, model, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormField, FormValueControl, form } from '@angular/forms/signals';
import { UiControlValueAccessor, UiFormValueControl, provideUiFormValueControl } from './index';

/** Minimal control following the same contract as the kit's components. */
@Component({
  selector: 'ui-select',
  template: `<button [disabled]="isDisabled()" (click)="value.set(value() + 1)" (blur)="touch.emit()">{{ value() }}</button>`,
  providers: [provideUiFormValueControl(Counter)],
})
class Counter implements FormValueControl<number>, UiFormValueControl<number> {
  readonly value = model(0);
  readonly disabled = input(false);
  readonly touch = output<void>();
  readonly formModel = this.value;
  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());
  setDisabledState(disabled: boolean) {
    this.formDisabled.set(disabled);
  }
}

@Component({
  imports: [Counter, UiControlValueAccessor, ReactiveFormsModule, FormsModule, FormField],
  template: `
    <ui-select [formControl]="ctrl" />
    <ui-select [(ngModel)]="plain" />
    <ui-select [formField]="signalForm.count" />
  `,
})
class Host {
  readonly ctrl = new FormControl(3, { nonNullable: true });
  plain = 7;
  readonly model = signal({ count: 5 });
  readonly signalForm = form(this.model);
}

describe('UiControlValueAccessor', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    return { fixture, host: fixture.componentInstance, buttons };
  }

  it('writes FormControl values into the component without marking it dirty', async () => {
    const { fixture, host, buttons } = await setup();
    expect(buttons[0].textContent).toBe('3');
    host.ctrl.setValue(10);
    await fixture.whenStable();
    expect(buttons[0].textContent).toBe('10');
    expect(host.ctrl.dirty).toBe(false);
  });

  it('propagates user changes and touch to the FormControl', async () => {
    const { fixture, host, buttons } = await setup();
    buttons[0].click();
    buttons[0].dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(host.ctrl.value).toBe(4);
    expect(host.ctrl.dirty).toBe(true);
    expect(host.ctrl.touched).toBe(true);
  });

  it('mirrors the disabled state', async () => {
    const { fixture, host, buttons } = await setup();
    host.ctrl.disable();
    await fixture.whenStable();
    expect(buttons[0].disabled).toBe(true);
  });

  it('works with ngModel', async () => {
    const { fixture, host, buttons } = await setup();
    expect(buttons[1].textContent).toBe('7');
    buttons[1].click();
    await fixture.whenStable();
    expect(host.plain).toBe(8);
  });

  it('is not applied to Signal Forms bindings, which use the native control contract', async () => {
    const { fixture, host, buttons } = await setup();
    expect(buttons[2].textContent).toBe('5');
    buttons[2].click();
    await fixture.whenStable();
    expect(host.model().count).toBe(6);
    const withAdapter = fixture.debugElement
      .queryAll((d) => d.name === 'ui-select')
      .map((d) => d.injector.get(UiControlValueAccessor, null) !== null);
    expect(withAdapter).toEqual([true, true, false]);
  });
});
