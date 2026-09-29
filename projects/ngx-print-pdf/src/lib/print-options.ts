export type PageSize = 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal' | 'auto';
export type PageOrientation = 'portrait' | 'landscape';

export interface PrintMargin {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface PrintOptions {
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

export const DEFAULT_PRINT_OPTIONS: Required<Omit<PrintOptions, 'title' | 'extraStyles'>> & {
  title?: string;
  extraStyles?: string;
} = {
  pageSize: 'A4',
  orientation: 'portrait',
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
  excludeSelectors: [],
  settleDelayMs: 250,
  waitForImages: true,
};
