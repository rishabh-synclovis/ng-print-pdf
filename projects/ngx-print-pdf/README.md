# ngx-print-pdf

Print any on-screen Angular content — with the exact same UI, computed styles,
colors, images and live form values you see on screen — using the browser's
own native print engine. The user gets the standard print dialog and can
choose "Save as PDF", a physical printer, or any other destination.

No server, no canvas rasterization, no re-implementation of your layout in
another rendering engine. Real text stays selectable, `@page` size/margins are
configurable, and elements you don't want printed (toolbars, nav, buttons) are
simply excluded.

## How it works

1. `PrintService.print(target)` deep-clones the target element.
2. It walks the clone and inlines every element's **computed style**, so the
   printed output matches what's on screen regardless of your app's global
   CSS, component encapsulation, or third-party stylesheets.
3. Elements marked `ngxppNoPrint` (or matching your own `excludeSelectors`)
   are stripped from the clone.
4. Live form control values/checked state are copied onto the clone (cloning
   the DOM alone does not carry these over).
5. The clone is appended to `<body>` inside an isolated `#ngxpp-print-root`,
   alongside an injected stylesheet that hides everything else during
   `@media print` and applies your page size/margins.
6. `window.print()` is invoked. Once the browser's `afterprint` event fires,
   the clone and injected styles are removed — the live app is untouched
   throughout.

## Install

```bash
npm install ngx-print-pdf
```

## Usage

```ts
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { PrintService, NoPrintDirective } from 'ngx-print-pdf';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [NoPrintDirective],
  template: `
    <button ngxppNoPrint (click)="print()">Print / Save as PDF</button>

    <div #invoiceRoot class="invoice">
      <!-- your real UI: tables, images, charts, styled cards, form inputs... -->
    </div>
  `,
})
export class InvoiceComponent {
  private printService = inject(PrintService);

  @ViewChild('invoiceRoot', { static: true })
  invoiceRoot!: ElementRef<HTMLElement>;

  print() {
    this.printService.print(this.invoiceRoot.nativeElement, {
      title: 'Invoice-0042',
      pageSize: 'A4',
      orientation: 'portrait',
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
    });
  }
}
```

You can also pass a CSS selector instead of an `ElementRef`:

```ts
this.printService.print('#invoice-root');
```

### Excluding elements from print

Add the `ngxppNoPrint` attribute directive to anything that shouldn't appear
in the printed/PDF output — toolbars, action buttons, side navigation, etc.:

```html
<header ngxppNoPrint>...</header>
```

Or pass extra CSS selectors per call:

```ts
this.printService.print(root, { excludeSelectors: ['.tooltip', '[data-debug]'] });
```

### Options (`PrintOptions`)

| Option           | Type                          | Default                              | Description |
| ---------------- | ----------------------------- | ------------------------------------- | ------------ |
| `title`          | `string`                       | current doc title                    | Restored after printing. |
| `pageSize`       | `'A4' \| 'A3' \| 'A5' \| 'Letter' \| 'Legal' \| 'auto'` | `'A4'` | Sets the CSS `@page size`. |
| `orientation`    | `'portrait' \| 'landscape'`   | `'portrait'`                          | |
| `margin`         | `{ top, right, bottom, left }` | `10mm` on all sides                  | |
| `extraStyles`    | `string`                       | —                                     | Raw CSS appended after the base print stylesheet, for page-specific tweaks. |
| `excludeSelectors` | `string[]`                   | `[]`                                  | Additional selectors removed from the clone. |
| `waitForImages`  | `boolean`                     | `true`                                | Wait for all `<img>` in the target to finish loading before printing. |
| `settleDelayMs`  | `number`                      | `250`                                 | Extra delay before `window.print()`, to let layout/fonts settle. |

## API

- `PrintService.print(target: HTMLElement | string, options?: PrintOptions): Promise<void>`
- `PrintTargetDirective` (`ngxppPrintTarget`, `exportAs: ngxppPrintTarget`) — optional convenience directive exposing `.element` via a template reference.
- `NoPrintDirective` (`ngxppNoPrint`) — marks an element to exclude from print output.

## Building

```bash
ng build ngx-print-pdf
```

Build artifacts are written to `dist/ngx-print-pdf`.

## Running unit tests

```bash
ng test ngx-print-pdf
```
