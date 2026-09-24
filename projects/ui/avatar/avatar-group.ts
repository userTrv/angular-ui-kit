import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  contentChildren,
  input,
  numberAttribute,
} from '@angular/core';
import { UI_AVATAR_GROUP, UiAvatar, UiAvatarGroupRef, UiAvatarSize } from './avatar';

/**
 * Overlapping stack of `ui-avatar`s (`role="group"`). Shows at most `max` avatars followed by a
 * "+3" counter; hidden avatars are removed from the accessibility tree and the counter is announced
 * as "3 more". Give the group a name that states what the people are, e.g. "Assignees".
 */
@Component({
  selector: 'ui-avatar-group',
  template: `
    <ng-content />
    @if (overflow() > 0) {
      <span class="ui-avatar ui-avatar--{{ size() }} ui-avatar-group__overflow" role="img" [attr.aria-label]="overflow() + ' more'">
        <span aria-hidden="true">+{{ overflow() }}</span>
      </span>
    }
  `,
  styleUrl: './avatar.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_AVATAR_GROUP, useExisting: UiAvatarGroup }],
  host: {
    class: 'ui-avatar-group',
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
  },
})
export class UiAvatarGroup implements UiAvatarGroupRef {
  private readonly avatars = contentChildren(UiAvatar);

  /** Maximum number of avatars to show before the "+N" counter. */
  readonly max = input(4, { transform: numberAttribute });
  /** Size applied to every avatar that does not set its own. */
  readonly size = input<UiAvatarSize>('md');
  /** Accessible name of the group, e.g. "Assignees". */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  private readonly visibleCount = computed(() => {
    return Math.min(this.avatars().length, Math.max(1, Math.floor(this.max())));
  });

  /** Number of avatars hidden behind the counter. */
  readonly overflow = computed(() => this.avatars().length - this.visibleCount());

  /** @internal */
  isHidden(avatar: UiAvatar): boolean {
    return this.avatars().indexOf(avatar) >= this.visibleCount();
  }
}
