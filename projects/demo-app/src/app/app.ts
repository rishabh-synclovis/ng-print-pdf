import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NoPrintDirective, PrintOptions, PrintService } from 'ngx-print-pdf';

@Component({
  selector: 'app-root',
  imports: [FormsModule, NoPrintDirective],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly printService = inject(PrintService);

  @ViewChild('invoiceRoot', { static: true })
  invoiceRoot!: ElementRef<HTMLElement>;

  protected includeSignature = true;
  protected clientName = 'Acme Corporation';
  protected printing = false;
  protected errorMessage = '';

  private readonly printOptions: PrintOptions = {
    title: 'Invoice-INV-2026-0042',
    pageSize: 'A4',
    orientation: 'portrait',
    margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
  };

  async onPrintClick(): Promise<void> {
    this.printing = true;
    this.errorMessage = '';
    try {
      await this.printService.print(this.invoiceRoot.nativeElement, this.printOptions);
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : 'Print failed.';
    } finally {
      this.printing = false;
    }
  }
}
