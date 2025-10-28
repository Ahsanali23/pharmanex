import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
// import { RouterLink } from '@angular/router';
import { SettingsService } from '@core';
import { MtxAlertModule } from '@ng-matero/extensions/alert';
import { MtxProgressModule } from '@ng-matero/extensions/progress';
import { Subscription } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';

export interface ChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  title: ApexTitleSubtitle;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardService],
  imports: [
    // RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatListModule,
    MatGridListModule,
    MatTableModule,
    MatTabsModule,
    MtxProgressModule,
    MtxAlertModule,
    NgApexchartsModule,
    CommonModule,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly settings = inject(SettingsService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dashboardSrv = inject(DashboardService);
  public salesmenBarChartOptions: any;
  private readonly snackBar = inject(MatSnackBar);
  constructor() {
    this.salesmenBarChartOptions = {
      series: [
        {
          name: 'Sales',
          data: [120, 90, 150, 80, 70], // Example sales data
        },
      ],
      chart: {
        type: 'bar',
        height: 350,
      },
      xaxis: {
        categories: ['John', 'Jane', 'Bob', 'Alice', 'Tom'], // Salesmen names
      },
      title: {
        text: '',
      },
    };
  }
  displayedColumns: string[] = ['id', 'name', 'quantity', 'category'];
  dataSource: { id: number; name: string; quantity: number; category: string; unit: string }[] = [];
  displayedPuchaseColumns: string[] = [
    'id',
    'invoiceNumber',
    'totalAmount',
    'supplier',
    'user',
    'itemsCount',
    'purchaseDate',
  ];

  todayPurchase: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    purchaseDate: string;
    supplier: string;
    user: string;
    itemsCount: number;
  }[] = [];
  displayedSalesColumns: string[] = [
    'id',
    'invoiceNumber',
    'totalAmount',
    'customer',
    'user',
    'itemsCount',
    'salesDate',
  ];

  todaySales: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    salesDate: string;
    customer: string;
    user: string;
    itemsCount: number;
  }[] = [];

  messages = this.dashboardSrv.getMessages();

  charts = this.dashboardSrv.getCharts();

  chart1?: ApexCharts;
  chart2?: ApexCharts;

  stats: { color: string; title: string; amount: string; [key: string]: any }[] = [];

  notifySubscription = Subscription.EMPTY;

  isShowAlert = true;

  // introducingItems = [
  //   {
  //     name: 'Acrodata GUI',
  //     description: 'A JSON powered GUI for configurable panels.',
  //     link: 'https://github.com/acrodata/gui',
  //   },
  //   {
  //     name: 'Code Editor',
  //     description: 'The CodeMirror 6 wrapper for Angular.',
  //     link: 'https://github.com/acrodata/code-editor',
  //   },
  //   {
  //     name: 'Watermark',
  //     description: 'A watermark component that can prevent deletion.',
  //     link: 'https://github.com/acrodata/watermark',
  //   },
  //   {
  //     name: 'RnD Dialog',
  //     description: 'Resizable and draggable dialog based on CDK dialog.',
  //     link: 'https://github.com/acrodata/rnd-dialog',
  //   },
  // ];

  // introducingItem = this.introducingItems[this.getRandom(0, 3)];

  ngOnInit() {
    this.loadsalePurchase();
    this.loadCategoryWiseSales();
    this.loadSaleByUser();
    this.loadLowStockProducts();
    this.loadTodayPurchase();
    this.loadTodaySales();

    this.notifySubscription = this.settings.notify.subscribe(opts => {
      this.loadStats();

      this.updateCharts();
    });
  }

  ngAfterViewInit() {
    this.ngZone.runOutsideAngular(() => this.initCharts());
  }

  ngOnDestroy() {
    this.chart1?.destroy();
    this.chart2?.destroy();

    this.notifySubscription.unsubscribe();
  }

  initCharts() {
    // this.chart1 = new ApexCharts(document.querySelector('#chart1'), this.charts1);
    // console.log(this.charts1);
    // this.chart1?.render();
    // this.chart2 = new ApexCharts(document.querySelector('#chart2'), this.charts[1]);
    // this.chart2?.render();

    this.updateCharts();
  }

  updateCharts() {
    const isDark = this.settings.getThemeColor() == 'dark';

    this.chart1?.updateOptions({
      chart: {
        foreColor: isDark ? '#ccc' : '#333',
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
      },
      grid: {
        borderColor: isDark ? '#5a5a5a' : '#e1e1e1',
      },
    });

    this.chart2?.updateOptions({
      chart: {
        foreColor: isDark ? '#ccc' : '#333',
      },
      plotOptions: {
        radar: {
          polygons: {
            strokeColors: isDark ? '#5a5a5a' : '#e1e1e1',
            connectorColors: isDark ? '#5a5a5a' : '#e1e1e1',
            fill: {
              colors: isDark ? ['#2c2c2c', '#222'] : ['#f2f2f2', '#fff'],
            },
          },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
      },
    });
  }

  onAlertDismiss() {
    this.isShowAlert = false;
  }
  loadStats(type = 'monthly') {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/summary-cards?filter=${type}`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.stats = Array.isArray(data)
          ? data.map((item: any) => ({
              color: item.color || '',
              title: item.title || '',
              amount: item.amount || '',
              ...item,
            }))
          : [];
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  loadsalePurchase(type = 'monthly') {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/sales-purchase-chart?filter=${type}`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.chart1 = new ApexCharts(document.querySelector('#chart1'), data);
        this.chart1?.render();

        this.cdr.markForCheck();
        this.updateCharts();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }

  loadCategoryWiseSales() {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/monthly-category-sales-donut`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log('Chart data:', data);

        this.chart2 = new ApexCharts(document.querySelector('#chart2'), data);
        this.chart2?.render();

        this.cdr.markForCheck();
        this.updateCharts();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  loadSaleByUser(type = 'monthly') {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/monthly-sales-by-salesmen?filter=${type}`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.salesmenBarChartOptions = data;

        this.cdr.markForCheck();
        this.updateCharts();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }

  loadLowStockProducts() {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/low-stock-products`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        // Map the API data to match the displayedColumns structure
        this.dataSource = data;
        this.dataSource = this.dataSource.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
          unit: item.unit,
        }));
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  loadTodayPurchase() {
    const apiUrl = `${environment.apiUrl || ''}Dashboard/today-purchase`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.todayPurchase = data;
        // Assuming the API returns an array of purchase objects

        this.todayPurchase = this.todayPurchase.map((item: any) => ({
          id: item.id,
          invoiceNumber: item.invoiceNo,
          supplier: item.supplier,
          user: item.user,
          totalAmount: item.totalAmount,
          itemsCount: item.itemsCount,
          purchaseDate: item.purchaseDate,
        }));
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  loadTodaySales() {
    this.todaySales = [];
    const apiUrl = `${environment.apiUrl || ''}Dashboard/today-sales`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.todaySales = data;
        // Assuming the API returns an array of purchase objects

        this.todaySales = this.todaySales.map((item: any) => ({
          id: item.id,
          invoiceNumber: item.invoiceNo,
          customer: item.customer,
          user: item.user,
          totalAmount: item.totalAmount,
          itemsCount: item.itemsCount,
          salesDate: item.saleDate,
        }));
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.snackBar.open('unable to get users!', 'Close', { duration: 2000 });
      });
  }
  // getRandom(min: number, max: number) {
  //   return Math.floor(Math.random() * (max - min + 1)) + min;
  // }
}
