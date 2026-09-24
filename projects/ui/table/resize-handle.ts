import { Directionality } from '@angular/cdk/bidi';
import {
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
  output,
  signal,
} from '@angular/core';

/**
 * Column resize handle: a focusable `role="separator"` (WAI-ARIA window-splitter semantics) that
 * reports a new width while dragged with a pointer or moved with the keyboard. ArrowLeft / ArrowRight
 * change the width by `step` px, with Shift by `largeStep` px (mirrored in right-to-left layouts).
 *
 * The directive is controlled: it never sizes anything itself, it only emits `uiColumnResizeChange`
 * with the clamped width; the owner applies it and feeds it back through `uiColumnResize`.
 */
@Directive({
  selector: '[uiColumnResize]',
  exportAs: 'uiColumnResize',
  host: {
    role: 'separator',
    'aria-orientation': 'vertical',
    '[attr.aria-valuenow]': 'width()',
    '[attr.aria-valuemin]': 'min()',
    '[attr.aria-valuemax]': 'max()',
    '[class.ui-table__resize--dragging]': 'dragging()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'endDrag($event)',
    '(pointercancel)': 'endDrag($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiColumnResize {
  /** Current width in px (`aria-valuenow`). */
  readonly width = input.required({ alias: 'uiColumnResize', transform: numberAttribute });
  /** Minimum width in px. */
  readonly min = input(48, { alias: 'uiColumnResizeMin', transform: numberAttribute });
  /** Maximum width in px. */
  readonly max = input(1200, { alias: 'uiColumnResizeMax', transform: numberAttribute });
  /** Arrow key step in px. */
  readonly step = input(10, { alias: 'uiColumnResizeStep', transform: numberAttribute });
  /** Shift + arrow key step in px. */
  readonly largeStep = input(50, { alias: 'uiColumnResizeLargeStep', transform: numberAttribute });
  /** Emits the requested width (already clamped to min/max). */
  // eslint-disable-next-line @angular-eslint/no-output-rename -- prefixed like the inputs to avoid collisions on shared hosts
  readonly resized = output<number>({ alias: 'uiColumnResizeChange' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly dir = inject(Directionality, { optional: true });
  protected readonly dragging = signal(false);
  private drag: { pointerId: number; startX: number; startWidth: number } | null = null;

  private get sign(): number {
    return this.dir?.value === 'rtl' ? -1 : 1;
  }

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    // preventDefault stops text selection while dragging; focus the handle explicitly instead.
    event.preventDefault();
    this.element.focus();
    this.drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: this.width() };
    this.element.setPointerCapture?.(event.pointerId);
    this.dragging.set(true);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    this.emit(this.drag.startWidth + (event.clientX - this.drag.startX) * this.sign);
  }

  protected endDrag(event: PointerEvent): void {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    if (this.element.hasPointerCapture?.(event.pointerId))
      this.element.releasePointerCapture(event.pointerId);
    this.drag = null;
    this.dragging.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const step = event.shiftKey ? this.largeStep() : this.step();
    const direction = (event.key === 'ArrowRight' ? 1 : -1) * this.sign;
    // preventDefault also tells an enclosing uiGrid that the arrow key is taken.
    event.preventDefault();
    this.emit(this.width() + direction * step);
  }

  private emit(width: number): void {
    const clamped = Math.round(Math.max(this.min(), Math.min(this.max(), width)));
    if (clamped !== this.width()) this.resized.emit(clamped);
  }
}
