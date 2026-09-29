import * as i0 from '@angular/core';

type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'auto';
type PageOrientation = 'portrait' | 'landscape';
interface PrintMargin {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
}
interface PrintOptions {
    /** Document title used for the print job / saved PDF file name suggestion. */
    title?: string;
    /** Physical page size for the @page rule. Use 'auto' to let the printer decide. */
    pageSize?: PageSize;
    orientation?: PageOrientation;
    margin?: PrintMargin;
    /** Extra CSS appended after the base print stylesheet, for page-specific tweaks. */
    extraStyles?: string;
    /** Selector(s) for elements that should never appear in the printed output, in addition to [ngxppNoPrint]. */
    excludeSelectors?: string[];
    /** Milliseconds to wait before invoking window.print(), to let images/fonts settle. Default 250. */
    settleDelayMs?: number;
    /** Also wait for all <img> elements inside the target to finish loading before printing. Default true. */
    waitForImages?: boolean;
}
declare const DEFAULT_PRINT_OPTIONS: Required<Omit<PrintOptions, 'title' | 'extraStyles'>> & {
    title?: string;
    extraStyles?: string;
};

/**
 * Prints (or "saves as PDF" via the browser's native print dialog) an on-screen
 * element exactly as it renders today, computed styles included, using the
 * browser's own print engine rather than re-rendering the layout.
 */
declare class PrintService {
    private readonly document;
    private printing;
    /**
     * Print the given element (or the element behind a CSS selector).
     * Resolves once the print dialog has been dismissed (best-effort: browsers
     * fire `afterprint` reliably on Chrome/Firefox/Edge/Safari).
     */
    print(target: HTMLElement | string, options?: PrintOptions): Promise<void>;
    private resolveTarget;
    /** Deep-clones the target so the live app DOM/state is never touched. */
    private buildPrintRoot;
    /**
     * Walks the source/clone in lockstep, copying computed styles onto the
     * clone inline. This is what makes the printed output match "what you see
     * on screen" instead of relying on print media queries reinterpreting the
     * app's own stylesheets (which may not apply the same way to a detached clone).
     */
    private inlineComputedStyles;
    private applyExclusions;
    /**
     * cloneNode does not copy live form control values/checked state into the
     * clone's attributes, so inputs/selects/textareas would print blank.
     */
    private syncFormValues;
    private buildPrintStyles;
    private waitForImages;
    private invokePrint;
    private delay;
    static ɵfac: i0.ɵɵFactoryDeclaration<PrintService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<PrintService>;
}

/**
 * Marks an element as a reusable print target:
 *
 * ```html
 * <div ngxppPrintTarget #invoice="ngxppPrintTarget">...</div>
 * <button (click)="printService.print(invoice.element)">Print</button>
 * ```
 */
declare class PrintTargetDirective {
    private readonly elementRef;
    get element(): HTMLElement;
    static ɵfac: i0.ɵɵFactoryDeclaration<PrintTargetDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<PrintTargetDirective, "[ngxppPrintTarget]", ["ngxppPrintTarget"], {}, {}, never, never, true, never>;
}

/**
 * Marks an element to be stripped out of the printed output, e.g. toolbars,
 * action buttons, or navigation that shouldn't appear in the PDF/print copy.
 *
 * ```html
 * <button ngxppNoPrint (click)="printService.print(root)">Print</button>
 * ```
 */
declare class NoPrintDirective {
    readonly marker = "";
    static ɵfac: i0.ɵɵFactoryDeclaration<NoPrintDirective, never>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<NoPrintDirective, "[ngxppNoPrint]", never, {}, {}, never, never, true, never>;
}

export { DEFAULT_PRINT_OPTIONS, NoPrintDirective, PrintService, PrintTargetDirective };
export type { PageOrientation, PageSize, PrintMargin, PrintOptions };
