import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  EnvironmentProviders,
  Injectable,
  InjectionToken,
  computed,
  effect,
  inject,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';

/** Theme names shipped with the kit. `system` follows `prefers-color-scheme`. */
export type UiTheme = 'light' | 'dark' | 'high-contrast' | 'system';
/** Density scales control heights, paddings and row heights. */
export type UiDensity = 'comfortable' | 'compact';

export interface UiThemeConfig {
  /** Initial theme. Defaults to `system`. */
  theme?: UiTheme;
  /** Initial density. Defaults to `comfortable`. */
  density?: UiDensity;
  /** Persist the user's choice in localStorage under this key. Off by default. */
  storageKey?: string;
}

export const UI_THEME_CONFIG = new InjectionToken<UiThemeConfig>('UI_THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({}),
});

/** Registers theme defaults for the application. */
export function provideUiTheme(config: UiThemeConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: UI_THEME_CONFIG, useValue: config }]);
}

interface StoredChoice {
  theme?: UiTheme;
  density?: UiDensity;
}

/**
 * Runtime theme and density switch.
 *
 * Writes `data-ui-theme` / `data-ui-density` on `<html>`. All styling is driven by CSS custom
 * properties, so switching never re-renders Angular components: only the cascade changes.
 * To theme a subtree instead, put the same data attributes on any element.
 */
@Injectable({ providedIn: 'root' })
export class UiThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(UI_THEME_CONFIG);
  private readonly stored = this.read();

  private readonly themeState = signal<UiTheme>(this.stored.theme ?? this.config.theme ?? 'system');
  private readonly densityState = signal<UiDensity>(
    this.stored.density ?? this.config.density ?? 'comfortable',
  );
  private readonly prefersDark = signal(false);

  /** Selected theme, possibly `system`. */
  readonly theme = this.themeState.asReadonly();
  /** Selected density. */
  readonly density = this.densityState.asReadonly();
  /** Theme actually in effect (`system` resolved through `prefers-color-scheme`). */
  readonly resolvedTheme = computed<Exclude<UiTheme, 'system'>>(() => {
    const theme = this.themeState();
    if (theme !== 'system') return theme;
    return this.prefersDark() ? 'dark' : 'light';
  });

  constructor() {
    const view = this.document.defaultView;
    const query = view?.matchMedia?.('(prefers-color-scheme: dark)');
    if (query) {
      this.prefersDark.set(query.matches);
      const listener = (event: MediaQueryListEvent) => this.prefersDark.set(event.matches);
      query.addEventListener('change', listener);
      inject(DestroyRef).onDestroy(() => query.removeEventListener('change', listener));
    }

    effect(() => {
      const root = this.document.documentElement;
      const theme = this.themeState();
      if (theme === 'system') root.removeAttribute('data-ui-theme');
      else root.setAttribute('data-ui-theme', theme);
      root.setAttribute('data-ui-density', this.densityState());
      this.write({ theme, density: this.densityState() });
    });
  }

  setTheme(theme: UiTheme): void {
    this.themeState.set(theme);
  }

  setDensity(density: UiDensity): void {
    this.densityState.set(density);
  }

  private read(): StoredChoice {
    const key = this.config.storageKey;
    if (!key) return {};
    try {
      return JSON.parse(this.document.defaultView?.localStorage.getItem(key) ?? '{}') as StoredChoice;
    } catch {
      return {};
    }
  }

  private write(choice: StoredChoice): void {
    const key = this.config.storageKey;
    if (!key) return;
    try {
      this.document.defaultView?.localStorage.setItem(key, JSON.stringify(choice));
    } catch {
      // Storage can be unavailable (private mode, sandboxed iframes). The switch still works.
    }
  }
}
