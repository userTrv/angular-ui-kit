import { defineDoc } from '../../../core/doc-model';
import { SkeletonCardsExample } from './examples/skeleton-cards.example';
import { SkeletonShapesExample } from './examples/skeleton-shapes.example';

export const doc = defineDoc({
  slug: 'skeleton',
  name: 'Skeleton',
  category: 'Feedback',
  summary: 'Loading placeholders shaped like the content, with a shimmer that stops under reduced motion and a busy-region helper.',
  entryPoint: '@usertrv/ui/skeleton',
  api: ['UiSkeleton', 'UiBusy', 'UiSkeletonShape'],
  examples: [
    {
      title: 'Loading a list',
      component: SkeletonCardsExample,
      file: 'skeleton-cards.example.ts',
      description: 'The region gets `aria-busy` through `[uiBusy]` while loading; a visually hidden status says what is loading. Toggle to see the loaded state.',
    },
    {
      title: 'Shapes',
      component: SkeletonShapesExample,
      file: 'skeleton-shapes.example.ts',
      description: '`text` (with `lines`), `circle` and `rect`, sized with `width` / `height`. `[animated]="false"` renders a static block.',
    },
  ],
  a11y: [
    'Skeletons are `aria-hidden="true"`: placeholders mean nothing to a screen reader. Describe the wait in text instead, e.g. a visually hidden “Loading team members…” status.',
    'Mark the loading container with `[uiBusy]="loading()"` (sets `aria-busy="true"`), so assistive tech can wait for the final content instead of reading it half-rendered.',
    'The shimmer layer is removed entirely under `prefers-reduced-motion: reduce` — not just set to a zero duration — so nothing animates or repaints.',
    'Keep skeletons close to the real layout to avoid a jump when content arrives; for waits under ~300 ms show nothing at all.',
    'In forced-colors mode placeholders get a `GrayText` outline, since their background colour is overridden.',
  ],
});
