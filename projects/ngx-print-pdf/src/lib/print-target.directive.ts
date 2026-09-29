import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Marks an element as a reusable print target:
 *
 * ```html
 * <div ngxppPrintTarget #invoice="ngxppPrintTarget">...</div>
 * <button (click)="printService.print(invoice.element)">Print</button>
 * ```
 */
@Directive({
  selector: '[ngxppPrintTarget]',
  exportAs: 'ngxppPrintTarget',
  standalone: true,
})
export class PrintTargetDirective {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  get element(): HTMLElement {
    return this.elementRef.nativeElement;
  }
}
