import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { press } from '../test-utils';
import { UiColumnWidths, UiTableImports } from './index';

@Component({
  imports: [UiTableImports],
  template: `
    <ui-table label="Services" [data]="rows" resizable [(columnWidths)]="widths">
      <ui-column key="name" header="Name" [width]="200" [minWidth]="120" [maxWidth]="320" />
      <ui-column key="owner" header="Owner" />
      <ui-column key="region" header="Region" [resizable]="false" />
    </ui-table>
  `,
})
class Host {
  readonly rows = [{ name: 'checkout-api', owner: 'Payments', region: 'eu-west-1' }];
  readonly widths = signal<UiColumnWidths>({});
}

function pointer(
  type: string,
  init: { clientX: number; pointerId?: number; button?: number },
): Event {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX,
    button: init.button ?? 0,
  });
  Object.defineProperty(event, 'pointerId', { value: init.pointerId ?? 1 });
  return event;
}

describe('UiTable column resize', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const handles = () => Array.from(el.querySelectorAll<HTMLElement>('[role=separator]'));
    const template = () =>
      (el.querySelector('ui-table') as HTMLElement).style.getPropertyValue('--_columns');
    return { fixture, host: fixture.componentInstance, el, handles, template };
  }

  it('renders an accessible separator for each resizable column', async () => {
    const { handles } = await setup();
    expect(handles().length).toBe(2);
    const [name, owner] = handles();
    expect(name.getAttribute('aria-orientation')).toBe('vertical');
    expect(name.getAttribute('aria-label')).toBe('Resize Name column');
    expect(name.getAttribute('aria-valuenow')).toBe('200');
    expect(name.getAttribute('aria-valuemin')).toBe('120');
    expect(name.getAttribute('aria-valuemax')).toBe('320');
    expect(owner.getAttribute('aria-valuenow')).toBe('160');
  });

  it('is in the tab order only while its header cell is the active grid cell', async () => {
    const { fixture, el, handles } = await setup();
    expect(handles().map((h) => h.tabIndex)).toEqual([0, -1]);
    el.querySelectorAll<HTMLElement>('[role=columnheader]')[1].focus();
    await fixture.whenStable();
    expect(handles().map((h) => h.tabIndex)).toEqual([-1, 0]);
  });

  it('resizes with arrows by 10px and Shift+arrows by 50px, clamped to min/max', async () => {
    const { fixture, host, handles, template } = await setup();
    const handle = handles()[0];
    press(handle, 'ArrowRight');
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('210');
    expect(host.widths()).toEqual({ name: 210 });
    expect(template()).toBe('210px 160px 160px minmax(0, 1fr)');

    press(handle, 'ArrowLeft', { shiftKey: true });
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('160');

    press(handle, 'ArrowLeft', { shiftKey: true });
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('120');
  });

  it('does not let the grid treat resize arrows as navigation', async () => {
    const { fixture, handles } = await setup();
    const handle = handles()[0];
    handle.focus();
    const event = press(handle, 'ArrowRight');
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(handle);
  });

  it('resizes by dragging with a pointer', async () => {
    const { fixture, handles } = await setup();
    const handle = handles()[1];
    handle.dispatchEvent(pointer('pointerdown', { clientX: 500 }));
    handle.dispatchEvent(pointer('pointermove', { clientX: 540 }));
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('200');
    expect(handle.classList).toContain('ui-table__resize--dragging');
    expect(document.activeElement).toBe(handle);

    handle.dispatchEvent(pointer('pointermove', { clientX: 300 }));
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('64');

    handle.dispatchEvent(pointer('pointerup', { clientX: 300 }));
    handle.dispatchEvent(pointer('pointermove', { clientX: 700 }));
    await fixture.whenStable();
    expect(handle.getAttribute('aria-valuenow')).toBe('64');
    expect(handle.classList).not.toContain('ui-table__resize--dragging');
  });

  it('restores widths from the columnWidths model', async () => {
    const { fixture, host, handles } = await setup();
    host.widths.set({ owner: 240 });
    await fixture.whenStable();
    expect(handles()[1].getAttribute('aria-valuenow')).toBe('240');
  });
});
