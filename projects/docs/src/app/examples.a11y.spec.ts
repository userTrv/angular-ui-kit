import { TestBed } from '@angular/core/testing';
import { provideRouter, withHashLocation } from '@angular/router';
import { expectNoAxeViolations } from '../../../ui/test-utils';
import { COMPONENT_DOCS } from './generated/registry';

/**
 * Renders every live example of every docs page and runs axe-core on it (jsdom, so without
 * colour-contrast — that is covered by `pnpm test:a11y` in real Chrome). New pages are picked up
 * automatically through the generated registry.
 */
describe('Docs examples are accessible (axe-core)', () => {
  it('has component pages registered', () => {
    expect(COMPONENT_DOCS.length).toBeGreaterThan(0);
  });

  for (const entry of COMPONENT_DOCS) {
    describe(entry.name, () => {
      it('every example passes axe', async () => {
        const doc = await entry.loadDoc();
        const sources = await entry.loadSources();
        expect(doc.slug).toBe(entry.slug);
        for (const example of doc.examples) {
          expect(sources[example.file], `source for ${example.file}`).toBeDefined();
          TestBed.resetTestingModule();
          TestBed.configureTestingModule({ providers: [provideRouter([], withHashLocation())] });
          const fixture = TestBed.createComponent(example.component);
          await fixture.whenStable();
          await expectNoAxeViolations(fixture.nativeElement);
          fixture.destroy();
        }
      });
    });
  }
});
