import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { UiThemeService, provideUiTheme } from './theme';

describe('UiThemeService', () => {
  afterEach(() => {
    const root = TestBed.inject(DOCUMENT).documentElement;
    root.removeAttribute('data-ui-theme');
    root.removeAttribute('data-ui-density');
    localStorage.clear();
  });

  it('writes theme and density attributes on <html>', () => {
    TestBed.configureTestingModule({ providers: [provideUiTheme({ theme: 'dark', density: 'compact' })] });
    const service = TestBed.inject(UiThemeService);
    TestBed.tick();
    const root = TestBed.inject(DOCUMENT).documentElement;
    expect(root.getAttribute('data-ui-theme')).toBe('dark');
    expect(root.getAttribute('data-ui-density')).toBe('compact');

    service.setTheme('high-contrast');
    TestBed.tick();
    expect(root.getAttribute('data-ui-theme')).toBe('high-contrast');
    expect(service.resolvedTheme()).toBe('high-contrast');
  });

  it('removes the attribute for the system theme so prefers-color-scheme applies', () => {
    const service = TestBed.inject(UiThemeService);
    service.setTheme('system');
    TestBed.tick();
    expect(TestBed.inject(DOCUMENT).documentElement.hasAttribute('data-ui-theme')).toBe(false);
    expect(['light', 'dark']).toContain(service.resolvedTheme());
  });

  it('persists the choice when a storage key is configured', () => {
    TestBed.configureTestingModule({ providers: [provideUiTheme({ storageKey: 'ui-test' })] });
    TestBed.inject(UiThemeService).setDensity('compact');
    TestBed.tick();
    expect(JSON.parse(localStorage.getItem('ui-test') ?? '{}')).toEqual({ theme: 'system', density: 'compact' });
  });
});
