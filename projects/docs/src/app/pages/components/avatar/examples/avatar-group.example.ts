import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAvatar, UiAvatarGroup } from '@usertrv/ui/avatar';

@Component({
  selector: 'docs-avatar-group-example',
  imports: [UiAvatar, UiAvatarGroup],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <div class="docs-row">
        <ui-avatar-group aria-label="Reviewers" [max]="4">
          @for (person of reviewers; track person) {
            <ui-avatar [name]="person" />
          }
        </ui-avatar-group>
        <span class="docs-muted">{{ reviewers.length }} reviewers</span>
      </div>
      <ui-avatar-group aria-label="Assignees" size="sm" [max]="3">
        <ui-avatar name="Kirill Levin" />
        <ui-avatar name="Grace Hopper" />
      </ui-avatar-group>
    </div>
  `,
})
export class AvatarGroupExample {
  protected readonly reviewers = [
    'Ada Lovelace',
    'Grace Hopper',
    'Alan Turing',
    'Radia Perlman',
    'Ken Thompson',
    'Barbara Liskov',
    'Margaret Hamilton',
  ];
}
