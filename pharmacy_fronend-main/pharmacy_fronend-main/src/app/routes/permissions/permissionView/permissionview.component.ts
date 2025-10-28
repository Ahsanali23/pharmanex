import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '@env/environment';
import { PageHeaderComponent } from '@shared';
import { is } from 'date-fns/locale';

@Component({
  selector: 'app-table-kitchen-sink',
  templateUrl: './permissionview.component.html',
  styleUrl: './permissionview.component.scss',
  providers: [],
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    MtxGridModule,
    PageHeaderComponent,
    MatRadioModule,
    MatCardModule,
  ],
})
export class PermissionViewComponent implements OnInit {
  private readonly translate = inject(TranslateService);
  //private readonly dataSrv = inject(TablesDataService);
  private readonly dialog = inject(MtxDialog);

  columns: MtxGridColumn[] = [
    {
      header: this.translate.stream('name'),
      field: 'name',
      sortable: true,
      disabled: true,
      //   minWidth: 100,
      width: '100px',
    },
    {
      header: this.translate.stream('Description'),
      field: 'module',
      //   minWidth: 100,
    },
  ];
  list: any[] = [];
  isLoading = true;

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
    this.list = [];
    this.isLoading = true;
    this.loadData();
    this.isLoading = false;
  }

  edit(value: any) {}

  delete(value: any) {
    this.dialog.alert(`You have deleted ${value.position}!`);
  }

  loadData() {
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
        this.list = data || [];
        console.log(this.list);
        this.isLoading = false;
      })
      .catch(() => {
        this.isLoading = false;
      });
  }
  changeSelect(e: any) {
    console.log(e);
  }

  changeSort(e: any) {
    console.log(e);
  }

  enableRowExpandable() {
    this.columns[0].showExpand = this.expandable;
  }

  updateCell() {
    this.list = this.list.map(item => {
      item.weight = Math.round(Math.random() * 1000) / 100;
      return item;
    });
  }

  updateList() {
    this.list = this.list.splice(-1).concat(this.list);
  }
}
