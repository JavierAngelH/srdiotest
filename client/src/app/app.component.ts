import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<main><h1>srdiotest</h1><p>Scaffold ready.</p><router-outlet /></main>`,
  styles: [`main { font-family: system-ui; max-width: 40rem; margin: 2rem auto; padding: 0 1rem; }`],
})
export class AppComponent {}
