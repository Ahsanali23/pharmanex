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
import { PurchaseItem } from './purchase-item.interface';
import { Supplier } from './supplier.interface';
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
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrl: './purchase.component.scss',
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
export class PurchaseComponent implements OnInit, OnDestroy {
  @ViewChild('purchaseDialog') purchaseDialog: any;
  @ViewChild('purchaseItemDialog') purchaseItemDialog: any;
  @ViewChild('viewPurchaseDialog') viewPurchaseDialog: any;
  @ViewChild('supplierDialog') supplierDialog: any;
  @ViewChild('quickAddSupplierDialog') quickAddSupplierDialog: any;

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
  private readonly _destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly snackBar = inject(MatSnackBar);
  itemDialogRef: any;
  purchaseDialogRef: any;
  //dialogRef: any;
  dialogData: any = {
    purchase: null,
  };

  isEditMode = false;
  isSupplierEditMode = false;
  itemtableload = false;
  isItemPurchaseEditMode = false;
  supplierForm: Supplier = {
    name: '',
    phone: '',
    address: '',
    email: '',
  };

  purchaseForm: any = {
    supplierId: 0,
    userId: '',
    totalAmount: 0,
    invoiceNo: '',
    purchaseDate: new Date(),
    items: [] as PurchaseItem[],
  };

  purchaseItemForm: PurchaseItem = {
    productId: 0,
    productName: '',
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
  suppliers: Supplier[] = [];
  users = [];

  purchases: any[] = [];

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
      header: 'Supplier',
      field: 'supplierId',
      sortable: true,
      width: '120px',
      formatter: (row: any) => {
        const name = this.getSupplierName(row.supplierId);
        return name && name !== row.supplierId.toString() ? name : '';
      },
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
      minWidth: 180,
      width: '180px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'visibility',
          tooltip: 'View',
          click: record => this.view(record),
        },
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: record => this.edit(record),
        },
        {
          type: 'icon',
          icon: 'print',
          tooltip: 'Print PDF',
          click: record => this.printPurchase(record),
        },
        {
          type: 'icon',
          icon: 'location_on', // Use Material icon name for location
          tooltip: 'Location map',
          click: record => this.goToDirections(record.supplierId),
        },
      ],
    },
  ];

  supplierColumns: MtxGridColumn[] = [
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
          click: record => this.editSupplier(record),
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
        //   click: record => this.deleteSupplier(record),
        // },
      ],
    },
  ];
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
  showPaginator = true;
  expandable = false;
  columnResizable = true;

  searchText = '';
  private searchSubject = new Subject<string>();
  filteredPurchases: any[] = [];

  ngOnInit() {
    this.filteredPurchases = [...this.purchases];
    this.loadSupplier();
    this.loadProducts();
    this.loadPurchase();
    // Setup search with debounce
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(searchText => {
      this.filterPurchases(searchText);
    });
  }

  onSearchChange(searchText: string): void {
    this.searchSubject.next(searchText);
  }

  filterPurchases(searchText: string): void {
    if (!searchText) {
      this.filteredPurchases = [...this.purchases];
      return;
    }

    const searchLower = searchText.toLowerCase();
    this.filteredPurchases = this.purchases.filter(purchase => {
      return (
        purchase.id.toString().includes(searchLower) ||
        this.getSupplierName(purchase.supplierId).toLowerCase().includes(searchLower) ||
        this.getUserName(purchase.userId).toLowerCase().includes(searchLower) ||
        purchase.invoiceNo.toLowerCase().includes(searchLower) ||
        purchase.totalAmount.toString().includes(searchLower) ||
        new Date(purchase.purchaseDate).toLocaleDateString().includes(searchLower)
      );
    });
  }

  openAddPurchaseDialog(): void {
    this.isEditMode = false;
    this.purchaseForm = {
      supplierId: 0,
      userId: '',
      totalAmount: 0,
      invoiceNo: '',
      purchaseDate: new Date(),
      items: [],
    };

    this.purchaseDialogRef = this.dialog.open(this.purchaseDialog, {
      width: '600px',
      data: { isEditMode: this.isEditMode, purchaseForm: this.purchaseForm },
    });

    this.purchaseDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.savePurchase(result);
      }
    });
  }

  edit(purchase: any): void {
    this.isEditMode = true;
    this.purchaseForm = {
      id: purchase.id,
      supplierId: purchase.supplierId,
      userId: purchase.userId,
      totalAmount: purchase.totalAmount,
      invoiceNo: purchase.invoiceNo,
      purchaseDate: new Date(purchase.purchaseDate),
      items: purchase.purchaseItems.map((item: any) => ({
        productId: item.productId,
        productName: this.getProductName(item.productId),
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
    };

    this.purchaseDialogRef = this.dialog.open(this.purchaseDialog, {
      width: '800px',
      data: this.purchaseForm,
    });

    this.purchaseDialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // this.savePurchase(result);
      }
      this.isEditMode = false;
      this.purchaseForm = {
        supplierId: 0,
        userId: '',
        totalAmount: 0,
        invoiceNo: '',
        purchaseDate: new Date(),
        items: [],
      };
    });
  }

  delete(purchase: any): void {
    const index = this.purchases.findIndex(p => p.id === purchase.id);
    if (index > -1) {
      this.purchases.splice(index, 1);
    }
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

  savePurchase(purchaseData: any): void {
    if (!purchaseData.supplierId || purchaseData.supplierId === 0) {
      this.snackBar.open('Please select a supplier before saving.', 'Close', { duration: 2000 });
      return;
    }

    // Check if there are any purchase items
    if (!purchaseData.items || purchaseData.items.length === 0) {
      this.snackBar.open('Please add at least one purchase item before saving.', 'Close', {
        duration: 2000,
      });
      return;
    }

    if (this.isEditMode) {
      const index = this.purchases.findIndex(p => p.id === purchaseData.id);
      if (index > -1) {
        this.purchases[index] = purchaseData;
      }
      this.editPurchase(this.purchases[index]);
      //this.loadPurchase();
    } else {
      const newPurchase = {
        ...purchaseData,
        id: (this.purchases.length + 1).toString(),
      };
      this.addPurchase(newPurchase);
      //this.loadPurchase();
      //this.purchases.push(newPurchase);
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

  getSupplierName(supplierId: number | string): string {
    const supplier = this.suppliers.find(s => String(s.id) === String(supplierId));
    return supplier ? supplier.name : supplierId.toString();
  }

  getUserName(userId: string): string {
    // const user = this.users.find(u => u.id === userId);
    // return user ? user.name : userId;
    return '';
  }

  calculateItemTotal(item: PurchaseItem): number {
    return item.quantity * item.price;
  }

  updatePurchaseTotal(): void {
    this.purchaseForm.totalAmount = this.purchaseForm.items.reduce(
      (sum: number, item: PurchaseItem) => sum + item.total,
      0
    );
  }

  openAddItemDialog(): void {
    this.purchaseItemForm = {
      productId: 0,
      productName: '',
      quantity: 0,
      price: 0,
      total: 0,
    };
    this.isItemPurchaseEditMode = false;
    this.itemDialogRef = this.dialog.open(this.purchaseItemDialog, {
      width: '500px',
      data: { item: this.purchaseItemForm },
    });

    this.itemDialogRef.afterClosed().subscribe((result: PurchaseItem | undefined) => {
      if (result) {
        this.itemtableload = true;
        result.total = this.calculateItemTotal(result);
        const product = this.products.find(p => p.id === result.productId);
        result.productName = product ? product.name : '';
        this.purchaseForm.items.push(result);
        this.purchaseForm.items = [...this.purchaseForm.items];
        this.updatePurchaseTotal();
        this.itemtableload = false;
      }
    });
  }

  editItem(item: PurchaseItem): void {
    this.isItemPurchaseEditMode = true;
    // Ensure the item has an 'id' property for correct binding and lookup
    const itemWithId = { ...item, id: item.id ?? item.productId };
    this.purchaseItemForm = { ...itemWithId }; // Bind to form for editing
    this.itemDialogRef = this.dialog.open(this.purchaseItemDialog, {
      width: '500px',
      data: { item: { ...itemWithId } },
    });
    console.log(itemWithId);

    this.itemDialogRef.afterClosed().subscribe((result: PurchaseItem | undefined) => {
      if (result) {
        // Use productId for lookup if id is missing
        const index = this.purchaseForm.items.findIndex(
          (i: PurchaseItem) => (i.id ?? i.productId) === (result.id ?? result.productId)
        );
        if (index > -1) {
          result.total = this.calculateItemTotal(result);
          this.purchaseForm.items[index] = result;
          this.purchaseForm.items = [...this.purchaseForm.items];
          this.updatePurchaseTotal();
        }
      }
    });
  }

  deleteItem(item: PurchaseItem): void {
    const index = this.purchaseForm.items.findIndex((i: PurchaseItem) => i.id === item.id);
    if (index > -1) {
      this.purchaseForm.items.splice(index, 1);
      this.purchaseForm.items = [...this.purchaseForm.items];
      this.updatePurchaseTotal();
    }
  }

  onProductChange(item: PurchaseItem): void {
    console.log(item);
    const product = this.products.find(p => p.id === item.productId);
    if (product) {
      item.price = product.costPrice;
      item.total = this.calculateItemTotal(item);
    }
  }

  onQuantityChange(item: PurchaseItem): void {
    item.total = this.calculateItemTotal(item);
  }

  view(purchase: any): void {
    this.dialogData.purchase = purchase;
    const dialogRef = this.dialog.open(this.viewPurchaseDialog, {
      width: '800px',
    });
  }

  openAddSupplierDialog(): void {
    this.isSupplierEditMode = false;
    this.supplierForm = {
      name: '',
      phone: '',
      address: '',
      email: '',
    };

    const dialogRef = this.dialog.open(this.supplierDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveSupplier(result);
      }
    });
  }

  editSupplier(supplier: Supplier): void {
    this.isSupplierEditMode = true;
    this.supplierForm = { ...supplier };

    const dialogRef = this.dialog.open(this.supplierDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveSupplier(result);
      }
    });
  }

  deleteSupplier(supplier: Supplier): void {
    const index = this.suppliers.findIndex(s => s.id === supplier.id);
    if (index > -1) {
      this.suppliers.splice(index, 1);
    }
  }

  saveSupplier(supplierData: Supplier): void {
    if (this.isSupplierEditMode) {
      const index = this.suppliers.findIndex(s => s.id === supplierData.id);
      if (index > -1) {
        this.suppliers[index] = supplierData;
      }
      this.editSuppliers(this.suppliers[index]);
      //  this.loadSupplier();
    } else {
      const newSupplier = {
        ...supplierData,
        id: this.suppliers.length + 1,
        createdAt: new Date(),
      };
      this.addSupplier(newSupplier);
      //  this.loadSupplier();
    }
  }

  openQuickAddSupplierDialog(): void {
    this.supplierForm = {
      name: '',
      phone: '',
      address: '',
      email: '',
    };

    const dialogRef = this.dialog.open(this.quickAddSupplierDialog, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveQuickSupplier();
      }
    });
  }

  saveQuickSupplier(): void {
    const newSupplier = {
      ...this.supplierForm,
      id: this.suppliers.length + 1,
      createdAt: new Date(),
    };
    this.suppliers.push(newSupplier);
    this.purchaseForm.supplierId = newSupplier.id;
    this.dialog.closeAll();
  }
  loadPurchase() {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Purchase`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.loadSupplier();
        this.purchases = Array.isArray(data) ? data : [];
        this.filteredPurchases = [...this.purchases];
        this.loadProducts();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error loading purchases:', error);
        this.purchases = [];
        this.filteredPurchases = [];
        this.isLoading = false;
      });
  }
  loadSupplier() {
    this.supplierLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Supplier`;
    const token = localStorage.getItem('ng-matero-token');

    fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        this.suppliers = (data || []).map((s: any) => ({
          id: s.id,
          name: s.name || s.Name,
          phone: s.phone || s.Phone,
          address: s.address || s.Address,
          email: s.email || s.Email,
          createdAt: s.createdAt || s.CreatedAt,
        }));
        this.suppliers = [...this.suppliers];
        this.supplierLoading = false;
      })
      .catch(() => {
        this.supplierLoading = false;
      });
  }

  addSupplier(supplier: any) {
    this.supplierLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Supplier`;
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
        // this.suppliers.push(data);
        this.loadSupplier();
        this.snackBar.open('Supplier added successfully!', 'Close', { duration: 2000 });

        this.supplierLoading = false;
      })
      .catch(() => {
        this.snackBar.open('Failed to add supplier. Please try again.', 'Close', {
          duration: 2000,
        });
        this.supplierLoading = false;
      });
  }
  editSuppliers(supplier: any) {
    this.supplierLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Supplier/${supplier.id}`;
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
        this.loadSupplier();
        this.snackBar.open('Supplier updated successfully!', 'Close', { duration: 2000 });

        this.supplierLoading = false;
      })
      .catch(() => {
        this.snackBar.open('Failed to update supplier. Please try again.', 'Close', {
          duration: 2000,
        });
        this.supplierLoading = false;
      });
  }
  addPurchase(purchase: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Purchase`;
    const token = localStorage.getItem('ng-matero-token');

    // Prepare data to match PurchaseDto structure
    const fordata = {
      SupplierId: purchase.supplierId,
      UserId: purchase.userId,
      TotalAmount: purchase.totalAmount,
      InvoiceNo: purchase.invoiceNo,
      PurchaseDate: purchase.purchaseDate,
      PurchaseItems: purchase.items.map((item: PurchaseItem) => ({
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
        this.snackBar.open('Purchase added successfully!', 'Close', { duration: 2000 });
        this.loadPurchase();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error adding purchase:', error);
        this.snackBar.open('Failed to add purchase. Please try again.', 'Close', {
          duration: 2000,
        });
        this.loadPurchase();
        this.isLoading = false;
      });
  }

  editPurchase(purchase: any) {
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}Purchase/${purchase.id}`;
    const token = localStorage.getItem('ng-matero-token');

    // Prepare data to match PurchaseDto structure
    const fordata = {
      SupplierId: purchase.supplierId,
      UserId: purchase.userId,
      TotalAmount: purchase.totalAmount,
      InvoiceNo: purchase.invoiceNo,
      PurchaseDate: purchase.purchaseDate,
      PurchaseItems: purchase.items.map((item: PurchaseItem) => ({
        ProductId: item.productId,
        Quantity: item.quantity,
        Price: item.price,
        Total: item.total,
      })),
    };

    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fordata),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        // Update the purchase in both arrays
        // const index = this.purchases.findIndex(p => p.id === data.id);
        // if (index !== -1) {
        //   this.purchases[index] = data;
        //   this.filteredPurchases = [...this.purchases];
        // }
        this.snackBar.open('Purchase updated successfully!', 'Close', { duration: 2000 });
        this.isLoading = false;
        this.loadPurchase();
      })
      .catch(error => {
        console.error('Error updating purchase:', error);
        this.snackBar.open('Failed to update purchase. Please try again.', 'Close', {
          duration: 2000,
        });
        this.isLoading = false;
        this.loadPurchase();
      });
  }

  printPurchase(purchase: any): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.snackBar.open('Please allow popups for printing', 'Close', { duration: 3000 });
      return;
    }

    // Get the purchase details
    const supplierName = this.getSupplierName(purchase.supplierId);
    const userName = this.getUserName(purchase.userId);
    const purchaseDate = new Date(purchase.purchaseDate).toLocaleDateString();
    const items = purchase.purchaseItems || [];

    // Create the HTML content for the PDF
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Invoice - ${purchase.invoiceNo}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .header h2 {
              color: #7f8c8d;
              margin: 0;
            }
            .details-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding: 20px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .details-section {
              flex: 1;
            }
            .details-section h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .details-section p {
              margin: 8px 0;
              font-size: 14px;
            }
            .details-section strong {
              color: #34495e;
              min-width: 120px;
              display: inline-block;
            }
            .items-section {
              margin-top: 30px;
            }
            .items-section h3 {
              color: #2c3e50;
              margin-bottom: 15px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              background-color: white;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              color: #2c3e50;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            td {
              color: #2c3e50;
            }
            .total-section {
              text-align: right;
              margin-top: 20px;
              padding: 15px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .total-section p {
              font-size: 16px;
              margin: 5px 0;
            }
            .total-amount {
              font-size: 20px;
              font-weight: bold;
              color: #2c3e50;
            }
            .no-print {
              text-align: center;
              margin-top: 20px;
            }
            .print-button {
              padding: 10px 20px;
              background-color: #3498db;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            .print-button:hover {
              background-color: #2980b9;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 0; }
              .details-container {
                background-color: white !important;
                -webkit-print-color-adjust: exact;
              }
              .total-section {
                background-color: white !important;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Purchase Invoice</h1>
            <h2>${purchase.invoiceNo}</h2>
          </div>
          
          <div class="details-container">
            <div class="details-section">
              <h3>Purchase Information</h3>
              <p><strong>Invoice No:</strong> ${purchase.invoiceNo}</p>
              <p><strong>Purchase Date:</strong> ${purchaseDate}</p>
              <p><strong>Total Amount:</strong> $${purchase.totalAmount.toFixed(2)}</p>
            </div>
            <div class="details-section">
              <h3>Contact Information</h3>
              <p><strong>Supplier:</strong> ${supplierName}</p>
              <p><strong>User:</strong> ${userName}</p>
            </div>
          </div>

          <div class="items-section">
            <h3>Purchase Items</h3>
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
                    (item: PurchaseItem) => `
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
            <p class="total-amount">Total Amount: $${purchase.totalAmount.toFixed(2)}</p>
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

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
  validateAndSavePurchaseItem() {
    // Validate required fields
    if (
      !this.purchaseItemForm.productId ||
      !this.purchaseItemForm.quantity ||
      !this.purchaseItemForm.price ||
      this.purchaseItemForm.quantity <= 0 ||
      this.purchaseItemForm.price < 0
    ) {
      this.snackBar.open('Please fill all fields with valid values.', 'Close', { duration: 2000 });
      return;
    }

    // Check for duplicate product in the items list
    if (!this.isItemPurchaseEditMode) {
      const isDuplicate = this.purchaseForm.items.some(
        (item: any) =>
          item.productId === this.purchaseItemForm.productId &&
          (!this.isEditMode || item !== this.purchaseItemForm) // allow editing the same item
      );

      if (isDuplicate) {
        this.snackBar.open(
          'This product is already in the purchase list. Edit or delete it first.',
          'Close',
          { duration: 2500 }
        );
        return;
      }
    }

    // If editing, update the item; otherwise, add new
    if (this.isItemPurchaseEditMode) {
      // Find and update the item in the list
      const idx = this.purchaseForm.items.findIndex(
        (item: any) => item.productId === this.purchaseItemForm.productId
      );
      if (idx > -1) {
        this.purchaseForm.items[idx] = { ...this.purchaseItemForm };
        this.purchaseForm.items = [...this.purchaseForm.items]; // <-- Add this line
      }
      this.isItemPurchaseEditMode = false;
    } else {
      // Add new item
      this.purchaseItemForm.productName = this.getProductName(this.purchaseItemForm.productId);
      this.purchaseForm.items.push({ ...this.purchaseItemForm });
      this.purchaseForm.items = [...this.purchaseForm.items];
    }

    // Reset form
    this.purchaseItemForm = {
      productId: 0,
      productName: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    //this.snackBar.open('Purchase item saved!', 'Close', { duration: 1500 });
    // Close the dialog
    this.updatePurchaseTotal();
    this.itemDialogRef.close();
    //   if (this.itemDialogRef) {
    //   this.itemDialogRef.close();
    // }
  }
  isPurchaseItemFormValid(): boolean {
    return (
      !!this.purchaseItemForm.productId &&
      !!this.purchaseItemForm.quantity &&
      this.purchaseItemForm.quantity > 0 &&
      this.purchaseItemForm.price >= 0
    );
  }
  onDialogSave() {
    if (!this.purchaseForm.supplierId || this.purchaseForm.supplierId === 0) {
      this.snackBar.open('Please select a supplier before saving.', 'Close', { duration: 2000 });
      return;
    }
    if (!this.purchaseForm.items || this.purchaseForm.items.length === 0) {
      this.snackBar.open('Please add at least one purchase item before saving.', 'Close', {
        duration: 2000,
      });
      return;
    }

    this.savePurchase(this.purchaseForm);

    this.purchaseDialogRef.close(this.purchaseForm); // Only close if valid!
  }

  goToDirections(suppilerId: number) {
    // Example: environment.mapOrigin and environment.mapApiKey
    const supplier = this.suppliers.find(s => s.id === suppilerId);
    const destination = environment.addressPharmacy; // e.g., "Karachi"
    // You can add more params as needed

    // Construct the URL (Google Maps Directions as example)
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(supplier ? supplier.address : '')}&destination=${encodeURIComponent(destination)}`;
    console.log(url);
    // Open in a new tab
    window.open(url, '_blank');
  }
}
