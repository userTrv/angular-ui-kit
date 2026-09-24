/*
 * Primary entry point: @usertrv/ui
 *
 * Only cross-cutting, dependency-free APIs live here (theme + density runtime switch).
 * Every component ships from its own secondary entry point (e.g. @usertrv/ui/button)
 * so applications only pay for what they import.
 */
export * from './theme';
export { VERSION } from './version';
