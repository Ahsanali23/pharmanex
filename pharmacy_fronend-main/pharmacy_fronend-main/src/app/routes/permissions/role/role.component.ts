import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PageHeaderComponent } from '@shared';
// import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-permissions-role-switching',
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss',
  imports: [
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    PageHeaderComponent,
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MtxGridModule,
  ],
})
export class PermissionsRoleComponent implements OnInit, OnDestroy {
  @ViewChild('roleDialog') roleDialog: any;
  private readonly _destroy$ = new Subject<void>();

  private readonly rolesSrv = inject(NgxRolesService);
  private readonly permissionsSrv = inject(NgxPermissionsService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  currentRole = '';
  currentPermissions: string[] = [];
  isEditMode = false;
  roleForm: any = {
    name: '',
    description: '',
    permissions: [],
  };

  availablePermissions = [
    { id: 'canAdd', name: 'Add', description: 'Can add items' },
    { id: 'canDelete', name: 'Delete', description: 'Can delete items' },
    { id: 'canEdit', name: 'Edit', description: 'Can edit items' },
    { id: 'canRead', name: 'Read', description: 'Can read items' },
  ];

  roles: {
    id: string;
    name: string;
    description: string;
    permissions: {
      id: string;
      name: string;
      description: string;
    }[];
  }[] = [
    {
      id: '1',
      name: 'ADMIN',
      description: 'Administrator with full access',
      permissions: [
        { id: 'canAdd', name: 'Add', description: 'Can add items' },
        { id: 'canDelete', name: 'Delete', description: 'Can delete items' },
        { id: 'canEdit', name: 'Edit', description: 'Can edit items' },
        { id: 'canRead', name: 'Read', description: 'Can read items' },
      ],
    },
    {
      id: '2',
      name: 'MANAGER',
      description: 'Manager with limited access',
      permissions: [
        { id: 'canAdd', name: 'Add', description: 'Can add items' },
        { id: 'canEdit', name: 'Edit', description: 'Can edit items' },
        { id: 'canRead', name: 'Read', description: 'Can read items' },
      ],
    },
    {
      id: '3',
      name: 'GUEST',
      description: 'Guest with read-only access',
      permissions: [{ id: 'canRead', name: 'Read', description: 'Can read items' }],
    },
  ];

  columns: MtxGridColumn[] = [
    {
      header: this.translate.stream('name'),
      field: 'name',
      sortable: true,
      disabled: true,
      width: '100px',
    },
    {
      header: this.translate.stream('description'),
      field: 'description',
    },
    {
      header: this.translate.stream('operation'),
      field: 'operation',
      minWidth: 140,
      width: '140px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: this.translate.stream('edit'),
          click: record => this.edit(record),
        },
        // ,{
        //   type: 'icon',
        //   color: 'warn',
        //   icon: 'delete',
        //   tooltip: this.translate.stream('delete'),
        //   pop: {
        //     title: this.translate.stream('confirm_delete'),
        //     closeText: this.translate.stream('close'),
        //     okText: this.translate.stream('ok'),
        //   },
        //   click: record => this.delete(record),
        // },
      ],
    },
  ];

  isLoading = false;
  multiSelectable = false;
  rowSelectable = false;
  hideRowSelectionCheckbox = false;
  showToolbar = false;
  columnHideable = true;
  columnSortable = true;
  columnPinnable = true;
  rowHover = false;
  rowStriped = false;
  showPaginator = true;
  expandable = false;
  columnResizable = false;

  ngOnInit() {
    this.currentRole = Object.keys(this.rolesSrv.getRoles())[0];
    this.currentPermissions = Object.keys(this.permissionsSrv.getPermissions());
    this.loadRoles();
    this.loadPermissions();
  }

  openAddRoleDialog(): void {
    this.isEditMode = false;
    this.roleForm = {
      name: '',
      description: '',
      permissions: [],
    };

    const dialogRef = this.dialog.open(this.roleDialog, {
      width: '500px',
      data: { isEditMode: this.isEditMode, roleForm: this.roleForm },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveRole(result);
      }
    });
  }
  loadRoles() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}RoleAndPermission/role`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.roles = data || [];
        console.log(this.roles);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  loadPermissions() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}RoleAndPermission/permission`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.availablePermissions = data || [];
        console.log(this.availablePermissions);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  edit(role: any): void {
    this.isEditMode = true;
    console.log(role);
    this.roleForm = {
      ...role,
      permissions: [...role.permissions],
    };

    const dialogRef = this.dialog.open(this.roleDialog, {
      width: '500px',
      data: { isEditMode: this.isEditMode, roleForm: this.roleForm },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveRole(result);
      }
    });
  }

  delete(role: any): void {
    const index = this.roles.findIndex(r => r.id === role.id);
    if (index > -1) {
      this.roles.splice(index, 1);
    }
  }
  saveRoleToApi(roleData: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}RoleAndPermission/role`;
    const token = localStorage.getItem('ng-matero-token');
    // Map roleData to RoleCreateDto format
    const mappedRoleData = {
      name: roleData.name,
      description: roleData.description,
      permissionIds: (roleData.permissions || []).map((p: any) =>
        p.id && Number.isInteger(p.id) ? p.id : parseInt(p.id, 10)
      ),
    };
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedRoleData),
    })
      .then(async res => {
        let data = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        }
        if (res.ok) {
          //this.loadRoles();
          this.snackBar.open('Role added successfully!', 'Close', { duration: 2000 });
        } else {
          // Show error message from API if available
          this.snackBar.open(data?.message || 'Failed to update role', 'Close', { duration: 2000 });
        }
        this.isLoading = false;
      })
      .catch(() => {
        this.snackBar.open('Failed to update role', 'Close', { duration: 2000 });
        this.isLoading = false;
      });
  }
  editRoleToApi(roleData: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}RoleAndPermission/role/${roleData.id}`;
    const token = localStorage.getItem('ng-matero-token');
    // Map roleData to RoleCreateDto format
    const mappedRoleData = {
      name: roleData.name,
      description: roleData.description,
      permissionIds: (roleData.permissions || []).map((p: any) =>
        p.id && Number.isInteger(p.id) ? p.id : parseInt(p.id, 10)
      ),
    };
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedRoleData),
    })
      .then(async res => {
        let data = null;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        }
        if (res.ok) {
          this.snackBar.open('Role updated successfully!', 'Close', { duration: 2000 });
          this.loadRoles();
        } else {
          // Show error message from API if available
          // this.snackBar.open(data?.message || 'Failed to update role', 'Close', { duration: 2000 });
        }
        this.isLoading = false;
      })
      .catch(err => {
        console.log(err);
        this.snackBar.open('Failed to update role', 'Close', { duration: 2000 });
        this.isLoading = false;
      });
  }
  saveRole(roleData: any): void {
    if (this.isEditMode) {
      const index = this.roles.findIndex(r => r.id === roleData.id);
      if (index > -1) {
        this.roles[index] = roleData;
        this.editRoleToApi(roleData);
      }
      //this.editRoleToApi(roleData);
    } else {
      const newRole = {
        ...roleData,
        id: (this.roles.length + 1).toString(),
      };
      this.saveRoleToApi(newRole);
      this.roles.push(newRole);
    }
  }

  togglePermission(permission: any): void {
    const index = this.roleForm.permissions.findIndex((p: any) => p.id === permission.id);
    if (index > -1) {
      this.roleForm.permissions.splice(index, 1);
    } else {
      this.roleForm.permissions.push(permission);
    }
  }

  isPermissionSelected(permissionId: string): boolean {
    return this.roleForm.permissions.some((p: any) => p.id === permissionId);
  }

  changeSelect(e: any) {
    console.log(e);
  }

  changeSort(e: any) {
    console.log(e);
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
