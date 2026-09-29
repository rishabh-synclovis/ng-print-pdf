# ngx-print-pdf workspace

Print any on-screen Angular UI — same layout, colors, images, and live form
values you see on screen — using the browser's native print engine (the same
path as `Ctrl/Cmd+P`). No canvas rasterization, no server, no re-implemented
layout engine. The user gets the standard print dialog and can choose
"Save as PDF" or any physical printer.

This repo is an Angular CLI workspace with two projects:

| Project | Path | What it is |
| --- | --- | --- |
| **`ngx-print-pdf`** | `projects/ngx-print-pdf` | The publishable Angular library — `PrintService`, `NoPrintDirective`, `PrintTargetDirective`. |
| **`demo-app`** | `projects/demo-app` | A sample invoice-style page that exercises the library, so you can see it work. |

See [`projects/ngx-print-pdf/README.md`](projects/ngx-print-pdf/README.md) for
the library's full API reference.

## Prerequisites

- **Node.js** 20.x or newer (tested on Node 22.17.0)
- **npm** 10.x or newer (bundled with Node)
- **Angular CLI** 20.x — optional globally, but recommended:
  ```bash
  npm install -g @angular/cli@20
  ```
  Without a global install, prefix every `ng` command below with `npx`, e.g.
  `npx ng serve demo-app`.
- A Chromium-based or Firefox/Safari desktop browser to view the demo and its
  print dialog (native "Save as PDF" is what you'll use to produce an actual
  PDF file).

## Installation

Clone or copy this workspace, then install dependencies from the workspace
root (not from inside `projects/*`):

```bash
cd pdf-convertor-workspace
npm install
```

## Build the library

The demo app imports `ngx-print-pdf` via a TypeScript path mapping that points
at `dist/ngx-print-pdf`, so **the library must be built at least once before
the demo app will compile or serve**:

```bash
ng build ngx-print-pdf
```

Re-run this command any time you change files under `projects/ngx-print-pdf`
while the demo app is already running, then let the demo app's dev server
pick up the new `dist/` output (or restart `ng serve` if it doesn't).

## Run the demo app

```bash
ng serve demo-app --port 4302
```

Then open **http://localhost:4302/** in your browser. If port 4302 is already
in use on your machine, pick any free port (`--port 4303`, etc.).

What you'll see:

- A purple toolbar with a **Print / Save as PDF** button and a checkbox toggle.
- A dark sidebar navigation.
- An invoice with a styled header, a line-items table, colored status badges,
  and an editable "Bill To" text field.

Click **Print / Save as PDF**. Your browser's native print dialog opens,
scoped to just the invoice — the toolbar and sidebar are excluded. Choosing
**Save as PDF** as the destination produces a PDF that visually matches the
on-screen invoice, including the edited text field value and any checkbox
state.

## Install the library in your own project

Once published (or built locally), consume it like any Angular library:

```bash
npm install ngx-print-pdf
```

```ts
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { PrintService, NoPrintDirective } from 'ngx-print-pdf';

@Component({
  standalone: true,
  imports: [NoPrintDirective],
  template: `
    <button ngxppNoPrint (click)="print()">Print</button>
    <div #root class="invoice"><!-- your real UI --></div>
  `,
})
export class InvoiceComponent {
  private printService = inject(PrintService);
  @ViewChild('root', { static: true }) root!: ElementRef<HTMLElement>;

  print() {
    this.printService.print(this.root.nativeElement, { pageSize: 'A4' });
  }
}
```

Full options (`pageSize`, `orientation`, `margin`, `excludeSelectors`, etc.)
are documented in [`projects/ngx-print-pdf/README.md`](projects/ngx-print-pdf/README.md).

## Running tests

```bash
# Library unit tests (headless Chrome)
ng test ngx-print-pdf --watch=false --browsers=ChromeHeadless

# Demo app unit tests
ng test demo-app --watch=false --browsers=ChromeHeadless
```

## Production builds

```bash
ng build ngx-print-pdf   # -> dist/ngx-print-pdf  (publishable npm package)
ng build demo-app        # -> dist/demo-app       (static site)
```

## Publishing the library

```bash
ng build ngx-print-pdf
cd dist/ngx-print-pdf
npm publish
```

## Troubleshooting

- **`Cannot find module 'ngx-print-pdf'` when serving `demo-app`** — you
  haven't built the library yet. Run `ng build ngx-print-pdf` first.
- **`Port XXXX is already in use`** — another process (or a previous `ng
  serve`) is bound to that port. Pass a different `--port`, or find and stop
  the existing process (`lsof -i :4302` on macOS/Linux).
- **Print output looks different from the screen** — make sure any custom
  fonts/images the invoice uses are fully loaded before printing; the service
  waits for `<img>` tags by default (`waitForImages: true`), but web fonts
  loaded via `@font-face` should be preloaded by your app as usual.
# ng-print-pdf
