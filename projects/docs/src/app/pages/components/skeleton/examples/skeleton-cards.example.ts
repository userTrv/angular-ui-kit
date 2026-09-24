import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiBusy, UiSkeleton } from '@usertrv/ui/skeleton';

interface Member {
  name: string;
  role: string;
  initials: string;
}

@Component({
  selector: 'docs-skeleton-cards-example',
  imports: [UiButton, UiBusy, UiSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <div class="docs-row">
        <button uiButton size="sm" (click)="loading.set(!loading())">
          {{ loading() ? 'Finish loading' : 'Reload' }}
        </button>
      </div>

      <section aria-labelledby="team-heading" [uiBusy]="loading()">
        <h3 id="team-heading" class="heading">Team</h3>
        @if (loading()) {
          <p class="ui-sr-only" role="status">Loading team members…</p>
          @for (row of [1, 2, 3]; track row) {
            <div class="card">
              <ui-skeleton shape="circle" width="2.5rem" />
              <ui-skeleton [lines]="2" width="12rem" />
            </div>
          }
        } @else {
          @for (member of members; track member.name) {
            <div class="card">
              <span class="initials" aria-hidden="true">{{ member.initials }}</span>
              <div>
                <div>{{ member.name }}</div>
                <div class="docs-muted">{{ member.role }}</div>
              </div>
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: `
    .heading {
      margin: 0 0 0.5rem;
      font-size: var(--ui-font-size-md);
    }
    .card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-height: 3.5rem;
      padding: 0.5rem 0;
    }
    .initials {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--ui-color-primary-subtle);
      color: var(--ui-color-primary-text);
      font-weight: 600;
    }
  `,
})
export class SkeletonCardsExample {
  protected readonly loading = signal(true);
  protected readonly members: Member[] = [
    { name: 'Ada Lovelace', role: 'Engineering lead', initials: 'AL' },
    { name: 'Grace Hopper', role: 'Compiler team', initials: 'GH' },
    { name: 'Alan Turing', role: 'Research', initials: 'AT' },
  ];
}
