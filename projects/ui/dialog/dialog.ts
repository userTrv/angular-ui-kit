import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { PositionStrategy } from '@angular/cdk/overlay';
import { _getFocusedElementPierceShadowDom } from '@angular/cdk/platform';
import { ComponentType } from '@angular/cdk/portal';
import { DOCUMENT, Injectable, Injector, Signal, TemplateRef, inject, runInInjectionContext, signal } from '@angular/core';
import { injectId } from '@usertrv/ui/a11y';
import { UiConfirmDialog, UiConfirmDialogData, UiConfirmOptions } from './confirm-dialog';
import { UI_DIALOG_DATA, UiDialogConfig } from './dialog-config';
import { UiDialogContainer } from './dialog-container';
import { UiDialogRef } from './dialog-ref';
import { UiModalStack } from './modal-stack';

/** Context of a template opened with `UiDialog.open(templateRef)`. */
export interface UiDialogTemplateContext<D = unknown, R = unknown> {
  /** `config.data`. */
  $implicit: D;
  /** Reference to the dialog rendering the template. */
  dialogRef: UiDialogRef<R>;
}

/**
 * Surface preset used by `UiDialog` (centered) and `UiDrawer` (side sheet).
 * @internal
 */
export interface UiModalSurface {
  panelClass: string[];
  positionStrategy?: PositionStrategy;
}

/**
 * Opens modal dialogs on top of `@angular/cdk/dialog`.
 *
 * CDK provides the focus trap, initial focus, Escape handling for the topmost dialog only, and
 * `aria-hidden` on the page. This service adds the styled surface, `aria-modal="true"`, a typed
 * `UiDialogRef`, `inert` on everything behind the top dialog (stack-aware), and focus restoration
 * that runs after the background is interactive again.
 */
@Injectable({ providedIn: 'root' })
export class UiDialog {
  private readonly cdkDialog = inject(Dialog);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly focusMonitor = inject(FocusMonitor);
  private readonly modalStack = inject(UiModalStack);
  private readonly open$ = signal<readonly UiDialogRef<unknown, unknown>[]>([]);

  /** Currently open dialogs and drawers, bottom to top. */
  readonly openDialogs: Signal<readonly UiDialogRef<unknown, unknown>[]> = this.open$.asReadonly();

  /**
   * Opens a component or template in a modal dialog.
   * @param content Component class or `TemplateRef` (context: `UiDialogTemplateContext`).
   * @param config Size, role, data, focus and labelling options.
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: ComponentType<C> | TemplateRef<UiDialogTemplateContext<D, R>>,
    config: UiDialogConfig<D> = {},
  ): UiDialogRef<R, C> {
    const size = config.size ?? 'md';
    return this._openSurface<R, D, C>(content, config, {
      panelClass: ['ui-dialog-pane', `ui-dialog-pane--${size}`],
    });
  }

  /**
   * Asks for confirmation in an `alertdialog`. Resolves `true` only when the confirm button is used;
   * Escape, the backdrop and Cancel resolve `false`. Initial focus is on Cancel, the least destructive action.
   */
  confirm(options: UiConfirmOptions): Promise<boolean> {
    const messageId = runInInjectionContext(this.injector, () => injectId('ui-confirm-message'));
    const ref = this.open<boolean, UiConfirmDialogData, UiConfirmDialog>(UiConfirmDialog, {
      size: 'sm',
      role: 'alertdialog',
      data: { ...options, messageId },
      ariaDescribedBy: messageId,
      autoFocus: '[data-ui-confirm-cancel]',
    });
    return ref.result.then((result) => result === true);
  }

  /** Closes every open dialog, top first. */
  closeAll(): void {
    for (const ref of [...this.open$()].reverse()) ref.close();
  }

  /** @internal Shared by UiDialog and UiDrawer. */
  _openSurface<R, D, C>(
    content: ComponentType<C> | TemplateRef<UiDialogTemplateContext<D, R>>,
    config: UiDialogConfig<D>,
    surface: UiModalSurface,
  ): UiDialogRef<R, C> {
    const opener = _getFocusedElementPierceShadowDom();
    let uiRef: UiDialogRef<R, C> | undefined;

    const cdkConfig: DialogConfig<D, DialogRef<R, C>> = {
      id: config.id,
      data: config.data,
      role: config.role ?? 'dialog',
      ariaModal: true,
      ariaLabel: config.ariaLabel ?? null,
      ariaLabelledBy: config.ariaLabelledBy ?? null,
      ariaDescribedBy: config.ariaDescribedBy ?? null,
      disableClose: config.disableClose ?? false,
      hasBackdrop: config.hasBackdrop ?? true,
      backdropClass: 'ui-backdrop',
      panelClass: ['ui-overlay-pane', ...surface.panelClass, ...toArray(config.panelClass)],
      positionStrategy: surface.positionStrategy,
      autoFocus: config.autoFocus ?? 'first-tabbable',
      // Restored by us after `inert` is lifted: CDK restores in ngOnDestroy, while the page is still inert.
      restoreFocus: false,
      closeOnNavigation: config.closeOnNavigation ?? true,
      viewContainerRef: config.viewContainerRef,
      injector: config.injector,
      container: UiDialogContainer,
      providers: (cdkRef: DialogRef<R, C>) => {
        uiRef = new UiDialogRef<R, C>(cdkRef);
        return [
          { provide: UiDialogRef, useValue: uiRef },
          { provide: UI_DIALOG_DATA, useValue: config.data },
        ];
      },
      templateContext: () => ({ $implicit: config.data, dialogRef: uiRef }),
    };

    const cdkRef = this.cdkDialog.open<R, D, C>(content as ComponentType<C>, cdkConfig);
    const ref = uiRef as UiDialogRef<R, C>;
    const host = cdkRef.overlayRef.hostElement;
    this.modalStack.push(host);
    this.open$.update((list) => [...list, ref]);

    cdkRef.closed.subscribe((result) => {
      const origin = cdkRef.containerInstance?._closeInteractionType ?? 'program';
      this.modalStack.remove(host);
      this.open$.update((list) => list.filter((r) => r !== ref));
      this.restoreFocus(config.restoreFocus ?? true, opener, origin);
      ref._finishClose(result);
    });
    return ref;
  }

  private restoreFocus(target: boolean | string | HTMLElement, opener: HTMLElement | null, origin: FocusOrigin): void {
    let element: HTMLElement | null = null;
    if (target === true) element = opener;
    else if (typeof target === 'string') element = this.document.querySelector<HTMLElement>(target);
    else if (target instanceof HTMLElement) element = target;
    if (!element?.isConnected) return;

    // Only move focus if it was lost with the dialog; never steal it from where the app put it.
    const active = _getFocusedElementPierceShadowDom();
    if (active && active !== this.document.body) return;
    this.focusMonitor.focusVia(element, origin);
  }
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
