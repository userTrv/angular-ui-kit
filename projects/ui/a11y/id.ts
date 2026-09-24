import { _IdGenerator } from '@angular/cdk/a11y';
import { inject } from '@angular/core';

/**
 * Returns an application-unique DOM id, stable between server and client renders
 * (delegates to the CDK id generator, which is scoped by APP_ID).
 * Must be called in an injection context.
 */
export function injectId(prefix: string): string {
  return inject(_IdGenerator).getId(`${prefix}-`);
}
