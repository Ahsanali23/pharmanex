import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { Subject } from 'rxjs';
import { PageHeaderComponent } from '@shared';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';

import { debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerModule,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
@Component({
  selector: 'app-purchase',
  templateUrl: './salesandPurchase.component.html',
  styleUrl: './salesandpurchase.component.scss',
  standalone: true,
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
    MtxGridModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    MtxDatetimepickerModule,
  ],
})
export class salesandPurchaseComponent implements OnInit {
  @ViewChild('purchaseDialog') purchaseDialog: any;
  @ViewChild('purchaseItemDialog') purchaseItemDialog: any;
  @ViewChild('viewPurchaseDialog') viewPurchaseDialog: any;
  @ViewChild('supplierDialog') supplierDialog: any;
  @ViewChild('quickAddSupplierDialog') quickAddSupplierDialog: any;
  private readonly _destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);

  supplierLoading = false;
  isLoading = false;
  multiSelectable = false;
  rowSelectable = false;
  hideRowSelectionCheckbox = false;
  showToolbar = true;
  columnHideable = true;
  columnSortable = true;
  columnPinnable = true;
  rowHover = true;
  rowStriped = true;
  showPaginator = false;
  expandable = false;
  columnResizable = true;
  //datetime
  type: MtxDatetimepickerType = 'date';
  mode: MtxDatetimepickerMode = 'portrait';
  startView: MtxCalendarView = 'month';
  multiYearSelector = false;
  touchUi = false;
  twelvehour = false;

  timeInput = true;
  timeInputAutoFocus = true;
  customHeader!: any;
  actionButtons = false;
  showWeekNumbers = false;
  datetime = '';
  ///end dateime
  searchText = '';
  private searchSubject = new Subject<string>();
  filteredPurchases: any[] = [];
  fromDate: Date | null = null;
  toDate: Date | null = null;
  tableColumns: MtxGridColumn[] = [
    {
      header: 'Date',
      field: 'date',
      sortable: false,
      formatter: (row: any) => new Date(row.date).toLocaleDateString(),
    },
    { header: 'Type', field: 'type', sortable: false },
    { header: 'Invoice No', field: 'invId', sortable: false },
    { header: 'Total Amount', field: 'totalAmount', type: 'number' },
    // {
    //   header: 'Actions',
    //   field: 'actions',
    //   type: 'button',
    //   buttons: [
    //     {
    //       type: 'icon',
    //       icon: 'print',
    //       tooltip: 'Print',
    //       click: (record: any) => this.printReport(record)
    //     }
    //   ]
    // }
  ];
  // Table data source
  tableData: any[] = [];
  // Add other properties and methods here

  ngOnInit() {
    // Setup search with debounce
  }

  changeSelect(e: any) {
    console.log(e);
  }

  changeSort(e: any) {
    console.log(e);
  }

  onDateSearch() {
    this.isLoading = true;
    if (!this.fromDate || !this.toDate) {
      this.snackBar.open(this.translate.instant('report.selectDate'), 'OK', {
        duration: 3000,
      });
      return;
    }

    // Ensure dates are formatted as yyyy-MM-dd for the API
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const fromDateStr = formatDate(this.fromDate);
    const toDateStr = formatDate(this.toDate);

    const apiUrl = `${environment.apiUrl || ''}Report/searchSaleAndPurchase?from=${fromDateStr}&to=${toDateStr}`;
    //const apiUrl = `${environment.apiUrl || ''}Report/searchSaleAndPurchase?fromDate=${this.fromDate ? this.fromDate.toISOString() : ''}&toDate=${this.toDate ? this.toDate.toISOString() : ''}`;
    if (!this.fromDate && !this.toDate) {
      this.snackBar.open(this.translate.instant('report.selectDate'), 'OK', {
        duration: 3000,
      });
      return;
    }
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.tableData = data;

        this.isLoading = false;
      })
      .catch(() => {
        this.snackBar.open(this.translate.instant('report.error'), 'OK', {
          duration: 3000,
        });

        this.isLoading = false;
      });
  }
  getUserName(userId: string): string {
    // const user = this.users.find(u => u.id === userId);
    // return user ? user.name : userId;
    return '';
  }

  calculateItemTotal(item: any): number {
    return item.quantity * item.price;
  }
  printTable(): void {
    // Get the table element by id or class
    const table = document.getElementById('report-table');
    if (!table) {
      this.snackBar.open('Table not found!', 'OK', { duration: 2000 });
      return;
    }

    // Calculate totals
    const totalSales = this.tableData
      .filter(r => r.type === 'Sale')
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    const totalPurchase = this.tableData
      .filter(r => r.type === 'Purchase')
      .reduce((sum, r) => sum + Number(r.totalAmount), 0);

    // Prepare print content
    const printContents = `
    <h2>Sales & Purchase Report</h2>
    ${table.outerHTML}
    <div style="margin-top:20px;">
      <strong>Total Sales:</strong> ${totalSales.toFixed(2)}<br>
      <strong>Total Purchase:</strong> ${totalPurchase.toFixed(2)}
    </div>
  `;

    const printWindow = window.open('', '', 'height=700,width=900');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Report</title>');
      printWindow.document.write(
        '<style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}</style>'
      );
      printWindow.document.write('</head><body>');
      printWindow.document.write(printContents);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.print();
    }
  }
}
