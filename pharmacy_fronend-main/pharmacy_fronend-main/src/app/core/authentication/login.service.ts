import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';

import { Menu } from '@core';
import { Token, User } from './interface';
import { environment } from '@env/environment';
import { U } from '@angular/cdk/unique-selection-dispatcher.d-DSFqf1MM';
@Injectable({
  providedIn: 'root',
})
export class LoginService {
  protected readonly http = inject(HttpClient);

  login(username: string, password: string, rememberMe = false) {
    //return this.http.post<Token>('/auth/login', { username, password, rememberMe });

    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}User/login`, {
        Email: username,
        Password: password,
      })
      .pipe(
        map(response => {
          // Save user to localStorage
          localStorage.setItem('user', JSON.stringify(response.user));
          return {
            access_token: response.token,
            token_type: 'bearer',
            // Add other Token properties as needed
          } as Token;
        })
      ); // Subscribe to trigger the request and storage
  }

  refresh(params: Record<string, any>) {
    console.log('refresh');

    return this.http.post<Token>('/auth/refresh', params);
  }

  logout() {
    console.log('logout');
    return this.http.post<any>('/auth/logout', {});
  }

  user() {
    const token = localStorage.getItem('ng-matero-token');
    return this.http
      .get<User>(`${environment.apiUrl}User/me`, {
        headers: new HttpHeaders({
          Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        }),
      })
      .pipe(
        map(response => {
          const mappedUser: User = {
            id: response.id ?? null,
            name: response.name ?? '',
            email: response.email ?? '',
            role: response.role ?? '',
            avatar: response.avatar ?? '',
            permissions: response.permissions ?? [],
            ...response,
          };
          return mappedUser;
        })
      );
    //    console.log('user');
  }

  menu() {
    console.log('menu');
    return this.http
      .get<{ menu: Menu[] }>('data/menu.json?_t=' + Date.now())
      .pipe(map(res => res.menu));
    return this.http.get<{ menu: Menu[] }>('/user/menu').pipe(map(res => res.menu));
  }
}
