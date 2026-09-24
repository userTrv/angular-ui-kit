import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UiDensity, UiTheme, UiThemeService } from '@usertrv/ui';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { COMPONENT_DOCS } from './generated/registry';
import { DocCategory } from './core/doc-model';

interface NavGroup {
  label: DocCategory;
  items: { slug: string; name: string }[];
}

@Component({
  selector: 'docs-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly theme = inject(UiThemeService);
  protected readonly navOpen = signal(false);
  protected readonly themes: { value: UiTheme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'high-contrast', label: 'High contrast' },
    { value: 'system', label: 'System' },
  ];
  protected readonly groups = computed<NavGroup[]>(() => {
    const groups = new Map<DocCategory, NavGroup>();
    for (const doc of COMPONENT_DOCS) {
      const group = groups.get(doc.category) ?? { label: doc.category, items: [] };
      group.items.push({ slug: doc.slug, name: doc.name });
      groups.set(doc.category, group);
    }
    return [...groups.values()];
  });
  protected readonly componentCount = COMPONENT_DOCS.length;

  constructor() {
    inject(Router)
      .events.pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.navOpen.set(false));
  }

  protected setTheme(value: string): void {
    this.theme.setTheme(value as UiTheme);
  }

  protected setDensity(value: UiDensity): void {
    this.theme.setDensity(value);
  }

  protected focusMain(event: Event): void {
    event.preventDefault();
    document.getElementById('main')?.focus();
  }
}
