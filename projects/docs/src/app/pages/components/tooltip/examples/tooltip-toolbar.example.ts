import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiButton } from '@usertrv/ui/button';
import { UiTooltip } from '@usertrv/ui/tooltip';

@Component({
  selector: 'docs-tooltip-toolbar-example',
  imports: [UiButton, UiTooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="docs-row" role="toolbar" aria-label="Formatting">
      <button uiIconButton variant="ghost" aria-label="Bold" uiTooltip="Bold (Ctrl+B)" aria-keyshortcuts="Control+B">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6 3h5a4 4 0 0 1 2.7 7A4 4 0 0 1 12 17H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm1 2v4h4a2 2 0 1 0 0-4H7Zm0 6v4h5a2 2 0 1 0 0-4H7Z" /></svg>
      </button>
      <button uiIconButton variant="ghost" aria-label="Italic" uiTooltip="Italic (Ctrl+I)" aria-keyshortcuts="Control+I">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M8 3h7a1 1 0 1 1 0 2h-2.3l-3.4 10H12a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2h2.3l3.4-10H8a1 1 0 0 1 0-2Z" /></svg>
      </button>
      <button uiIconButton variant="ghost" aria-label="Insert link" uiTooltip="Insert link (Ctrl+K)" aria-keyshortcuts="Control+K">
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M11.3 4.3a3.5 3.5 0 0 1 5 5l-2 2a3.5 3.5 0 0 1-5 0 1 1 0 0 1 1.4-1.4 1.5 1.5 0 0 0 2.2 0l2-2a1.5 1.5 0 0 0-2.2-2.2l-.5.5a1 1 0 0 1-1.4-1.4l.5-.5Zm-4 4a3.5 3.5 0 0 1 5 0 1 1 0 0 1-1.4 1.4 1.5 1.5 0 0 0-2.2 0l-2 2a1.5 1.5 0 0 0 2.2 2.2l.5-.5a1 1 0 0 1 1.4 1.4l-.5.5a3.5 3.5 0 0 1-5-5l2-2Z" /></svg>
      </button>
      <button uiButton size="sm" uiTooltip="Visible to everyone with the link" uiTooltipPosition="bottom">Publish</button>
    </div>
  `,
})
export class TooltipToolbarExample {}
