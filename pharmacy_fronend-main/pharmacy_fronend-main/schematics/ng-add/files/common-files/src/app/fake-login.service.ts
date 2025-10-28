import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { admin, LoginService, Menu, User } from '@core';
import { map } from 'rxjs/operators';

/**
 * You should delete this file in the real APP.
 */
@Injectable()
export class FakeLoginService extends LoginService {
  private token = { access_token: 'MW56YjMyOUAxNjMuY29tWm9uZ2Jpbg==', token_type: 'bearer' };

  login() {
    return of(this.token);
  }

  refresh() {
    console.log('refresh1');
    return of(this.token);
  }

  logout() {
        console.log('logout');
    return of({});
  }

  user() {
        console.log('user red');
    return of(admin);
  }

  menu() {
        console.log('menaus');
    return this.http
      .get<{ menu: Menu[] }>('data/menu.json?_t=' + Date.now())
      .pipe(map(res => res.menu));
  }
}
