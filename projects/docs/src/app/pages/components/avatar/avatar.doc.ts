import { defineDoc } from '../../../core/doc-model';
import { AvatarBasicExample } from './examples/avatar-basic.example';
import { AvatarGroupExample } from './examples/avatar-group.example';

export const doc = defineDoc({
  slug: 'avatar',
  name: 'Avatar',
  category: 'Data display',
  summary: 'User pictures with initials fallback, deterministic token colours, presence status and overflowing groups.',
  entryPoint: '@usertrv/ui/avatar',
  api: [
    'UiAvatar',
    'UiAvatarGroup',
    'UiAvatarSize',
    'UiAvatarStatus',
    'initialsFrom',
    'avatarColorIndex',
    'UI_AVATAR_PALETTE',
    'UiAvatarColor',
  ],
  examples: [
    {
      title: 'Sizes, fallback and status',
      component: AvatarBasicExample,
      file: 'avatar-basic.example.ts',
      description: 'Without `src`, or when the image fails, the avatar shows initials on a colour picked from the name — the same person always gets the same colour. Status dots differ in shape, not only colour.',
    },
    {
      title: 'Group',
      component: AvatarGroupExample,
      file: 'avatar-group.example.ts',
      description: '`max` limits the visible avatars; the rest collapse into a “+3” counter announced as “3 more”.',
    },
  ],
  a11y: [
    'Each avatar is one image (`role="img"`) named after the person, with the status appended: “Kirill Levin, online”. The inner `<img>` has an empty `alt` and the initials are `aria-hidden`, so nothing is read twice.',
    'Set `decorative` when the name is printed next to the avatar: it is then hidden from assistive tech.',
    'Status is never colour-only: online is a filled dot, away a crescent, busy a bar, offline a hollow ring. Override the spoken words with `statusLabel`.',
    'Initials colours come from “subtle background + text” token pairs; a unit test checks each pair against WCAG AA (4.5:1) in the light, dark and high-contrast themes.',
    'In a group, avatars beyond `max` are `hidden` (out of the accessibility tree); name the group with `aria-label` (“Reviewers”).',
    'Not included: a popover listing the hidden people, and click/link behaviour (wrap the avatar in your own link or button with an accessible name).',
  ],
});
