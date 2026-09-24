import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  booleanAttribute,
  contentChild,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';

/**
 * Rich tab label: `<ng-template uiTabLabel>…</ng-template>` inside a `ui-tab`, used instead of the
 * `label` input when the label needs an icon or a counter.
 */
@Directive({ selector: 'ng-template[uiTabLabel]' })
export class UiTabLabel {
  /** @internal */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * Lazy tab content: `<ng-template uiTabContent>…</ng-template>` inside a `ui-tab` is only
 * instantiated while its tab is selected (and destroyed when another tab is selected).
 * Content projected directly into `ui-tab` is created eagerly and kept alive while hidden.
 */
@Directive({ selector: 'ng-template[uiTabContent]' })
export class UiTabContent {
  /** @internal */
  readonly template = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * One tab of a `ui-tab-group`. It renders nothing by itself: the group renders the tab button
 * and the tab panel, and stamps this tab's content into the panel.
 */
@Component({
  selector: 'ui-tab',
  template: '<ng-template><ng-content /></ng-template>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiTab {
  /** Plain-text label. Use `<ng-template uiTabLabel>` for a rich label. */
  readonly label = input('');
  /** Disabled tabs are skipped by arrow keys, cannot be selected and expose `aria-disabled`. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** @internal */
  readonly labelTemplate = contentChild(UiTabLabel);
  /** @internal */
  readonly lazyContent = contentChild(UiTabContent);
  /** @internal */
  readonly eagerContent = viewChild.required(TemplateRef);
  /** @internal */
  readonly tabId = injectId('ui-tab');
  /** @internal */
  readonly panelId = injectId('ui-tab-panel');
}
