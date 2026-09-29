import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PrintService } from './print.service';

describe('PrintService', () => {
  let service: PrintService;
  let printSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(PrintService);
    printSpy = spyOn(window, 'print').and.callFake(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
  });

  afterEach(() => {
    document.querySelectorAll('#ngxpp-print-root, #ngxpp-print-style').forEach((el) => el.remove());
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('clones the target into a print root and calls window.print', async () => {
    const el = document.createElement('div');
    el.innerHTML = '<span>Hello</span>';
    document.body.appendChild(el);

    await service.print(el, { waitForImages: false, settleDelayMs: 0 });

    expect(printSpy).toHaveBeenCalled();
    el.remove();
  });

  it('cleans up the print root and injected styles after printing', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    await service.print(el, { waitForImages: false, settleDelayMs: 0 });

    expect(document.getElementById('ngxpp-print-root')).toBeNull();
    expect(document.getElementById('ngxpp-print-style')).toBeNull();
    el.remove();
  });

  it('excludes elements marked with ngxppNoPrint from the clone', async () => {
    const el = document.createElement('div');
    el.innerHTML = '<span class="keep">Keep</span><span ngxppNoPrint class="drop">Drop</span>';
    document.body.appendChild(el);

    let clonedHtml = '';
    printSpy.and.callFake(() => {
      const root = document.getElementById('ngxpp-print-root');
      clonedHtml = root?.innerHTML ?? '';
      window.dispatchEvent(new Event('afterprint'));
    });

    await service.print(el, { waitForImages: false, settleDelayMs: 0 });

    expect(clonedHtml).toContain('Keep');
    expect(clonedHtml).not.toContain('Drop');
    el.remove();
  });

  it('rejects concurrent print calls while one is in progress', async () => {
    const el = document.createElement('div');
    document.body.appendChild(el);

    printSpy.and.callFake(() => {
      setTimeout(() => window.dispatchEvent(new Event('afterprint')), 10);
    });

    const first = service.print(el, { waitForImages: false, settleDelayMs: 0 });
    await expectAsync(service.print(el, { waitForImages: false, settleDelayMs: 0 })).toBeRejected();
    await first;
    el.remove();
  });

  it('resolves the target from a CSS selector string', async () => {
    const el = document.createElement('div');
    el.id = 'selector-target';
    document.body.appendChild(el);

    await service.print('#selector-target', { waitForImages: false, settleDelayMs: 0 });

    expect(printSpy).toHaveBeenCalled();
    el.remove();
  });

  it('throws when the selector does not resolve to an element', async () => {
    await expectAsync(
      service.print('#does-not-exist', { waitForImages: false, settleDelayMs: 0 }),
    ).toBeRejected();
  });
});
