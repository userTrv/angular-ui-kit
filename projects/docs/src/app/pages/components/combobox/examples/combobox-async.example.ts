import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiCheckbox } from '@usertrv/ui/checkbox';
import { UiCombobox, UiComboboxOptionTemplate, UiComboboxSearch, UiHighlight } from '@usertrv/ui/combobox';

interface Repo {
  fullName: string;
  description: string;
  stars: number;
}

const REPOS: Repo[] = [
  { fullName: 'angular/angular', description: 'Deliver web apps with confidence', stars: 97800 },
  { fullName: 'angular/components', description: 'Component infrastructure and Material Design components', stars: 24500 },
  { fullName: 'angular/angular-cli', description: 'CLI tool for Angular', stars: 26800 },
  { fullName: 'ngrx/platform', description: 'Reactive state management for Angular', stars: 8100 },
  { fullName: 'nrwl/nx', description: 'Build system with monorepo support', stars: 24100 },
  { fullName: 'vitest-dev/vitest', description: 'Next generation testing framework', stars: 14200 },
  { fullName: 'dequelabs/axe-core', description: 'Accessibility engine for automated testing', stars: 6300 },
  { fullName: 'microsoft/TypeScript', description: 'JavaScript with syntax for types', stars: 102000 },
  { fullName: 'ReactiveX/rxjs', description: 'A reactive programming library for JavaScript', stars: 30900 },
  { fullName: 'storybookjs/storybook', description: 'UI component workshop', stars: 85600 },
  { fullName: 'vitejs/vite', description: 'Next generation frontend tooling', stars: 70100 },
  { fullName: 'prettier/prettier', description: 'Opinionated code formatter', stars: 50000 },
  { fullName: 'eslint/eslint', description: 'Find and fix problems in your JavaScript code', stars: 25300 },
  { fullName: 'shikijs/shiki', description: 'A beautiful yet powerful syntax highlighter', stars: 11200 },
];

@Component({
  selector: 'docs-combobox-async-example',
  imports: [UiCombobox, UiComboboxOptionTemplate, UiHighlight, UiCheckbox],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    label {
      display: block;
      margin-bottom: var(--ui-space-1-5);
      font-size: var(--ui-font-size-sm);
      font-weight: var(--ui-font-weight-medium);
    }
    .repo {
      display: grid;
      flex: 1;
      min-width: 0;
    }
    .repo small {
      overflow: hidden;
      color: var(--ui-color-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .stars {
      color: var(--ui-color-text-muted);
      font-size: var(--ui-font-size-xs);
    }
  `,
  template: `
    <div class="docs-stack">
      <div>
        <label for="repo-search">Repository</label>
        <ui-combobox
          inputId="repo-search"
          placeholder="Search repositories"
          [search]="searchRepos"
          [displayWith]="repoName"
          [(value)]="repo"
        >
          <ng-template uiComboboxOption let-repo let-query="query">
            <span class="repo">
              <ui-highlight [text]="repo.fullName" [query]="query" />
              <small>{{ repo.description }}</small>
            </span>
            <span class="stars" aria-label="{{ repo.stars }} stars">★ {{ formatStars(repo.stars) }}</span>
          </ng-template>
        </ui-combobox>
      </div>
      <ui-checkbox [(checked)]="failRequests">Simulate API errors</ui-checkbox>
      <p class="docs-muted">Selected: {{ repo()?.fullName ?? 'none' }} · requests: {{ requests() }}, cancelled: {{ cancelled() }}</p>
    </div>
  `,
})
export class ComboboxAsyncExample {
  protected readonly repo = signal<Repo | null>(null);
  protected readonly failRequests = signal(false);
  protected readonly requests = signal(0);
  protected readonly cancelled = signal(0);
  protected readonly repoName = (repo: Repo) => repo.fullName;

  /** Fake API: 400 ms latency, honours the AbortSignal the combobox passes for stale queries. */
  protected readonly searchRepos: UiComboboxSearch<Repo> = (query, abort) => {
    this.requests.update((n) => n + 1);
    return new Promise<Repo[]>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.failRequests()) return reject(new Error('API rate limit exceeded'));
        const q = query.trim().toLowerCase();
        const matches = REPOS.filter((r) => r.fullName.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
        resolve(matches.sort((a, b) => b.stars - a.stars).slice(0, 8));
      }, 400);
      abort.addEventListener('abort', () => {
        clearTimeout(timer);
        this.cancelled.update((n) => n + 1);
        reject(abort.reason);
      });
    });
  };

  protected formatStars(stars: number): string {
    return stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);
  }
}
