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
import { MatTableModule } from '@angular/material/table';
import { MtxGridColumn, MtxGridModule } from '@ng-matero/extensions/grid';
import { TranslateService } from '@ngx-translate/core';
import { MtxDialog } from '@ng-matero/extensions/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { Sale, SaleItem, Customer } from './sale.interface';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerModule,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
@Component({
  selector: 'app-sale',
  templateUrl: './sale.component.html',
  styleUrl: './sale.component.scss',
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
    MtxSelectModule,
    MtxDatetimepickerModule,
  ],
})
export class SaleComponent implements OnInit, OnDestroy {
  @ViewChild('saleDialog') saleDialog: any;
  @ViewChild('saleItemDialog') saleItemDialog: any;
  @ViewChild('viewSaleDialog') viewSaleDialog: any;
  @ViewChild('customerDialog') customerDialog: any;
  @ViewChild('quickAddCustomerDialog') quickAddCustomerDialog: any;
  private readonly _destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
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
  ///end dateime
  dialogData: any = {
    sale: null,
  };

  isEditMode = false;
  isCustomerEditMode = false;
  customerForm: Customer = {
    id: 0,
    name: '',
    phone: '',
    address: '',
    email: '',
  };

  saleForm: Sale = {
    customerId: 0,
    userId: 0,
    totalAmount: 0,
    invoiceNo: '',
    purchaseDate: new Date(),
    items: [],
  };

  saleItemForm: SaleItem = {
    productId: 0,
    quantity: 0,
    price: 0,
    total: 0,
  };

  products: {
    id: number;
    name: string;
    categoryId: number;
    category: string;
    barcode: string;
    brand: string;
    costPrice: number;
    salePrice: number;
    quantity: number;
    unit: string;
    expiryDate: string;
    alertQuantity: number;
    createdAt: string;
    imageUrl: string;
  }[] = [];

  customers: Customer[] = [
    {
      id: 1,
      name: 'Customer A',
      phone: '123-456-7890',
      address: '123 Main St',
      email: 'customerA@example.com',
      createdAt: new Date('2024-01-01'),
    },
    {
      id: 2,
      name: 'Customer B',
      phone: '234-567-8901',
      address: '456 Oak St',
      email: 'customerB@example.com',
      createdAt: new Date('2024-01-02'),
    },
    {
      id: 3,
      name: 'Customer C',
      phone: '345-678-9012',
      address: '789 Pine St',
      email: 'customerC@example.com',
      createdAt: new Date('2024-01-03'),
    },
  ];

  users = [
    { id: 1, name: 'User A' },
    { id: 2, name: 'User B' },
    { id: 3, name: 'User C' },
  ];

  sales: Sale[] = [
    {
      id: 1,
      customerId: 1,
      userId: 1,
      totalAmount: 1500.0,
      invoiceNo: 'INV-001',
      purchaseDate: new Date('2024-03-15'),
      items: [
        {
          id: 1,
          saleId: 1,
          productId: 1,
          quantity: 10,
          price: 10.0,
          total: 100.0,
        },
      ],
    },
  ];

  itemColumns: MtxGridColumn[] = [
    {
      header: 'Product',
      field: 'productId',
      width: '150px',
      formatter: (row: any) => this.getProductName(row.productId),
    },
    {
      header: 'Quantity',
      field: 'quantity',
      width: '100px',
    },
    {
      header: 'Price',
      field: 'price',
      width: '100px',
      formatter: (row: any) => `$${row.price.toFixed(2)}`,
    },
    {
      header: 'Total',
      field: 'total',
      width: '100px',
      formatter: (row: any) => `$${row.total.toFixed(2)}`,
    },
    {
      header: 'Operation',
      field: 'operation',
      width: '100px',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: record => this.editItem(record),
        },
        {
          type: 'icon',
          color: 'warn',
          icon: 'delete',
          tooltip: 'Delete',
          click: record => this.deleteItem(record),
        },
      ],
    },
  ];

  columns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '80px',
    },
    {
      header: 'Customer',
      field: 'customerId',
      sortable: true,
      width: '120px',
      formatter: (row: any) => this.getCustomerName(row.customerId),
    },
    {
      header: 'User',
      field: 'userId',
      sortable: true,
      width: '120px',
      formatter: (row: any) => this.getUserName(row.userId),
    },
    {
      header: 'Total Amount',
      field: 'totalAmount',
      width: '120px',
      formatter: (row: any) => `$${row.totalAmount.toFixed(2)}`,
    },
    {
      header: 'Invoice No',
      field: 'invoiceNo',
      width: '120px',
    },
    {
      header: 'Purchase Date',
      field: 'purchaseDate',
      width: '120px',
      formatter: (row: any) =>
        row.purchaseDate ? new Date(row.purchaseDate).toLocaleDateString() : '',
    },
    {
      header: 'Operation',
      field: 'operation',
      minWidth: 140,
      width: '140px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'visibility',
          tooltip: 'View',
          click: record => this.printSale(record),
        },
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: record => this.edit(record),
        },
        {
          type: 'icon',
          icon: 'delete',
          tooltip: 'Edit',
          click: record => this.delete(record),
        },
        {
          type: 'icon',
          icon: 'location_on', // Use Material icon name for location
          tooltip: 'Location map',
          click: record => this.goToDirections(record.customerId),
        },
      ],
    },
  ];

  customerColumns: MtxGridColumn[] = [
    {
      header: 'ID',
      field: 'id',
      width: '80px',
    },
    {
      header: 'Name',
      field: 'name',
      width: '150px',
    },
    {
      header: 'Phone',
      field: 'phone',
      width: '120px',
    },
    {
      header: 'Email',
      field: 'email',
      width: '200px',
    },
    {
      header: 'Address',
      field: 'address',
      width: '200px',
    },
    {
      header: 'Created At',
      field: 'createdAt',
      width: '120px',
      formatter: (row: any) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : ''),
    },
    {
      header: 'Operation',
      field: 'operation',
      width: '120px',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: record => this.editCustomer(record),
        },
        // {
        //   type: 'icon',
        //   color: 'warn',
        //   icon: 'delete',
        //   tooltip: 'Delete',
        //   pop: {
        //     title: 'Confirm Delete',
        //     closeText: 'Cancel',
        //     okText: 'Delete',
        //   },
        //   click: record => this.deleteCustomer(record),
        // },
      ],
    },
  ];
  customerLoading = false;
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
  showPaginator = true;
  expandable = false;
  columnResizable = true;

  searchText = '';
  private searchSubject = new Subject<string>();
  filteredSales: Sale[] = [];
  isItemSaleEditMode = false;
  itemDialogRef: any;
  saleDialogRef: any;
  ngOnInit() {
    this.filteredSales = [...this.sales];
    this.loadProducts();
    this.loadCustomer();
    this.loadSales();
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
      this.filterSales(searchText);
    });

    // Initialize with some sample data if empty
    if (this.sales.length === 0) {
      this.sales = [
        {
          id: 1,
          customerId: 1,
          userId: 1,
          totalAmount: 1500.0,
          invoiceNo: 'INV-001',
          purchaseDate: new Date('2024-03-15'),
          items: [
            {
              id: 1,
              saleId: 1,
              productId: 1,
              quantity: 10,
              price: 10.0,
              total: 100.0,
            },
          ],
        },
      ];
      this.filteredSales = [...this.sales];
    }
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  filterSales(searchText: string): void {
    if (!searchText) {
      this.filteredSales = [...this.sales];
      return;
    }

    const searchLower = searchText.toLowerCase();
    this.filteredSales = this.sales.filter(sale => {
      return (
        sale.id?.toString().includes(searchLower) ||
        this.getCustomerName(sale.customerId).toLowerCase().includes(searchLower) ||
        this.getUserName(sale.userId).toLowerCase().includes(searchLower) ||
        sale.invoiceNo.toLowerCase().includes(searchLower) ||
        sale.totalAmount.toString().includes(searchLower) ||
        new Date(sale.purchaseDate).toLocaleDateString().includes(searchLower)
      );
    });
  }

  openAddSaleDialog(): void {
    this.isEditMode = false;
    this.saleForm = {
      customerId: 0,
      userId: 0,
      totalAmount: 0,
      invoiceNo: '',
      purchaseDate: new Date(),
      items: [],
    };

    this.saleDialogRef = this.dialog.open(this.saleDialog, {
      width: '600px',
      data: { isEditMode: this.isEditMode, saleForm: this.saleForm },
    });

    this.saleDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        //  this.saveSale(result);
      }
    });
  }

  edit(sale: Sale): void {
    this.isEditMode = true;
    this.saleForm = {
      ...sale,
      items: sale.items || [],
    };

    this.saleDialogRef = this.dialog.open(this.saleDialog, {
      width: '600px',
      data: { isEditMode: this.isEditMode, saleForm: this.saleForm },
    });

    this.saleDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.saveSale(result);
      }
    });
  }

  delete(sale: Sale): void {
    const index = this.sales.findIndex(s => s.id === sale.id);
    console.log('Deleting sale:', sale, 'Index:', index);
    const apiUrl = `${environment.apiUrl || ''}sales/${sale.id}`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (response.ok) {
          this.snackBar.open('Sale deleted successfully!', 'Close', { duration: 2000 });
          this.loadSales();
        } else {
          throw new Error('Failed to delete sale');
        }
      })
      .catch(error => {
        console.error('Error deleting sale:', error);
        this.snackBar.open('Failed to delete sale. Please try again.', 'Close', { duration: 2000 });
      });
    // if (index > -1) {
    //   this.sales.splice(index, 1);
    // }
  }

  saveSale(saleData: Sale): void {
    if (this.isEditMode) {
      const index = this.sales.findIndex(s => s.id === saleData.id);
      if (index > -1) {
        this.sales[index] = saleData;
      }
      this.updateSales(saleData);
    } else {
      const newSale = {
        ...saleData,
        id: this.sales.length + 1,
      };
      this.addSales(newSale);
      //this.loadSales();
      //this.sales.push(newSale);
    }
  }

  changeSelect(e: any) {
    console.log(e);
  }

  changeSort(e: any) {
    console.log(e);
  }

  getProductName(productId: number): string {
    const product = this.products.find(p => p.id === productId);
    return product ? product.name : productId.toString();
  }

  getCustomerName(customerId: number): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.name : customerId.toString();
  }

  getUserName(userId: number): string {
    const user = this.users.find(u => u.id === userId);
    return user ? user.name : userId.toString();
  }

  calculateItemTotal(item: SaleItem): number {
    return item.quantity * item.price;
  }

  updateSaleTotal(): void {
    this.saleForm.totalAmount =
      this.saleForm.items?.reduce((sum: number, item: SaleItem) => sum + item.total, 0) || 0;
  }

  openAddItemDialog(): void {
    this.saleItemForm = {
      productId: 0,
      quantity: 0,
      price: 0,
      total: 0,
    };

    this.itemDialogRef = this.dialog.open(this.saleItemDialog, {
      width: '500px',
      data: { item: this.saleItemForm },
    });
    this.isItemSaleEditMode = false;
    this.itemDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        result.total = this.calculateItemTotal(result);
        this.saleForm.items?.push(result);
        this.saleForm.items = [...this.saleForm.items];
        this.updateSaleTotal();
      }
    });
  }

  editItem(item: SaleItem): void {
    console.log('Editing item:', item);
    this.isItemSaleEditMode = true;
    const itemWithId = { ...item, id: item.id ?? item.productId };
    this.saleItemForm = { ...itemWithId }; // Bind to form for editing
    this.itemDialogRef = this.dialog.open(this.saleItemDialog, {
      width: '500px',
      data: { item: { ...this.saleItemForm } },
    });

    this.itemDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        const index = this.saleForm.items?.findIndex((i: SaleItem) => i.id === result.id);
        if (index !== undefined && index > -1) {
          result.total = this.calculateItemTotal(result);
          this.saleForm.items![index] = result;
          this.saleForm.items = [...this.saleForm.items];
          this.updateSaleTotal();
        }
      }
    });
  }

  deleteItem(item: SaleItem): void {
    const index = this.saleForm.items?.findIndex((i: SaleItem) => i.id === item.id);
    if (index !== undefined && index > -1) {
      this.saleForm.items?.splice(index, 1);
      this.saleForm.items = [...this.saleForm.items];
      this.updateSaleTotal();
    }
  }

  onProductChange(item: SaleItem): void {
    const product = this.products.find(p => p.id === item.productId);
    if (product) {
      item.price = product.salePrice;
      item.total = this.calculateItemTotal(item);
    }
  }

  onQuantityChange(item: SaleItem): void {
    const product = this.products.find(p => p.id === item.productId);
    if (product && item.quantity > product.quantity) {
      this.snackBar.open(
        `Quantity exceeds available stock (${product.quantity}). Please adjust.`,
        'Close',
        { duration: 2500 }
      );
      item.quantity = 0;
    }
    item.total = this.calculateItemTotal(item);
  }

  view(sale: Sale): void {
    this.dialogData.sale = sale;
    const dialogRef = this.dialog.open(this.viewSaleDialog, {
      width: '800px',
    });
  }

  openAddCustomerDialog(): void {
    this.isCustomerEditMode = false;
    this.customerForm = {
      id: 0,
      name: '',
      phone: '',
      address: '',
      email: '',
    };

    const dialogRef = this.dialog.open(this.customerDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveCustomer(result);
      }
    });
  }

  editCustomer(customer: Customer): void {
    this.isCustomerEditMode = true;
    this.customerForm = { ...customer };

    const dialogRef = this.dialog.open(this.customerDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveCustomer(result);
      }
    });
  }

  deleteCustomer(customer: Customer): void {
    const index = this.customers.findIndex(c => c.id === customer.id);
    if (index > -1) {
      this.customers.splice(index, 1);
    }
  }

  saveCustomer(customerData: Customer): void {
    if (this.isCustomerEditMode) {
      const index = this.customers.findIndex(c => c.id === customerData.id);
      if (index > -1) {
        this.customers[index] = customerData;
      }
      this.updateCustomer(customerData);
    } else {
      const newCustomer = {
        ...customerData,
        id: this.customers.length + 1,
        createdAt: new Date(),
      };
      const newSyCustomer = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        address: newCustomer.address,
        email: newCustomer.email,
      };
      this.addCustomer(newSyCustomer);
      // this.loadCustomer();
      //  this.customers.push(newCustomer);
    }
  }

  openQuickAddCustomerDialog(): void {
    this.customerForm = {
      id: 0,
      name: '',
      phone: '',
      address: '',
      email: '',
    };

    const dialogRef = this.dialog.open(this.quickAddCustomerDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveQuickCustomer();
      }
    });
  }

  saveQuickCustomer(): void {
    const newCustomer = {
      ...this.customerForm,
      id: this.customers.length + 1,
      createdAt: new Date(),
    };
    const newSyCustomer = {
      name: newCustomer.name,
      phone: newCustomer.phone,
      address: newCustomer.address,
      email: newCustomer.email,
    };
    this.addCustomer(newSyCustomer);
    this.loadCustomer();
    // this.customers.push(newCustomer);
    this.saleForm.customerId = newCustomer.id;
    this.dialog.closeAll();
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  loadProducts() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/products`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(data => {
        this.products = data;
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      });
  }
  loadCustomer() {
    this.customerLoading = true;
    const apiUrl = `${environment.apiUrl || ''}customer/All`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        //this.customers = data || [];
        this.customers = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          address: s.address,
          email: s.email,
          createdAt: s.createdAt,
        }));
        this.customerLoading = false;
      })
      .catch(() => {
        this.customerLoading = false;
      });
  }
  addCustomer(supplier: any) {
    this.customerLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Customer/add`;
    const token = localStorage.getItem('ng-matero-token');

    // Prepare data to match SupplierDto structure
    const fordata = {
      Name: supplier.name,
      Phone: supplier.phone,
      Address: supplier.address,
      Email: supplier.email,
    };
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: fordata ? JSON.stringify(fordata) : null,
    })
      .then(res => res.json())
      .then(data => {
        //this.customers.push(data);
        this.snackBar.open('Customer added successfully!', 'Close', { duration: 2000 });
        this.customerLoading = false;
        this.loadCustomer();
      })
      .catch(() => {
        this.snackBar.open('Failed to add Customer. Please try again.', 'Close', {
          duration: 2000,
        });
        this.customerLoading = false;
      });
  }
  updateCustomer(supplier: any) {
    this.customerLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Customer/update/${supplier.id}`;
    const token = localStorage.getItem('ng-matero-token');

    // Prepare data to match SupplierDto structure
    const fordata = {
      Name: supplier.name,
      Phone: supplier.phone,
      Address: supplier.address,
      Email: supplier.email,
    };
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: fordata ? JSON.stringify(fordata) : null,
    })
      .then(res => res.json())
      .then(data => {
        //this.customers.push(data);
        this.snackBar.open('Customer updated successfully!', 'Close', { duration: 2000 });

        this.customerLoading = false;
        this.loadCustomer();
      })
      .catch(() => {
        this.snackBar.open('Failed to UPDATED Customer. Please try again.', 'Close', {
          duration: 2000,
        });
        this.customerLoading = false;
      });
  }
  private mapSaleDtoToSale(dto: any): Sale {
    return {
      id: dto.id,
      customerId: dto.customerId,
      userId: dto.userId,
      totalAmount: dto.totalAmount,
      invoiceNo: dto.invoiceNo,
      purchaseDate: new Date(dto.purchaseDate),
      items: (dto.items || []).map((item: any) => ({
        id: item.id,
        saleId: dto.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    };
  }

  loadSales() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}sales`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.sales = Array.isArray(data) ? data.map(s => this.mapSaleDtoToSale(s)) : [];
        //console.log('Mapped sales:', this.sales);
        this.filteredSales = [...this.sales];
        //console.log('Loaded purchases:', this.sales);
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error loading purchases:', error);
        this.sales = [];
        this.filteredSales = [];
        this.isLoading = false;
      });
  }

  addSales(sale: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}sales`;
    const token = localStorage.getItem('ng-matero-token');

    // Prepare data to match PurchaseDto structure
    const fordata = {
      CustomerId: sale.customerId,
      UserId: 0,
      TotalAmount: sale.totalAmount,
      InvoiceNo: '',
      SalesDate:
        sale.purchaseDate instanceof Date
          ? sale.purchaseDate.toISOString()
          : new Date(sale.purchaseDate).toISOString(),
      salesItems: sale.items.map((item: SaleItem) => ({
        ProductId: item.productId,
        Quantity: item.quantity,
        Price: item.price,
        Total: item.total,
      })),
    };

    fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: fordata ? JSON.stringify(fordata) : null,
    })
      .then(res => res.json())
      .then(data => {
        //this.sales.push(data);
        //  this.filteredSales = [...this.sales];
        this.snackBar.open('sales added successfully!', 'Close', { duration: 2000 });
        this.isLoading = false;
        this.loadSales();
      })
      .catch(error => {
        console.error('Error adding sale:', error);
        this.snackBar.open('Failed to add sale. Please try again.', 'Close', {
          duration: 2000,
        });
        this.loadSales();
        this.isLoading = false;
      });
  }
  updateSales(sale: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}sales/${sale.id}`;
    // Prepare data to match PurchaseDto structure
    const fordata = {
      CustomerId: sale.customerId,
      UserId: 0,
      TotalAmount: sale.totalAmount,
      InvoiceNo: '',
      salesDate:
        sale.purchaseDate instanceof Date
          ? sale.purchaseDate.toISOString()
          : new Date(sale.purchaseDate).toISOString(),
      salesItems: sale.items.map((item: SaleItem) => ({
        ProductId: item.productId,
        Quantity: item.quantity,
        Price: item.price,
        Total: item.total,
      })),
    };

    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: fordata ? JSON.stringify(fordata) : null,
    })
      .then(res => res.json())
      .then(data => {
        // this.sales.push(data);
        // this.filteredSales = [...this.sales];
        this.snackBar.open('sales updated successfully!', 'Close', { duration: 2000 });
        this.isLoading = false;
        this.loadSales();
      })
      .catch(error => {
        console.error('Error adding sale:', error);
        this.snackBar.open('Failed to updated sale. Please try again.', 'Close', {
          duration: 2000,
        });
        this.loadSales();
        this.isLoading = false;
      });
  }

  printSale(sale: Sale): void {
    // Open a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackBar.open('Please allow popups for printing', 'Close', { duration: 3000 });
      return;
    }

    // Get customer and user names
    const customerName = this.getCustomerName(sale.customerId);
    const userName = this.getUserName(sale.userId);
    const saleDate = new Date(sale.purchaseDate).toLocaleDateString();
    const items = sale.items || [];

    // Build the HTML content
    const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales Invoice - ${sale.invoiceNo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { color: #2c3e50; margin-bottom: 10px; }
          .header h2 { color: #7f8c8d; margin: 0; }
          .details-container { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
          .details-section { flex: 1; }
          .details-section h3 { color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          .details-section p { margin: 8px 0; font-size: 14px; }
          .details-section strong { color: #34495e; min-width: 120px; display: inline-block; }
          .items-section { margin-top: 30px; }
          .items-section h3 { color: #2c3e50; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; background-color: white; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f5f5f5; color: #2c3e50; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          td { color: #2c3e50; }
          .total-section { text-align: right; margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
          .total-section p { font-size: 16px; margin: 5px 0; }
          .total-amount { font-size: 20px; font-weight: bold; color: #2c3e50; }
          .no-print { text-align: center; margin-top: 20px; }
          .print-button { padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
          .print-button:hover { background-color: #2980b9; }
          @media print { .no-print { display: none; } body { margin: 0; } .details-container { background-color: white !important; -webkit-print-color-adjust: exact; } .total-section { background-color: white !important; -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sales Invoice</h1>
          <h2>${sale.invoiceNo}</h2>
        </div>
        
        <div class="details-container">
          <div class="details-section">
            <h3>Sale Information</h3>
            <p><strong>Invoice No:</strong> ${sale.invoiceNo}</p>
            <p><strong>Sale Date:</strong> ${saleDate}</p>
            <p><strong>Total Amount:</strong> $${sale.totalAmount.toFixed(2)}</p>
          </div>
          <div class="details-section">
            <h3>Contact Information</h3>
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>User:</strong> ${userName}</p>
          </div>
        </div>

        <div class="items-section">
          <h3>Sale Items</h3>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: SaleItem) => `
                <tr>
                  <td>${this.getProductName(item.productId)}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="total-section">
          <p class="total-amount">Total Amount: $${sale.totalAmount.toFixed(2)}</p>
        </div>

        <div class="no-print">
          <button class="print-button" onclick="window.print()">Print Invoice</button>
        </div>
      </body>
    </html>
  `;

    // Write the content to the new window
    printWindow.document.write(content);
    printWindow.document.close();
  }
  validateAndSaveSaleItem() {
    // Validate required fields
    if (
      !this.saleItemForm.productId ||
      !this.saleItemForm.quantity ||
      !this.saleItemForm.price ||
      this.saleItemForm.quantity <= 0 ||
      this.saleItemForm.price < 0
    ) {
      this.snackBar.open('Please fill all fields with valid values.', 'Close', { duration: 2000 });
      return;
    }
    console.log('Editing11 item at index:');
    // Check available stock
    const product = this.products.find(p => p.id === this.saleItemForm.productId);
    if (product && this.saleItemForm.quantity > product.quantity) {
      this.snackBar.open(
        `Quantity exceeds available stock (${product.quantity}). Please adjust.`,
        'Close',
        { duration: 2500 }
      );
      return;
    }

    // Check for duplicate product in the items list (if not editing)
    if (!this.isItemSaleEditMode) {
      const isDuplicate = this.saleForm.items.some(
        (item: any) =>
          item.productId === this.saleItemForm.productId &&
          (!this.isEditMode || item !== this.saleItemForm)
      );
      if (isDuplicate) {
        this.snackBar.open(
          'This product is already in the sale list. Edit or delete it first.',
          'Close',
          { duration: 2500 }
        );
        return;
      }
    }

    // If editing, update the item; otherwise, add new
    if (this.isItemSaleEditMode) {
      console.log('Editing11 item at index:', this.saleItemForm);
      const idx = this.saleForm.items.findIndex(
        (item: any) => item.productId === this.saleItemForm.productId
      );
      if (idx > -1) {
        this.saleForm.items[idx] = { ...this.saleItemForm };
        this.saleForm.items = [...this.saleForm.items]; // <-- Add this line
      }
      // this.isItemSaleEditMode = false;
    } else {
      this.saleItemForm.total = this.calculateItemTotal(this.saleItemForm);
      this.saleForm.items?.push(this.saleItemForm);
      this.saleForm.items = [...this.saleForm.items];
      //this.updateSaleTotal();
      //
      // this.saleItemForm.total = this.calculateItemTotal(this.saleItemForm);
      //this.saleForm.items.push({ ...this.saleItemForm });
    }

    // Reset form
    this.saleItemForm = {
      productId: 0,
      quantity: 0,
      price: 0,
      total: 0,
    };

    this.updateSaleTotal();
    if (this.itemDialogRef) {
      this.itemDialogRef.close();
    }
  }
  onDialogSave() {
    if (!this.saleForm.customerId || this.saleForm.customerId === 0) {
      this.snackBar.open('Please select a customer before saving.', 'Close', { duration: 2000 });
      return;
    }
    if (!this.saleForm.items || this.saleForm.items.length === 0) {
      this.snackBar.open('Please add at least one sale item before saving.', 'Close', {
        duration: 2000,
      });
      return;
    }

    this.saveSale(this.saleForm);

    this.saleDialogRef.close(this.saleForm); // Only close if valid!
  }
  isSaleItemFormValid(): boolean {
    return (
      !!this.saleItemForm.productId &&
      !!this.saleItemForm.quantity &&
      this.saleItemForm.quantity > 0 &&
      this.saleItemForm.price >= 0
    );
  }
  goToDirections(customerId: number) {
    // Example: environment.mapOrigin and environment.mapApiKey
    const supplier = environment.addressPharmacy;
    const destination = this.customers.find(s => s.id === customerId); // e.g., "Karachi"
    // You can add more params as needed

    // Construct the URL (Google Maps Directions as example)
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(supplier ? supplier : '')}&destination=${encodeURIComponent(destination?.address || '')}&travelmode=driving&dir_action=navigate`;
    console.log(url);
    // Open in a new tab
    window.open(url, '_blank');
  }
}
