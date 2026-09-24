import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { press } from '../test-utils';
import { UiTableImports } from './index';

interface Member {
  id: number;
  name: string;
  role: string;
}

const MEMBERS: Member[] = Array.from({ length: 30 }, (_, i) => ({
  id: i + 1,
  name: `Member ${i + 1}`,
  role: 'Engineer',
}));

@Component({
  imports: [UiTableImports],
  template: `
    <button id="before">Before</button>
    <ui-table label="Team" [data]="members" rowKey="id" selectionMode="multiple">
      <ui-column key="name" header="Name" sortable />
      <ui-column key="role" header="Role" />
      <ui-column key="profile" header="Profile">
        <ng-template uiCell [uiCellOf]="members" let-member>
          <a href="/people/{{ member.id }}">Open {{ member.name }}</a>
        </ng-template>
      </ui-column>
    </ui-table>
  `,
})
class Host {
  readonly members = MEMBERS;
}

describe('UiTable grid keyboard navigation', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const row = (r: number) =>
      r === 0
        ? (el.querySelector('.ui-table__row--header') as HTMLElement)
        : el.querySelectorAll<HTMLElement>('.ui-table__row--body')[r - 1];
    const cell = (r: number, c: number) =>
      row(r).querySelectorAll<HTMLElement>('[role=gridcell],[role=columnheader]')[c];
    const tabStops = () =>
      Array.from(el.querySelectorAll<HTMLElement>('ui-table [tabindex]')).filter(
        (n) => n.tabIndex >= 0,
      );
    const key = async (k: string, init: KeyboardEventInit = {}) => {
      press(document.activeElement as HTMLElement, k, init);
      await fixture.whenStable();
    };
    return { fixture, el, cell, tabStops, key };
  }

  it('has exactly one tab stop, starting on the first header cell widget', async () => {
    const { tabStops, cell } = await setup();
    expect(tabStops()).toEqual([cell(0, 0).querySelector('input')]);
  });

  it('moves between cells with arrows, focusing the widget inside a cell when there is one', async () => {
    const { cell, key, tabStops } = await setup();
    (cell(0, 0).querySelector('input') as HTMLElement).focus();
    await key('ArrowRight');
    expect(document.activeElement).toBe(cell(0, 1).querySelector('button'));
    await key('ArrowDown');
    expect(document.activeElement).toBe(cell(1, 1));
    await key('ArrowRight');
    await key('ArrowRight');
    expect(document.activeElement).toBe(cell(1, 3).querySelector('a'));
    await key('ArrowLeft');
    expect(document.activeElement).toBe(cell(1, 2));
    expect(tabStops()).toEqual([cell(1, 2)]);
  });

  it('supports Home/End, Ctrl+Home/End and PageUp/PageDown', async () => {
    const { cell, key } = await setup();
    cell(3, 2).focus();
    await key('Home');
    expect(document.activeElement).toBe(cell(3, 0).querySelector('input'));
    await key('End');
    expect(document.activeElement).toBe(cell(3, 3).querySelector('a'));
    await key('PageDown');
    expect(document.activeElement).toBe(cell(13, 3).querySelector('a'));
    await key('PageUp');
    expect(document.activeElement).toBe(cell(3, 3).querySelector('a'));
    await key('End', { ctrlKey: true });
    expect(document.activeElement).toBe(cell(30, 3).querySelector('a'));
    await key('Home', { ctrlKey: true });
    expect(document.activeElement).toBe(cell(0, 0).querySelector('input'));
  });

  it('makes a clicked cell the tab stop', async () => {
    const { fixture, cell, tabStops } = await setup();
    cell(5, 1).focus();
    await fixture.whenStable();
    expect(tabStops()).toEqual([cell(5, 1)]);
  });

  it('keeps links and checkboxes in other cells out of the tab order', async () => {
    const { el } = await setup();
    const links = Array.from(el.querySelectorAll('a'));
    const boxes = Array.from(el.querySelectorAll<HTMLInputElement>('.ui-table__row--body input'));
    expect(links.every((a) => a.tabIndex === -1)).toBe(true);
    expect(boxes.every((b) => b.tabIndex === -1)).toBe(true);
  });

  it('continues from the sort button into the re-sorted rows', async () => {
    const { fixture, cell, key } = await setup();
    const sort = cell(0, 1).querySelector('button') as HTMLButtonElement;
    sort.focus();
    sort.click();
    sort.click();
    await fixture.whenStable();
    await key('ArrowDown');
    expect(document.activeElement).toBe(cell(1, 1));
    expect(document.activeElement?.textContent?.trim()).toBe('Member 30'); // numeric collation: 30 > 9
    expect(document.activeElement?.closest('[role=row]')?.getAttribute('aria-rowindex')).toBe('2');
  });
});
