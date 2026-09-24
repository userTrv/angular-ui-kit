import { ConnectedPosition } from '@angular/cdk/overlay';

/** Side of the trigger the tooltip prefers. `start`/`end` follow the text direction. */
export type UiTooltipPosition = 'top' | 'bottom' | 'start' | 'end';

const TOP: ConnectedPosition = { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' };
const BOTTOM: ConnectedPosition = { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' };
const START: ConnectedPosition = { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' };
const END: ConnectedPosition = { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' };

/** Preferred position first, then the opposite side (flip), then the other axis. */
export function tooltipPositions(position: UiTooltipPosition): ConnectedPosition[] {
  switch (position) {
    case 'bottom':
      return [BOTTOM, TOP, END, START];
    case 'start':
      return [START, END, TOP, BOTTOM];
    case 'end':
      return [END, START, TOP, BOTTOM];
    default:
      return [TOP, BOTTOM, END, START];
  }
}
