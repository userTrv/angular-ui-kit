import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiAvatar } from '@usertrv/ui/avatar';

// A self-contained "photo" so the example works offline.
const PHOTO =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#8183f8"/><stop offset="1" stop-color="#00aef1"/></linearGradient></defs><rect width="64" height="64" fill="url(#g)"/><circle cx="32" cy="26" r="11" fill="#fff" opacity=".9"/><path d="M12 60c2-12 10-18 20-18s18 6 20 18z" fill="#fff" opacity=".9"/></svg>',
  );

@Component({
  selector: 'docs-avatar-basic-example',
  imports: [UiAvatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-stack">
      <div class="docs-row">
        <ui-avatar name="Ada Lovelace" size="xs" />
        <ui-avatar name="Grace Hopper" size="sm" />
        <ui-avatar name="Alan Turing" />
        <ui-avatar name="Radia Perlman" size="lg" />
        <ui-avatar name="Barbara Liskov" size="xl" />
      </div>
      <div class="docs-row">
        <ui-avatar name="Kirill Levin" [src]="photo" status="online" size="lg" />
        <ui-avatar name="Ken Thompson" [src]="brokenPhoto" status="away" size="lg" />
        <ui-avatar name="Margaret Hamilton" status="busy" size="lg" />
        <ui-avatar name="Dennis Ritchie" status="offline" size="lg" />
        <ui-avatar size="lg" />
      </div>
      <p class="docs-row">
        <ui-avatar name="Tim Berners-Lee" size="sm" decorative />
        <span>Tim Berners-Lee <span class="docs-muted">commented 2 hours ago</span></span>
      </p>
    </div>
  `,
})
export class AvatarBasicExample {
  protected readonly photo = PHOTO;
  /** Fails to decode, so the avatar falls back to initials. */
  protected readonly brokenPhoto = 'data:image/png;base64,broken';
}
