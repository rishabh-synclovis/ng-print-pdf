import { DOCUMENT } from '@angular/common';
import * as i0 from '@angular/core';
import { inject, Injectable, ElementRef, Directive, HostBinding } from '@angular/core';

const DEFAULT_PRINT_OPTIONS = {
    pageSize: 'A4',
    orientation: 'portrait',
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    excludeSelectors: [],
    settleDelayMs: 250,
    waitForImages: true,
};

const PRINT_ROOT_ID = 'ngxpp-print-root';
const PRINT_STYLE_ID = 'ngxpp-print-style';
const NO_PRINT_ATTR = 'ngxppNoPrint';
const NO_PRINT_SELECTOR = `[${NO_PRINT_ATTR}], .ngxpp-no-print`;
/**
 * Prints (or "saves as PDF" via the browser's native print dialog) an on-screen
 * element exactly as it renders today, computed styles included, using the
 * browser's own print engine rather than re-rendering the layout.
 */
class PrintService {
    document = inject(DOCUMENT);
    printing = false;
    /**
     * Print the given element (or the element behind a CSS selector).
     * Resolves once the print dialog has been dismissed (best-effort: browsers
     * fire `afterprint` reliably on Chrome/Firefox/Edge/Safari).
     */
    async print(target, options = {}) {
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
        }
        finally {
            printRoot.remove();
            styleEl.remove();
            this.document.title = previousTitle;
            this.printing = false;
        }
    }
    resolveTarget(target) {
        if (typeof target === 'string') {
            return this.document.querySelector(target);
        }
        return target;
    }
    /** Deep-clones the target so the live app DOM/state is never touched. */
    buildPrintRoot(sourceEl, opts) {
        const root = this.document.createElement('div');
        root.id = PRINT_ROOT_ID;
        const clone = sourceEl.cloneNode(true);
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
    inlineComputedStyles(source, clone) {
        const computed = getComputedStyle(source);
        let cssText = '';
        for (let i = 0; i < computed.length; i++) {
            const prop = computed.item(i);
            cssText += `${prop}:${computed.getPropertyValue(prop)};`;
        }
        clone.style.cssText = cssText;
        const sourceChildren = Array.from(source.children);
        const cloneChildren = Array.from(clone.children);
        for (let i = 0; i < sourceChildren.length; i++) {
            this.inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
        }
    }
    applyExclusions(clone, extraSelectors) {
        const selector = [NO_PRINT_SELECTOR, ...extraSelectors].join(', ');
        clone.querySelectorAll(selector).forEach((el) => el.remove());
    }
    /**
     * cloneNode does not copy live form control values/checked state into the
     * clone's attributes, so inputs/selects/textareas would print blank.
     */
    syncFormValues(source, clone) {
        const sourceControls = source.querySelectorAll('input, textarea, select');
        const cloneControls = clone.querySelectorAll('input, textarea, select');
        sourceControls.forEach((sourceControl, i) => {
            const cloneControl = cloneControls[i];
            if (!cloneControl) {
                return;
            }
            if (sourceControl instanceof HTMLInputElement && cloneControl instanceof HTMLInputElement) {
                if (sourceControl.type === 'checkbox' || sourceControl.type === 'radio') {
                    cloneControl.checked = sourceControl.checked;
                }
                else {
                    cloneControl.setAttribute('value', sourceControl.value);
                    cloneControl.value = sourceControl.value;
                }
            }
            else if (sourceControl instanceof HTMLTextAreaElement) {
                cloneControl.textContent = sourceControl.value;
            }
            else if (sourceControl instanceof HTMLSelectElement && cloneControl instanceof HTMLSelectElement) {
                cloneControl.value = sourceControl.value;
            }
        });
    }
    buildPrintStyles(opts) {
        const style = this.document.createElement('style');
        style.id = PRINT_STYLE_ID;
        const size = opts.pageSize === 'auto'
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
    waitForImages(root) {
        const images = Array.from(root.querySelectorAll('img')).filter((img) => !img.complete);
        if (images.length === 0) {
            return Promise.resolve();
        }
        return Promise.all(images.map((img) => new Promise((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
        }))).then(() => undefined);
    }
    invokePrint(win) {
        return new Promise((resolve) => {
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
            win.addEventListener('afterprint', () => clearTimeout(fallback), { once: true });
            win.print();
        });
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: PrintService, deps: [], target: i0.ɵɵFactoryTarget.Injectable });
    static ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: PrintService, providedIn: 'root' });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: PrintService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }] });

/**
 * Marks an element as a reusable print target:
 *
 * ```html
 * <div ngxppPrintTarget #invoice="ngxppPrintTarget">...</div>
 * <button (click)="printService.print(invoice.element)">Print</button>
 * ```
 */
class PrintTargetDirective {
    elementRef = inject((ElementRef));
    get element() {
        return this.elementRef.nativeElement;
    }
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: PrintTargetDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.3.32", type: PrintTargetDirective, isStandalone: true, selector: "[ngxppPrintTarget]", exportAs: ["ngxppPrintTarget"], ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: PrintTargetDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngxppPrintTarget]',
                    exportAs: 'ngxppPrintTarget',
                    standalone: true,
                }]
        }] });

/**
 * Marks an element to be stripped out of the printed output, e.g. toolbars,
 * action buttons, or navigation that shouldn't appear in the PDF/print copy.
 *
 * ```html
 * <button ngxppNoPrint (click)="printService.print(root)">Print</button>
 * ```
 */
class NoPrintDirective {
    marker = '';
    static ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: NoPrintDirective, deps: [], target: i0.ɵɵFactoryTarget.Directive });
    static ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "20.3.32", type: NoPrintDirective, isStandalone: true, selector: "[ngxppNoPrint]", host: { properties: { "attr.ngxppNoPrint": "this.marker" } }, ngImport: i0 });
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "20.3.32", ngImport: i0, type: NoPrintDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: '[ngxppNoPrint]',
                    standalone: true,
                }]
        }], propDecorators: { marker: [{
                type: HostBinding,
                args: ['attr.ngxppNoPrint']
            }] } });

/*
 * Public API Surface of ngx-print-pdf
 */

/**
 * Generated bundle index. Do not edit.
 */

export { DEFAULT_PRINT_OPTIONS, NoPrintDirective, PrintService, PrintTargetDirective };
//# sourceMappingURL=ngx-print-pdf.mjs.map
