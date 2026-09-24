import type { DialogRef } from '@angular/cdk/dialog';
import { Observable, Subject, firstValueFrom } from 'rxjs';

/** The part of the CDK ref this class uses, typed so UiDialogRef<R> stays assignable to UiDialogRef<unknown>. */
type CdkRefHandle = Pick<DialogRef<unknown, unknown>, 'id' | 'componentInstance' | 'disableClose' | 'keydownEvents' | 'backdropClick'> & {
  close(result?: unknown): void;
};

/**
 * Handle to an open dialog or drawer. Injectable inside the dialog content
 * (`inject(UiDialogRef<Result>)`) and returned by `UiDialog.open()`.
 *
 * `R` is the result type passed to `close()`, `C` the content component type.
 */
export class UiDialogRef<R = unknown, C = unknown> {
  private readonly closedSubject = new Subject<unknown>();

  /**
   * Emits the result once, after the dialog is removed, the background is interactive again
   * and focus has been restored. `undefined` when dismissed with Escape or the backdrop.
   */
  readonly closed = this.closedSubject.asObservable() as Observable<R | undefined>;

  /** The same result as `closed`, as a promise. */
  readonly result: Promise<R | undefined> = firstValueFrom(this.closed, { defaultValue: undefined });

  /** @internal */
  constructor(private readonly cdkRef: CdkRefHandle) {}

  /** Unique dialog id (also the id of the dialog surface element). */
  get id(): string {
    return this.cdkRef.id;
  }

  /** Instance of the content component; `null` for template dialogs or after close. */
  get componentInstance(): C | null {
    return this.cdkRef.componentInstance as C | null;
  }

  /** Whether Escape and backdrop clicks are ignored. Can be toggled while open (e.g. during a save). */
  get disableClose(): boolean {
    return !!this.cdkRef.disableClose;
  }
  set disableClose(value: boolean) {
    this.cdkRef.disableClose = value;
  }

  /** Emits keydown events that happen while this dialog is the topmost overlay. */
  get keydownEvents(): Observable<KeyboardEvent> {
    return this.cdkRef.keydownEvents;
  }

  /** Emits when the backdrop is clicked, also when `disableClose` prevents closing. */
  get backdropClick(): Observable<MouseEvent> {
    return this.cdkRef.backdropClick;
  }

  /** Closes the dialog with an optional result. */
  close(result?: R): void {
    this.cdkRef.close(result);
  }

  /** @internal Called by UiDialog after cleanup, so subscribers observe a settled page. */
  _finishClose(result: unknown): void {
    this.closedSubject.next(result);
    this.closedSubject.complete();
  }
}
