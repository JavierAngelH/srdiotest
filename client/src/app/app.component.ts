import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<main class="shell"><router-outlet /></main>`,
  styles: [
    `
      .shell {
        max-width: 52rem;
        margin: 0 auto;
        padding: 1.5rem 1.25rem 3rem;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        color: #1f2328;
        line-height: 1.45;
      }
      a {
        color: #0969da;
      }
    `,
  ],
})
export class AppComponent {}
