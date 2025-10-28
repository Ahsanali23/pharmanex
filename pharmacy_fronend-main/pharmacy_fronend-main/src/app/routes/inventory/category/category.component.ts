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
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
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
export class CategoryComponent implements OnInit, OnDestroy {
  @ViewChild('roleDialog') roleDialog: any;
  private readonly _destroy$ = new Subject<void>();

  private readonly rolesSrv = inject(NgxRolesService);
  private readonly permissionsSrv = inject(NgxPermissionsService);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  categories: {
    id: string;
    name: string;
    description: string;
    prodcuts: any[];
  }[] = [];

  currentPermissions: string[] = [];
  isEditMode = false;
  roleForm: any = {
    name: '',
    description: '',
  };

  roles: {
    id: string;
    name: string;
    description: string;
  }[] = [];

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
        // {
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
    this.loadCategories();
  }

  openAddRoleDialog(): void {
    this.isEditMode = false;
    this.roleForm = {
      name: '',
      description: '',
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

  edit(role: any): void {
    this.isEditMode = true;
    this.roleForm = {
      ...role,
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

  saveRole(roleData: any): void {
    if (this.isEditMode) {
      console.log('Updating role:', roleData);
      this.editCategory(roleData);
      this.loadCategories();
    } else {
      this.saveCategory(roleData);
      const newRole = {
        ...roleData,
        id: (this.roles.length + 1).toString(),
      };
      this.loadCategories();
      //  this.roles.push(newRole);
    }
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
  loadCategories() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/categories`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.categories = data || [];
        console.log(this.categories);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }

  saveCategory(category: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/category`;
    const token = localStorage.getItem('ng-matero-token');
    // Prepare form data for adding a category
    if (!category.name || !category.description) {
      this.isLoading = false;
      return;
    }
    const formData = {
      name: category.name,
      description: category.description,
    };
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(data => {
        this.isLoading = false;
        this.snackBar.open('Catefory added successfully!', 'Close', { duration: 2000 });
        this.loadCategories();
      })
      .catch(() => {
        this.snackBar.open('Failed to add category!', 'Close', { duration: 2000 });

        this.isLoading = false;
      });
  }
  editCategory(category: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/category/${category.id}`;
    const token = localStorage.getItem('ng-matero-token');
    // Prepare form data for adding a category
    if (!category.name || !category.description) {
      this.isLoading = false;
      return;
    }
    const formData = {
      name: category.name,
      description: category.description,
    };
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })
      .then(res => res.json())
      .then(data => {
        this.isLoading = false;
        this.snackBar.open('Category updated successfully!', 'Close', { duration: 2000 });
        this.loadCategories();
      })
      .catch(() => {
        this.snackBar.open('Failed to update category!', 'Close', { duration: 2000 });
        this.isLoading = false;
      });
  }
}
