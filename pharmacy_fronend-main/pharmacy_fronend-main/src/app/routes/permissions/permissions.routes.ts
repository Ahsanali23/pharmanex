import { Routes } from '@angular/router';
import { ngxPermissionsGuard } from 'ngx-permissions';
import { PermissionsRoleSwitchingComponent } from './role-switching/role-switching.component';
import { PermissionsRouteGuardComponent } from './route-guard/route-guard.component';
import { PermissionsTestComponent } from './test/test.component';
import { PermissionsRoleComponent } from './role/role.component';
import { permission } from 'process';
import { PermissionViewComponent } from './permissionView/permissionview.component';

export const routes: Routes = [
  { path: 'role-switching', component: PermissionsRoleSwitchingComponent },
  { path: 'role', component: PermissionsRoleComponent },
  { path: 'permissionList', component: PermissionViewComponent },

  {
    path: 'route-guard',
    component: PermissionsRouteGuardComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        except: 'GUEST',
        redirectTo: '/dashboard',
      },
    },
  },
  {
    path: 'test',
    component: PermissionsTestComponent,
    canActivate: [ngxPermissionsGuard],
    data: {
      permissions: {
        only: 'ADMIN',
        redirectTo: '/dashboard',
      },
    },
  },
];
