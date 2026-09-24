/*
 * @usertrv/ui/a11y — headless accessibility primitives shared by the styled components.
 * They carry behaviour and ARIA wiring only, no styles, so they can be reused to build
 * custom widgets with the same keyboard contract.
 */
export { injectId } from './id';
export { UiRovingFocusGroup, UiRovingFocusItem, type UiOrientation } from './roving-focus';
