import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { ZapListComponent } from './pages/zap-list.component';
import { ZapEditorComponent } from './pages/zap-editor.component';
import { CopilotComponent } from './pages/copilot.component';

export const routes: Routes = [
  { path: '', component: ZapListComponent },
  { path: 'zaps/new', component: ZapEditorComponent, canActivate: [authGuard] },
  { path: 'zaps/:id', component: ZapEditorComponent, canActivate: [authGuard] },
  { path: 'copilot', component: CopilotComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
