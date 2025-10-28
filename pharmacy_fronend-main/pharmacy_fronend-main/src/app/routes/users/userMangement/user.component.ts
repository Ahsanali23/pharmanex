import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, ViewChild, OnInit, inject } from '@angular/core';
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

import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-permissions-role-switching',
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss',
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
    MatSelectModule,
    MatOptionModule,
    MtxGridModule,
  ],
})
export class UserComponent implements OnInit, OnDestroy {
  private readonly rolesSrv = inject(NgxRolesService);
  private readonly permissionsSrv = inject(NgxPermissionsService);
  private readonly snackBar = inject(MatSnackBar);
  @ViewChild('userDialog') userDialog: any;
  currentRole = '';
  currentPermissions: string[] = [];
  userModel: any = {}; // Add this line
  searchName = '';
  searchEmail = '';
  searchrole = 0;
  rolesList: {
    id: string;
    name: string;
    description: string;
    permissions: {
      id: string;
      name: string;
      description: string;
    }[];
  }[] = [];
  selectedProfilePic: File | null = null;

  private readonly _destroy$ = new Subject<void>();
  private readonly translate = inject(TranslateService);
  //private readonly dataSrv = inject(TablesDataService);
  private readonly dialog = inject(MatDialog);
  users: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleId: number;
  }[] = [];

  // Add this property to fix the template error
  isEditMode = false; // Add this property to fix the error
  roleForm: any = {}; // Add this property to fix the compile error

  columns: MtxGridColumn[] = [
    {
      header: this.translate.stream('Profile Pic'),
      field: 'avatar',
      width: '80px',
      type: 'image',
      formatter: (row: any) => {
        // If row.avatar is a URL, return an <img> tag, else empty string
        if (row.avatar) {
          return `<img src="${row.avatar}" alt="Profile Pic"  class="avatar" width="40" height="40" style="border-radius:80%;" />`;
        }
        return '';
      },
      // cellTemplate removed because it must be a TemplateRef, not a function
    },
    {
      header: this.translate.stream('Name'),
      field: 'name',
      sortable: true,
      disabled: true,
      width: '100px',
    },
    {
      header: this.translate.stream('Email'),
      sortable: true,
      field: 'email',
    },
    {
      header: this.translate.stream('Role'),
      sortable: true,
      field: 'role',
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
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: this.translate.stream('delete'),
          pop: {
            title: this.translate.stream('confirm_delete'),
            closeText: this.translate.stream('close'),
            okText: this.translate.stream('ok'),
          },
          click: record => this.delete(record),
        },
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

    this.rolesSrv.roles$.pipe(takeUntil(this._destroy$)).subscribe(roles => {
      console.log(roles);
    });
    this.loadRoles();
    this.loadUsers(); // Load users when the component initializes
    this.permissionsSrv.permissions$.pipe(takeUntil(this._destroy$)).subscribe(permissions => {
      console.log(permissions);
    });
  }
  onProfileSelect(event: any): void {
    const file: File = event.target?.files?.[0];
    if (file) {
      this.selectedProfilePic = file;
      console.log(this.selectedProfilePic);
      // Optional: preview or process file
      const reader = new FileReader();

      reader.readAsDataURL(file);
    }
  }

  // Add this method to handle editing a role
  editRole(role: any): void {
    this.isEditMode = true;
    this.roleForm = { ...role };
    // Open the dialog here if needed, e.g.:
    // this.dialog.open(this.roleDialog);
  }
  onSubmit() {}
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
        this.rolesList = data || [];
        console.log(this.rolesList);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  searchUser() {
    this.loadRoles();

    this.isLoading = true;
    this.users = this.users.filter(user => {
      const matchesName = this.searchName
        ? user.name?.toLowerCase().includes(this.searchName.toLowerCase())
        : true;
      const matchesEmail = this.searchEmail
        ? user.email?.toLowerCase().includes(this.searchEmail.toLowerCase())
        : true;
      // const matchesRole = this.searchrole && this.searchrole > 0 ? user.roleId === this.searchrole : true;
      return matchesName && matchesEmail;
    });
    this.isLoading = false;
  }
  resetForm() {
    this.searchName = '';
    this.searchEmail = '';
    this.searchrole = 0;
    this.loadUsers();
  }
  delete(value: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}user/${value.id}`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.users = data || [];
        this.snackBar.open('User deleted successfully!', 'Close', { duration: 2000 });
        this.loadUsers();
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }

  openAddRoleDialog(): void {
    //
    this.roleForm = {
      name: '',
      description: '',
      permissions: [],
    };

    const dialogRef = this.dialog.open(this.userDialog, {
      width: '500px',
      data: { isEditMode: this.isEditMode, roleForm: this.roleForm },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveUser();
      }
    });
  }
  saveUserData() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}user`;
    const token = localStorage.getItem('ng-matero-token');

    const formData = new FormData();
    formData.append('name', this.userModel.name);
    formData.append('email', this.userModel.email);
    formData.append('password', this.userModel.password);
    formData.append('roleId', this.userModel.roleId);
    formData.append('status', 'Active');
    if (this.selectedProfilePic) {
      formData.append('profilePic', this.selectedProfilePic);
    } else {
      formData.append('profilePic', '');
    }
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
      },
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add user');
        return res.json();
      })
      .then(data => {
        this.snackBar.open('User added successfully!', 'Close', { duration: 2000 });
        this.loadUsers();
        this.isLoading = false;
      })
      .catch(() => {
        this.snackBar.open('Failed to add user!', 'Close', { duration: 2000 });
        this.isLoading = false;
      });
  }
  loadUsers() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}user`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.users = data || [];
        console.log(this.users);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  editUserData() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}user/${this.userModel.id}`;
    const token = localStorage.getItem('ng-matero-token');

    const formData = new FormData();
    formData.append('name', this.userModel.name);
    formData.append('email', this.userModel.email);

    formData.append('roleId', this.userModel.roleId);
    formData.append('status', 'Active');
    if (this.selectedProfilePic) {
      formData.append('profilePic', this.selectedProfilePic);
    } else {
      formData.append('profilePic', '');
    }
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
      },
      body: formData,
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to add user');
        return res.json();
      })
      .then(data => {
        this.snackBar.open('User added successfully!', 'Close', { duration: 2000 });
        this.loadUsers();
        this.isLoading = false;
      })
      .catch(() => {
        this.snackBar.open('Failed to add user!', 'Close', { duration: 2000 });
        this.isLoading = false;
      });
  }
  edit(value: any) {
    // Bind value with userModel except password (set password to null)
    this.userModel = { ...value, password: null };
    console.log(value);

    this.isEditMode = true;
    this.openAddRoleDialog();
  }
  addnewuser() {
    this.isEditMode = false;
    this.userModel = {};
    this.openAddRoleDialog();
  }

  changeSelect(e: any) {
    console.log(e);
  }

  changeSort(e: any) {
    console.log(e);
  }
  saveUser(): void {
    // Handle form submission
    if (this.isEditMode) {
      this.editUserData();
      this.selectedProfilePic = null;
      this.loadUsers();
      this.userModel = {};
      this.dialog.closeAll(); // Close the dialog after submission
    } else {
      this.saveUserData();
      this.selectedProfilePic = null;
      this.loadUsers();
      this.userModel = {}; // Reset the form after submission
      this.dialog.closeAll();
    }
  }
  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onPermissionChange() {
    // //this.currentPermissions = this.permissionsOfRole[this.currentRole];
    // this.rolesSrv.flushRolesAndPermissions();
    // this.rolesSrv.addRoleWithPermissions(this.currentRole, this.currentPermissions);
  }
}
