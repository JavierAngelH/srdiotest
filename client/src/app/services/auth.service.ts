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

  get token(): string | null {
    return localStorage.getItem('token');
  }

  captureTokenFromUrl(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }

  login(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}));
    } catch {
      /* ignore */
    }
    localStorage.removeItem('token');
    this.user.set(null);
  }

  async refreshMe(): Promise<User | null> {
    this.captureTokenFromUrl();
    if (!this.token) {
      this.user.set(null);
      this.loaded.set(true);
      return null;
    }
    try {
      const me = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/api/me`)
      );
      this.user.set(me);
      this.loaded.set(true);
      return me;
    } catch {
      localStorage.removeItem('token');
      this.user.set(null);
      this.loaded.set(true);
      return null;
    }
  }
}
