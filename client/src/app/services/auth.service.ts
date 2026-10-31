import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  githubId: string;
  login: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<User | null>(null);
  readonly loaded = signal(false);

  constructor(private http: HttpClient) {}

  login(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}));
    } catch {
      /* ignore */
    }
    this.user.set(null);
  }

  /** Session is an httpOnly cookie on the API origin; we never store the JWT in JS. */
  async refreshMe(): Promise<User | null> {
    try {
      const me = await firstValueFrom(this.http.get<User>(`${environment.apiUrl}/api/me`));
      this.user.set(me);
      this.loaded.set(true);
      return me;
    } catch {
      this.user.set(null);
      this.loaded.set(true);
      return null;
    }
  }
}
