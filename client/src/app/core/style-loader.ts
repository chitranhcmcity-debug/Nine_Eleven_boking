import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Attaches page-level stylesheets for a layout and removes them when it is destroyed. */
@Injectable({ providedIn: 'root' })
export class StyleLoader {
  private readonly document = inject(DOCUMENT);

  attach(hrefs: string[], bodyClass = ''): () => void {
    const links = hrefs.map((href) => {
      const link = this.document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      this.document.head.appendChild(link);
      return link;
    });
    this.document.body.className = bodyClass;
    return () => {
      links.forEach((link) => link.remove());
      this.document.body.className = '';
    };
  }
}
