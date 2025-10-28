import { JsonPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { NgxPermissionsService, NgxRolesService } from 'ngx-permissions';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MtxCalendarView,
  MtxDatetimepickerMode,
  MtxDatetimepickerModule,
  MtxDatetimepickerType,
} from '@ng-matero/extensions/datetimepicker';
@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MtxDatetimepickerModule,
  ],
})
export class ProductComponent implements OnInit, OnDestroy {
  @ViewChild('productDialog') productDialog: any;
  @ViewChild('fileInput') fileInput: any;
  private readonly _destroy$ = new Subject<void>();
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly snackBar = inject(MatSnackBar);

  isEditMode = false;
  selectedFile: File | null = null;
  previewUrl: SafeUrl | null = null;
  productForm: any = {
    name: '',
    categoryId: '',
    barcode: '',
    brand: '',
    costPrice: 0,
    salePrice: 0,
    quantity: 0,
    unit: '',
    expiryDate: null,
    alertQuantity: 0,
    image: null,
  };

  categories: any[] = [];

  units = [
    { value: 'pcs', label: 'Pieces' },
    { value: 'box', label: 'Box' },
    { value: 'bottle', label: 'Bottle' },
    { value: 'pack', label: 'Pack' },
  ];

  products: {
    alertQuantity: number;
    barcode: string;
    brand: string;
    category: string;
    categoryId: number;
    costPrice: number;
    createdAt: string;
    expiryDate: string;
    id: number;
    imageUrl: string;
    name: string;
    quantity: number;
    salePrice: number;
    unit: string;
  }[] = [
    // Add more sample products as needed
  ];

  columns: MtxGridColumn[] = [
    {
      header: 'Image',
      field: 'imageUrl',
      width: '100px',
      formatter: (row: any) => {
        if (row.imageUrl) {
          return `<img src="${row.imageUrl}" alt="Product" class="avatar" width="40" height="40" style=" object-fit: cover; border-radius: 4px;">`;
        }
        return '';
      },
    },
    {
      header: 'ID',
      field: 'id',
      sortable: true,
      width: '80px',
    },
    {
      header: 'Name',
      field: 'name',
      sortable: true,
      width: '150px',
    },
    {
      header: 'Category',
      field: 'categoryId',
      sortable: true,
      width: '120px',
      formatter: (row: any) => {
        const category = this.categories.find(c => c.id === row.categoryId);
        return category ? category.name : row.categoryId;
      },
    },
    {
      header: 'Barcode',
      field: 'barcode',
      width: '120px',
    },
    {
      header: 'Brand',
      field: 'brand',
      width: '120px',
    },
    {
      header: 'Cost Price',
      field: 'costPrice',
      width: '100px',
      formatter: (row: any) => `$${row.costPrice.toFixed(2)}`,
    },
    {
      header: 'Sale Price',
      field: 'salePrice',
      width: '100px',
      formatter: (row: any) => `$${row.salePrice.toFixed(2)}`,
    },
    {
      header: 'Quantity',
      field: 'quantity',
      width: '100px',
    },
    {
      header: 'Unit',
      field: 'unit',
      width: '80px',
      formatter: (row: any) => {
        const unit = this.units.find(u => u.value === row.unit);
        return unit ? unit.label : row.unit;
      },
    },
    {
      header: 'Expiry Date',
      field: 'expiryDate',
      width: '120px',
      formatter: (row: any) =>
        row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '',
    },
    {
      header: 'Alert Qty',
      field: 'alertQuantity',
      width: '100px',
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
      minWidth: 140,
      width: '140px',
      pinned: 'right',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'edit',
          tooltip: 'Edit',
          click: record => this.edit(record),
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
        //   click: record => this.delete(record),
        // },
      ],
    },
  ];
  //   //datetime
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

  ngOnInit() {
    this.loadCategories();
    this.loadProducts();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.previewUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(file));
      this.productForm.image = this.previewUrl;
    }
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
  openAddProductDialog(): void {
    this.isEditMode = false;
    this.selectedFile = null;
    this.previewUrl = null;
    this.productForm = {
      name: '',
      categoryId: '',
      barcode: '',
      brand: '',
      costPrice: 0,
      salePrice: 0,
      quantity: 0,
      unit: '',
      expiryDate: null,
      alertQuantity: 0,
      image: null,
    };

    const dialogRef = this.dialog.open(this.productDialog, {
      width: '600px',
      data: { isEditMode: this.isEditMode, productForm: this.productForm },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveProduct(result);
      }
    });
  }

  edit(product: any): void {
    this.isEditMode = true;
    this.productForm = { ...product };
    this.previewUrl = product.imageUrl;

    const dialogRef = this.dialog.open(this.productDialog, {
      width: '600px',
      data: { isEditMode: this.isEditMode, productForm: this.productForm },
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.saveProduct(result);
      }
    });
  }

  delete(product: any): void {
    const index = this.products.findIndex(p => p.id === product.id);
    if (index > -1) {
      this.products.splice(index, 1);
    }
  }

  saveProduct(productData: any): void {
    if (this.isEditMode) {
      const index = this.products.findIndex(p => p.id === productData.id);
      if (index > -1) {
        this.products[index] = {
          ...productData,
          image: this.previewUrl,
        };
      }
      this.editProducts(this.products[index]);
      // this.loadProducts();
    } else {
      const newProduct = {
        ...productData,
        id: (this.products.length + 1).toString(),
        createdAt: new Date(),
        image: this.previewUrl,
      };
      this.saveProducts(newProduct);
      // this.loadProducts();
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
        console.log('Products loaded');
        // Map API data to match table columns if needed
        this.products = (data || []).map((item: any) => ({
          ...item,
          imageUrl: item.imageUrl || '', // Ensure imageUrl is set for table display
        }));
        // this.products =data || [];
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      });
  }
  saveProducts(products: any): void {
    console.log('Saving products:', products);
    const formData = new FormData();
    formData.append('Name', products.name);
    formData.append('CategoryId', products.categoryId.toString());
    formData.append('Barcode', products.barcode);
    formData.append('Brand', products.brand);
    formData.append('CostPrice', products.costPrice.toString());
    formData.append('SalePrice', products.salePrice.toString());
    formData.append('Unit', products.unit);
    formData.append(
      'ExpiryDate',
      products.expiryDate ? new Date(products.expiryDate).toISOString() : ''
    );
    formData.append('AlertQuantity', products.alertQuantity.toString());
    if (this.selectedFile) {
      formData.append('Image', this.selectedFile);
    }
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/product`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
      },
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        this.snackBar.open('Products added successfully!', 'Close', { duration: 2000 });
        this.isLoading = false;
        this.loadProducts();
      })
      .catch(error => {
        this.isLoading = false;
        this.snackBar.open('Error saving products. Please try again.', 'Close', { duration: 3000 });
        console.error('Error saving products:', error);
      });
  }
  editProducts(products: any): void {
    console.log('Saving products:', products);
    const formData = new FormData();
    formData.append('Name', products.name);
    formData.append('CategoryId', products.categoryId.toString());
    formData.append('Barcode', products.barcode);
    formData.append('Brand', products.brand);
    formData.append('CostPrice', products.costPrice.toString());
    formData.append('SalePrice', products.salePrice.toString());
    formData.append('Unit', products.unit);
    formData.append(
      'ExpiryDate',
      products.expiryDate ? new Date(products.expiryDate).toISOString() : ''
    );
    formData.append('AlertQuantity', products.alertQuantity.toString());
    if (this.selectedFile) {
      formData.append('Image', this.selectedFile);
    }
    this.isLoading = true;
    const apiUrl = `${environment.apiUrl || ''}ProductAndCategory/product/${products.id}`;
    const token = localStorage.getItem('ng-matero-token');
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
      },
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        this.loadProducts();
        this.snackBar.open('Products updated successfully!', 'Close', { duration: 2000 });
        this.isLoading = false;
        console.log('Products updated successfully:', data);
      })
      .catch(error => {
        this.isLoading = false;
        this.snackBar.open('Error saving products. Please try again.', 'Close', { duration: 3000 });
        console.error('Error saving products:', error);
      });
  }
}
