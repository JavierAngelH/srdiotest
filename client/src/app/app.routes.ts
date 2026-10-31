import { Routes } from '@angular/router';
import { ZapListComponent } from './pages/zap-list.component';
import { ZapEditorComponent } from './pages/zap-editor.component';

export const routes: Routes = [
  { path: '', component: ZapListComponent },
  { path: 'zaps/new', component: ZapEditorComponent },
  { path: 'zaps/:id', component: ZapEditorComponent },
  { path: '**', redirectTo: '' },
];
