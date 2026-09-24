import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ElementRef, Signal, afterRenderEffect, signal } from '@angular/core';

/** Row height used until the `--ui-row-height` probe can be measured (jsdom, SSR). */
export const UI_TABLE_FALLBACK_ROW_HEIGHT = 44;

/** Live layout measurements the table needs for virtual scrolling and PageUp/PageDown. */
export interface UiTableMetrics {
  /** Rendered height of `--ui-row-height` in px, or `null` before it can be measured. */
  readonly rowHeight: Signal<number | null>;
  /** Client height of the scroll container in px (0 until measured). */
  readonly viewportHeight: Signal<number>;
}

/**
 * Measures the row height token through a probe element (`height: var(--ui-row-height)`) and the
 * scroll container, and keeps both current with a ResizeObserver: switching density at runtime
 * changes the probe's height, which updates the virtual scroll `itemSize`. It also tells the CDK
 * viewport to re-measure when the container is resized (the CDK only listens to window resizes).
 */
export function trackTableMetrics(
  probe: Signal<ElementRef<HTMLElement> | undefined>,
  scroller: Signal<ElementRef<HTMLElement> | undefined>,
  viewport: Signal<CdkVirtualScrollViewport | undefined>,
): UiTableMetrics {
  const rowHeight = signal<number | null>(null);
  const viewportHeight = signal(0);

  afterRenderEffect((onCleanup) => {
    const probeEl = probe()?.nativeElement;
    const scrollerEl = scroller()?.nativeElement;
    const vp = viewport();
    if (!probeEl || !scrollerEl) return;

    const measure = () => {
      const height = probeEl.getBoundingClientRect().height;
      rowHeight.set(height > 0 ? height : null);
      viewportHeight.set(scrollerEl.clientHeight);
      vp?.checkViewportSize();
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(probeEl);
    observer.observe(scrollerEl);
    onCleanup(() => observer.disconnect());
  });

  return { rowHeight, viewportHeight };
}
