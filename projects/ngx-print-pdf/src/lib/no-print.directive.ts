import { Directive, HostBinding } from '@angular/core';

/**
 * Marks an element to be stripped out of the printed output, e.g. toolbars,
 * action buttons, or navigation that shouldn't appear in the PDF/print copy.
 *
 * ```html
 * <button ngxppNoPrint (click)="printService.print(root)">Print</button>
 * ```
 */
@Directive({
  selector: '[ngxppNoPrint]',
  standalone: true,
})
export class NoPrintDirective {
  @HostBinding('attr.ngxppNoPrint')
  readonly marker = '';
}
