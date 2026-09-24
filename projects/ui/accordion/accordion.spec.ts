import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { expectNoAxeViolations, press } from '../test-utils';
import { UiAccordion, UiAccordionItem } from './index';

@Component({
  imports: [UiAccordion, UiAccordionItem],
  template: `
    <ui-accordion [multi]="multi()">
      <ui-accordion-item label="Shipping" [(expanded)]="shippingOpen">Ships in 2 days.</ui-accordion-item>
      <ui-accordion-item label="Returns" [headingLevel]="2">Free returns within 30 days.</ui-accordion-item>
      <ui-accordion-item label="Warranty" disabled>Two years.</ui-accordion-item>
      <ui-accordion-item>
        <span uiAccordionTitle class="custom-title">Payment <em>new</em></span>
        Cards and bank transfer.
      </ui-accordion-item>
    </ui-accordion>
  `,
})
class Host {
  readonly multi = signal(false);
  readonly shippingOpen = signal(true);
  readonly accordion = viewChild.required(UiAccordion);
}

describe('UiAccordion', () => {
  async function setup() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const headers = Array.from(el.querySelectorAll<HTMLButtonElement>('.ui-accordion-item__header'));
    const panels = Array.from(el.querySelectorAll<HTMLElement>('[role=region]'));
    return { fixture, host: fixture.componentInstance, el, headers, panels };
  }

  it('wires headers and regions with ARIA', async () => {
    const { el, headers, panels } = await setup();
    const headings = Array.from(el.querySelectorAll('[role=heading]'));
    expect(headings.map((h) => h.getAttribute('aria-level'))).toEqual(['3', '2', '3', '3']);
    headers.forEach((header, i) => {
      expect(header.getAttribute('aria-controls')).toBe(panels[i].id);
      expect(panels[i].getAttribute('aria-labelledby')).toBe(header.id);
    });
    expect(headers.map((h) => h.getAttribute('aria-expanded'))).toEqual(['true', 'false', 'false', 'false']);
    expect(panels[0].hasAttribute('inert')).toBe(false);
    expect(panels[1].hasAttribute('inert')).toBe(true);
  });

  it('renders a projected title instead of the label', async () => {
    const { headers } = await setup();
    expect(headers[3].querySelector('.custom-title')?.textContent).toContain('Payment');
  });

  it('opens one item at a time by default and updates the expanded model', async () => {
    const { fixture, host, headers } = await setup();
    headers[1].click();
    await fixture.whenStable();
    expect(headers[1].getAttribute('aria-expanded')).toBe('true');
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    expect(host.shippingOpen()).toBe(false);
  });

  it('allows several open items with multi', async () => {
    const { fixture, host, headers } = await setup();
    host.multi.set(true);
    await fixture.whenStable();
    headers[1].click();
    await fixture.whenStable();
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
    expect(headers[1].getAttribute('aria-expanded')).toBe('true');

    host.accordion().closeAll();
    await fixture.whenStable();
    expect(headers.map((h) => h.getAttribute('aria-expanded'))).toEqual(['false', 'false', 'false', 'false']);
    host.accordion().openAll();
    await fixture.whenStable();
    expect(headers.map((h) => h.getAttribute('aria-expanded'))).toEqual(['true', 'true', 'false', 'true']);
  });

  it('collapses on a second click and reacts to the expanded model', async () => {
    const { fixture, host, headers } = await setup();
    headers[0].click();
    await fixture.whenStable();
    expect(headers[0].getAttribute('aria-expanded')).toBe('false');
    host.shippingOpen.set(true);
    await fixture.whenStable();
    expect(headers[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('does not toggle disabled items, which stay focusable', async () => {
    const { fixture, headers } = await setup();
    expect(headers[2].getAttribute('aria-disabled')).toBe('true');
    expect(headers[2].disabled).toBe(false);
    headers[2].click();
    await fixture.whenStable();
    expect(headers[2].getAttribute('aria-expanded')).toBe('false');
  });

  it('moves focus between headers with Up/Down/Home/End (wrapping)', async () => {
    const { headers } = await setup();
    headers[0].focus();
    press(headers[0], 'ArrowDown');
    expect(document.activeElement).toBe(headers[1]);
    press(headers[1], 'ArrowDown');
    expect(document.activeElement).toBe(headers[2]);
    press(headers[2], 'End');
    expect(document.activeElement).toBe(headers[3]);
    press(headers[3], 'ArrowDown');
    expect(document.activeElement).toBe(headers[0]);
    press(headers[0], 'ArrowUp');
    expect(document.activeElement).toBe(headers[3]);
    press(headers[3], 'Home');
    expect(document.activeElement).toBe(headers[0]);
  });

  it('ignores arrow keys that come from panel content', async () => {
    const { panels, headers } = await setup();
    headers[0].focus();
    const event = press(panels[0], 'ArrowDown');
    expect(event.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(headers[0]);
  });

  it('has no axe violations', async () => {
    const { fixture } = await setup();
    await expectNoAxeViolations(fixture.nativeElement);
  });
});
