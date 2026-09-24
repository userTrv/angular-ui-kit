const CANDIDATES = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
  '[contenteditable="true"]',
].join(',');

/**
 * Tabbable descendants in DOM order. Attribute-based (no layout checks), so it also works in
 * unit tests; elements inside `[hidden]` or `[inert]` subtrees and `tabindex="-1"` are skipped.
 * @internal
 */
export function tabbableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(CANDIDATES)).filter(
    (el) => el.tabIndex >= 0 && el.getAttribute('tabindex') !== '-1' && !el.closest('[hidden], [inert]'),
  );
}
