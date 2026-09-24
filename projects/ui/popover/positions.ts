import { ConnectedPosition } from '@angular/cdk/overlay';

/** Side of the trigger the popover opens on. `start`/`end` follow the text direction. */
export type UiPopoverPosition = 'top' | 'bottom' | 'start' | 'end';

const pos = (
  originX: ConnectedPosition['originX'],
  originY: ConnectedPosition['originY'],
  overlayX: ConnectedPosition['overlayX'],
  overlayY: ConnectedPosition['overlayY'],
): ConnectedPosition => ({ originX, originY, overlayX, overlayY });

const BELOW = [pos('start', 'bottom', 'start', 'top'), pos('end', 'bottom', 'end', 'top')];
const ABOVE = [pos('start', 'top', 'start', 'bottom'), pos('end', 'top', 'end', 'bottom')];
// Side placements swap the vertical gap for a horizontal one (see popover.css).
const side = (p: ConnectedPosition): ConnectedPosition => ({ ...p, panelClass: 'ui-popover-pane--horizontal' });
const BEFORE = [side(pos('start', 'top', 'end', 'top')), side(pos('start', 'bottom', 'end', 'bottom'))];
const AFTER = [side(pos('end', 'top', 'start', 'top')), side(pos('end', 'bottom', 'start', 'bottom'))];

/** Preferred side (start- then end-aligned), then the opposite side as the flip fallback. */
export function popoverPositions(position: UiPopoverPosition): ConnectedPosition[] {
  switch (position) {
    case 'top':
      return [...ABOVE, ...BELOW];
    case 'start':
      return [...BEFORE, ...AFTER, ...BELOW];
    case 'end':
      return [...AFTER, ...BEFORE, ...BELOW];
    default:
      return [...BELOW, ...ABOVE];
  }
}
