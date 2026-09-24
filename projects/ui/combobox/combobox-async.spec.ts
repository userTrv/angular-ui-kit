import { LiveAnnouncer } from '@angular/cdk/a11y';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { expectNoAxeViolations, press, typeInto } from '../test-utils';
import { UiCombobox, UiComboboxOptionTemplate, UiComboboxSearch, UiHighlight } from './index';

interface Repo {
  id: number;
  fullName: string;
  stars: number;
}

interface PendingCall {
  query: string;
  signal: AbortSignal;
  resolve: (repos: Repo[]) => void;
  reject: (error: Error) => void;
}

@Component({
  imports: [UiCombobox, UiComboboxOptionTemplate, UiHighlight],
  template: `
    <ui-combobox
      aria-label="Repository"
      [search]="search()"
      [debounce]="20"
      [minQueryLength]="minLength()"
      [displayWith]="fullName"
      [(value)]="repo"
    >
      <ng-template uiComboboxOption let-repo let-query="query">
        <ui-highlight [text]="repo.fullName" [query]="query" />
        <span class="stars">★ {{ repo.stars }}</span>
      </ng-template>
    </ui-combobox>
  `,
})
class Host {
  readonly calls: PendingCall[] = [];
  readonly minLength = signal(0);
  readonly repo = signal<Repo | null>(null);
  readonly fullName = (r: Repo) => r.fullName;
  readonly search = signal<UiComboboxSearch<Repo>>(
    (query, abort) =>
      new Promise<Repo[]>((resolve, reject) => this.calls.push({ query, signal: abort, resolve, reject })),
  );
}

const REPOS: Repo[] = [
  { id: 1, fullName: 'angular/angular', stars: 97000 },
  { id: 2, fullName: 'angular/components', stars: 24000 },
  { id: 3, fullName: 'angular/angular-cli', stars: 27000 },
];

describe('UiCombobox (async search)', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let input: HTMLInputElement;
  let announce: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    announce = vi.spyOn(TestBed.inject(LiveAnnouncer), 'announce').mockResolvedValue();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    input = fixture.nativeElement.querySelector('input');
  });

  const settle = async (ms = 40) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await fixture.whenStable();
  };
  const listbox = () => document.getElementById(input.getAttribute('aria-controls') ?? '') as HTMLElement;
  const status = () => document.querySelector('.ui-combobox__status')?.textContent?.trim();

  it('debounces keystrokes into a single request', async () => {
    typeInto(input, 'a');
    typeInto(input, 'an');
    typeInto(input, 'ang');
    await fixture.whenStable();
    expect(host.calls).toHaveLength(0);
    await settle();
    expect(host.calls.map((c) => c.query)).toEqual(['ang']);
  });

  it('shows loading state with aria-busy, then the results and announces the count', async () => {
    typeInto(input, 'ang');
    await settle();
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(status()).toBe('Searching…');
    expect(listbox().getAttribute('aria-busy')).toBe('true');
    expect(fixture.nativeElement.querySelector('.ui-combobox__spinner')).not.toBeNull();

    host.calls[0].resolve(REPOS);
    await settle(0);
    expect(listbox().hasAttribute('aria-busy')).toBe(false);
    expect(status()).toBeUndefined();
    const options = Array.from(listbox().querySelectorAll('[role=option]'));
    expect(options).toHaveLength(3);
    expect(options[0].querySelector('mark')?.textContent).toBe('ang');
    expect(options[0].querySelector('.stars')?.textContent).toContain('97000');
    expect(announce).toHaveBeenLastCalledWith('3 results available');
  });

  it('cancels stale requests: aborts their signal and ignores late responses', async () => {
    typeInto(input, 'ang');
    await settle();
    typeInto(input, 'rea');
    await settle();
    expect(host.calls.map((c) => c.query)).toEqual(['ang', 'rea']);
    expect(host.calls[0].signal.aborted).toBe(true);
    expect(host.calls[1].signal.aborted).toBe(false);

    host.calls[1].resolve([{ id: 9, fullName: 'facebook/react', stars: 1 }]);
    host.calls[0].resolve(REPOS);
    await settle(0);
    const texts = Array.from(listbox().querySelectorAll('[role=option]')).map((o) => o.textContent);
    expect(texts).toHaveLength(1);
    expect(texts[0]).toContain('facebook/react');
    // A request that completed normally is not aborted afterwards.
    expect(host.calls[1].signal.aborted).toBe(false);
  });

  it('shows the empty state', async () => {
    typeInto(input, 'zzz');
    await settle();
    host.calls[0].resolve([]);
    await settle(0);
    expect(status()).toBe('No results');
    expect(announce).toHaveBeenLastCalledWith('No results');
  });

  it('shows the error state and retries on the next query', async () => {
    typeInto(input, 'ang');
    await settle();
    host.calls[0].reject(new Error('rate limited'));
    await settle(0);
    expect(status()).toBe('Could not load results');
    expect(announce).toHaveBeenLastCalledWith('Could not load results');
    typeInto(input, 'angu');
    await settle();
    expect(host.calls).toHaveLength(2);
  });

  it('accepts Observable sources', async () => {
    host.search.set((query): Observable<Repo[]> => of(REPOS.filter((r) => r.fullName.includes(query))));
    await fixture.whenStable();
    typeInto(input, 'cli');
    await settle();
    expect(listbox().querySelectorAll('[role=option]')).toHaveLength(1);
  });

  it('waits for minQueryLength characters', async () => {
    host.minLength.set(2);
    await fixture.whenStable();
    typeInto(input, 'a');
    await settle();
    expect(host.calls).toHaveLength(0);
    expect(input.getAttribute('aria-expanded')).toBe('false');
  });

  it('opens with Alt+ArrowDown by searching immediately, and selects an object with displayWith', async () => {
    press(input, 'ArrowDown', { altKey: true });
    await settle(5);
    expect(host.calls.map((c) => c.query)).toEqual(['']);
    host.calls[0].resolve(REPOS);
    await settle(0);
    press(input, 'ArrowDown');
    press(input, 'ArrowDown');
    await fixture.whenStable();
    press(input, 'Enter');
    await fixture.whenStable();
    expect(host.repo()?.id).toBe(2);
    expect(input.value).toBe('angular/components');
  });

  it('has no axe violations with results open', async () => {
    typeInto(input, 'ang');
    await settle();
    host.calls[0].resolve(REPOS);
    await settle(0);
    press(input, 'ArrowDown');
    await fixture.whenStable();
    await expectNoAxeViolations(document.body);
  });
});
