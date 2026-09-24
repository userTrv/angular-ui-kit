import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Signal,
  ViewEncapsulation,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { UI_AVATAR_PALETTE, avatarColorIndex, initialsFrom } from './avatar-utils';

/** Avatar diameter. */
export type UiAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Presence status shown as a dot; each status also has a distinct shape, not only a colour. */
export type UiAvatarStatus = 'online' | 'away' | 'busy' | 'offline';

const STATUS_LABELS: Record<UiAvatarStatus, string> = {
  online: 'online',
  away: 'away',
  busy: 'busy',
  offline: 'offline',
};

/** @internal Contract between an avatar and the `ui-avatar-group` it sits in. */
export interface UiAvatarGroupRef {
  readonly size: Signal<UiAvatarSize | undefined>;
  isHidden(avatar: UiAvatar): boolean;
}

/** @internal */
export const UI_AVATAR_GROUP = new InjectionToken<UiAvatarGroupRef>('UI_AVATAR_GROUP');

/**
 * A user picture with a fallback to initials (when `src` is missing or fails to load). The
 * initials background is picked deterministically from the name out of a token-based palette.
 * Exposed as one image (`role="img"`) named after the person and their status; set `decorative`
 * when the name is already visible next to it.
 */
@Component({
  selector: 'ui-avatar',
  template: `
    @if (src() && !imageFailed()) {
      <img class="ui-avatar__image" [src]="src()" alt="" (error)="imageFailed.set(true)" />
    } @else if (initials()) {
      <span class="ui-avatar__initials" aria-hidden="true">{{ initials() }}</span>
    } @else {
      <svg class="ui-avatar__placeholder" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 7a6 6 0 0 1 12 0 1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      </svg>
    }
    @if (status(); as status) {
      <span class="ui-avatar__status ui-avatar__status--{{ status }}" aria-hidden="true"></span>
    }
  `,
  styleUrl: './avatar.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"ui-avatar ui-avatar--" + effectiveSize()',
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : accessibleName()',
    '[attr.aria-hidden]': 'decorative() || null',
    '[attr.hidden]': 'hiddenByGroup() || null',
    '[style.--_avatar-bg]': 'colors().background',
    '[style.--_avatar-fg]': 'colors().foreground',
  },
})
export class UiAvatar {
  private readonly group = inject(UI_AVATAR_GROUP, { optional: true });

  /** Full name: the accessible name, the source of the initials and of the colour. */
  readonly name = input('');
  /** Image URL. Falls back to initials when empty or when the image fails to load. */
  readonly src = input<string | null | undefined>(undefined);
  /** Diameter; inside a `ui-avatar-group` defaults to the group's size. */
  readonly size = input<UiAvatarSize | undefined>(undefined);
  /** Presence status dot. Its label is appended to the accessible name ("Ada Lovelace, online"). */
  readonly status = input<UiAvatarStatus | null | undefined>(undefined);
  /** Overrides the default English status label, e.g. `"в сети"`. */
  readonly statusLabel = input<string | undefined>(undefined);
  /** Hides the avatar from assistive tech when the name is already visible next to it. */
  readonly decorative = input(false, { transform: booleanAttribute });

  /** Resets whenever `src` changes, so a new URL gets a fresh attempt. */
  protected readonly imageFailed = linkedSignal({ source: this.src, computation: () => false });

  protected readonly initials = computed(() => initialsFrom(this.name()));
  protected readonly effectiveSize = computed(() => this.size() ?? this.group?.size() ?? 'md');
  protected readonly hiddenByGroup = computed(() => this.group?.isHidden(this) ?? false);

  protected readonly colors = computed(() => {
    const pair = UI_AVATAR_PALETTE[avatarColorIndex(this.name())];
    return { background: `var(--ui-${pair.background})`, foreground: `var(--ui-${pair.foreground})` };
  });

  protected readonly accessibleName = computed(() => {
    const status = this.status();
    const name = this.name().trim() || 'Unknown user';
    if (!status) return name;
    return `${name}, ${this.statusLabel() ?? STATUS_LABELS[status]}`;
  });
}
