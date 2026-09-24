import axe from 'axe-core';

/**
 * Runs axe-core against `element` and fails with a readable report on violations.
 *
 * jsdom has no layout engine, so rules that need rendering are disabled here:
 * `color-contrast` is instead checked in real Chrome by `pnpm test:a11y` (Playwright + axe
 * against the built docs site, every page in light, dark and high-contrast themes).
 */
export async function expectNoAxeViolations(element: Element, disabledRules: string[] = []): Promise<void> {
  const rules: axe.RuleObject = { 'color-contrast': { enabled: false }, region: { enabled: false } };
  for (const id of disabledRules) rules[id] = { enabled: false };
  const result = await axe.run(element, { rules });
  const report = result.violations
    .map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.map((n) => n.html).join('\n  ')}`)
    .join('\n');
  expect(report, 'axe-core violations').toBe('');
}

const KEY_CODES: Record<string, number> = {
  Backspace: 8, Tab: 9, Enter: 13, Escape: 27, ' ': 32, PageUp: 33, PageDown: 34, End: 35, Home: 36,
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Delete: 46,
};

/**
 * Dispatches a keydown (by default) with both `key` and the legacy `keyCode` set —
 * CDK key managers still read `keyCode`, which jsdom does not derive from `key`.
 */
export function press(
  target: Element,
  key: string,
  init: KeyboardEventInit & { type?: 'keydown' | 'keyup' } = {},
): KeyboardEvent {
  const { type = 'keydown', ...rest } = init;
  const event = new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...rest });
  const keyCode = KEY_CODES[key] ?? (key.length === 1 ? key.toUpperCase().charCodeAt(0) : 0);
  Object.defineProperty(event, 'keyCode', { get: () => keyCode });
  Object.defineProperty(event, 'which', { get: () => keyCode });
  target.dispatchEvent(event);
  return event;
}

/** Sets an input's value and fires `input`, like a user typing. */
export function typeInto(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}
