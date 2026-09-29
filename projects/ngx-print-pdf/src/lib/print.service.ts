import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { DEFAULT_PRINT_OPTIONS, PrintOptions } from './print-options';

const PRINT_ROOT_ID = 'ngxpp-print-root';
const PRINT_STYLE_ID = 'ngxpp-print-style';
const NO_PRINT_ATTR = 'ngxppNoPrint';
const NO_PRINT_SELECTOR = `[${NO_PRINT_ATTR}], .ngxpp-no-print`;

/**
 * Prints (or "saves as PDF" via the browser's native print dialog) an on-screen
 * element exactly as it renders today, computed styles included, using the
 * browser's own print engine rather than re-rendering the layout.
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly document = inject(DOCUMENT);
  private printing = false;

  /**
   * Print the given element (or the element behind a CSS selector).
   * Resolves once the print dialog has been dismissed (best-effort: browsers
   * fire `afterprint` reliably on Chrome/Firefox/Edge/Safari).
   */
  async print(target: HTMLElement | string, options: PrintOptions = {}): Promise<void> {
    if (this.printing) {
      throw new Error('ngx-print-pdf: a print operation is already in progress.');
    }

    const sourceEl = this.resolveTarget(target);
    if (!sourceEl) {
      throw new Error('ngx-print-pdf: print target could not be resolved.');
    }

    const opts = { ...DEFAULT_PRINT_OPTIONS, ...options };
    this.printing = true;

    const previousTitle = this.document.title;
    const win = sourceEl.ownerDocument.defaultView ?? window;

    const printRoot = this.buildPrintRoot(sourceEl, opts);
    const styleEl = this.buildPrintStyles(opts);

    this.document.body.appendChild(styleEl);
    this.document.body.appendChild(printRoot);

    if (opts.title) {
      this.document.title = opts.title;
    }

    try {
      if (opts.waitForImages) {
        await this.waitForImages(printRoot);
      }
      if (opts.settleDelayMs > 0) {
        await this.delay(opts.settleDelayMs);
      }
      await this.invokePrint(win);
    } finally {
      printRoot.remove();
      styleEl.remove();
      this.document.title = previousTitle;
      this.printing = false;
    }
  }

  private resolveTarget(target: HTMLElement | string): HTMLElement | null {
    if (typeof target === 'string') {
      return this.document.querySelector<HTMLElement>(target);
    }
    return target;
  }

  /** Deep-clones the target so the live app DOM/state is never touched. */
  private buildPrintRoot(sourceEl: HTMLElement, opts: PrintOptions): HTMLElement {
    const root = this.document.createElement('div');
    root.id = PRINT_ROOT_ID;

    const clone = sourceEl.cloneNode(true) as HTMLElement;
    this.inlineComputedStyles(sourceEl, clone);
    this.applyExclusions(clone, opts.excludeSelectors ?? []);
    this.syncFormValues(sourceEl, clone);

    root.appendChild(clone);
    return root;
  }

  /**
   * Walks the source/clone in lockstep, copying computed styles onto the
   * clone inline. This is what makes the printed output match "what you see
   * on screen" instead of relying on print media queries reinterpreting the
   * app's own stylesheets (which may not apply the same way to a detached clone).
   */
  private inlineComputedStyles(source: Element, clone: Element): void {
    const computed = getComputedStyle(source);
    let cssText = '';
    for (let i = 0; i < computed.length; i++) {
      const prop = computed.item(i);
      cssText += `${prop}:${computed.getPropertyValue(prop)};`;
    }
    (clone as HTMLElement).style.cssText = cssText;

    const sourceChildren = Array.from(source.children);
    const cloneChildren = Array.from(clone.children);
    for (let i = 0; i < sourceChildren.length; i++) {
      this.inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
    }
  }

  private applyExclusions(clone: HTMLElement, extraSelectors: string[]): void {
    const selector = [NO_PRINT_SELECTOR, ...extraSelectors].join(', ');
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  }

  /**
   * cloneNode does not copy live form control values/checked state into the
   * clone's attributes, so inputs/selects/textareas would print blank.
   */
  private syncFormValues(source: HTMLElement, clone: HTMLElement): void {
    const sourceControls = source.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    );
    const cloneControls = clone.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      'input, textarea, select',
    );

    sourceControls.forEach((sourceControl, i) => {
      const cloneControl = cloneControls[i];
      if (!cloneControl) {
        return;
      }
      if (sourceControl instanceof HTMLInputElement && cloneControl instanceof HTMLInputElement) {
        if (sourceControl.type === 'checkbox' || sourceControl.type === 'radio') {
          cloneControl.checked = sourceControl.checked;
        } else {
          cloneControl.setAttribute('value', sourceControl.value);
          cloneControl.value = sourceControl.value;
        }
      } else if (sourceControl instanceof HTMLTextAreaElement) {
        cloneControl.textContent = sourceControl.value;
      } else if (sourceControl instanceof HTMLSelectElement && cloneControl instanceof HTMLSelectElement) {
        cloneControl.value = sourceControl.value;
      }
    });
  }

  private buildPrintStyles(opts: PrintOptions): HTMLStyleElement {
    const style = this.document.createElement('style');
    style.id = PRINT_STYLE_ID;

    const size =
      opts.pageSize === 'auto'
        ? ''
        : `${opts.pageSize}${opts.orientation === 'landscape' ? ' landscape' : ''}`;
    const margin = opts.margin ?? {};

    style.textContent = `
      @media print {
        @page {
          ${size ? `size: ${size};` : ''}
          margin: ${margin.top ?? '10mm'} ${margin.right ?? '10mm'} ${margin.bottom ?? '10mm'} ${margin.left ?? '10mm'};
        }

        body > *:not(#${PRINT_ROOT_ID}) {
          display: none !important;
        }

        #${PRINT_ROOT_ID} {
          position: static !important;
          display: block !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #fff !important;
        }

        #${PRINT_ROOT_ID} * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        ${NO_PRINT_SELECTOR} {
          display: none !important;
        }
      }

      @media screen {
        #${PRINT_ROOT_ID} {
          display: none !important;
        }
      }

      ${opts.extraStyles ?? ''}
    `;

    return style;
  }

  private waitForImages(root: HTMLElement): Promise<void> {
    const images = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete);
    if (images.length === 0) {
      return Promise.resolve();
    }
    return Promise.all(
      images.map(
        (img) =>
          new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          }),
      ),
    ).then(() => undefined);
  }

  private invokePrint(win: Window): Promise<void> {
    return new Promise<void>((resolve) => {
      const onAfterPrint = () => {
        win.removeEventListener('afterprint', onAfterPrint);
        resolve();
      };
      win.addEventListener('afterprint', onAfterPrint);
      // Fallback in case afterprint never fires (older Safari edge cases).
      const fallback = setTimeout(() => {
        win.removeEventListener('afterprint', onAfterPrint);
        resolve();
      }, 30000);
      win.addEventListener(
        'afterprint',
        () => clearTimeout(fallback),
        { once: true },
      );
      win.print();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
