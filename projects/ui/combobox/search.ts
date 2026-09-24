import { DestroyRef, Signal, computed, signal } from '@angular/core';
import { Observable, Subject, catchError, from, map, of, switchMap, tap, timer } from 'rxjs';

/**
 * Async option source for `ui-combobox`. Receives the query and an `AbortSignal` that is aborted
 * when a newer query supersedes this one (pass it to `fetch`). May return a Promise or an
 * Observable (e.g. `HttpClient.get`, which is cancelled by unsubscribing).
 */
export type UiComboboxSearch<T> = (query: string, signal: AbortSignal) => Promise<readonly T[]> | Observable<readonly T[]>;

/** Text for an item, shown in the input and used for matching. */
export type UiComboboxDisplayWith<T> = (item: T) => string;

/** Static-options filter; `query` is trimmed and lower-cased. */
export type UiComboboxFilter<T> = (item: T, query: string) => boolean;

/** Lifecycle of the current async search. */
export type UiComboboxSearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface SearchRequest<T> {
  query: string;
  source: UiComboboxSearch<T>;
  delay: number;
}

/** @internal State of the async search. */
export interface ComboboxSearch<T> {
  readonly results: Signal<readonly T[]>;
  readonly status: Signal<UiComboboxSearchStatus>;
  /** Query of the last request that was started (not necessarily finished). */
  readonly lastQuery: Signal<string | null>;
  search(query: string, source: UiComboboxSearch<T>, delay: number): void;
  reset(): void;
}

/**
 * Debounced, cancellable search: every call restarts the debounce timer and `switchMap` drops the
 * previous request, aborting its `AbortSignal`, so stale responses never overwrite newer ones.
 * @internal
 */
function createComboboxSearch<T>(destroyRef: DestroyRef): ComboboxSearch<T> {
  const results = signal<readonly T[]>([]);
  const status = signal<UiComboboxSearchStatus>('idle');
  const lastQuery = signal<string | null>(null);
  const requests = new Subject<SearchRequest<T> | null>();

  // Aborts the AbortSignal only when the request is dropped before it finished.
  const run = ({ query, source }: SearchRequest<T>) =>
    new Observable<readonly T[]>((subscriber) => {
      const controller = new AbortController();
      let finished = false;
      const inner = from(source(query, controller.signal)).subscribe({
        next: (items) => subscriber.next(items),
        error: (error: unknown) => {
          finished = true;
          subscriber.error(error);
        },
        complete: () => {
          finished = true;
          subscriber.complete();
        },
      });
      return () => {
        inner.unsubscribe();
        if (!finished) controller.abort();
      };
    });

  const subscription = requests
    .pipe(
      switchMap((request) => {
        if (!request) return of(null);
        return timer(request.delay).pipe(
          tap(() => status.set('loading')),
          switchMap(() => run(request)),
          map((items) => ({ items })),
          catchError(() => of({ error: true as const })),
        );
      }),
    )
    .subscribe((outcome) => {
      if (!outcome) return;
      if ('items' in outcome) {
        results.set(outcome.items);
        status.set('success');
      } else {
        results.set([]);
        status.set('error');
      }
    });
  destroyRef.onDestroy(() => subscription.unsubscribe());

  return {
    results: results.asReadonly(),
    status: status.asReadonly(),
    lastQuery: lastQuery.asReadonly(),
    search(query, source, delay) {
      lastQuery.set(query);
      requests.next({ query, source, delay });
    },
    reset() {
      lastQuery.set(null);
      requests.next(null);
      results.set([]);
      status.set('idle');
    },
  };
}

/** @internal Inputs of `createComboboxSuggestions`. */
export interface ComboboxSuggestionsConfig<T> {
  query: Signal<string>;
  options: Signal<readonly T[]>;
  search: Signal<UiComboboxSearch<T> | null>;
  filterWith: Signal<UiComboboxFilter<T> | null>;
  minQueryLength: Signal<number>;
  display: (item: T) => string;
}

/**
 * Where the combobox suggestions come from: the static `options` filtered by the query, or the
 * async `search` source (then `request()` must be called when the query changes).
 * @internal
 */
export function createComboboxSuggestions<T>(destroyRef: DestroyRef, config: ComboboxSuggestionsConfig<T>) {
  const asyncSearch = createComboboxSearch<T>(destroyRef);
  const status = computed<UiComboboxSearchStatus>(() => (config.search() ? asyncSearch.status() : 'success'));
  const results = computed<readonly T[]>(() => {
    if (config.search()) return asyncSearch.results();
    const query = config.query().trim().toLocaleLowerCase();
    if (!query) return config.options();
    const matches =
      config.filterWith() ?? ((item: T, q: string) => config.display(item).toLocaleLowerCase().includes(q));
    return config.options().filter((item) => matches(item, query));
  });

  return {
    status,
    results,
    /** Starts an async search for `query` after `delay` ms (no-op for static options). */
    request(query: string, delay: number): void {
      const source = config.search();
      if (!source) return;
      if (query.trim().length < config.minQueryLength()) {
        asyncSearch.reset();
        return;
      }
      // Opening the panel again (delay 0) reuses results that are already there for this query.
      const upToDate = asyncSearch.lastQuery() === query && asyncSearch.status() !== 'error';
      if (delay > 0 || !upToDate) asyncSearch.search(query, source, delay);
    },
  };
}
