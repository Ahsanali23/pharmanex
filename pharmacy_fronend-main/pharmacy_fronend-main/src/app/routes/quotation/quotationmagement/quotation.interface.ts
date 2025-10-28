export interface Sale {
  id?: number;
  customerId: number;
  userId: number;
  totalAmount: number;
  invoiceNo: string;
  purchaseDate: Date;
  items: SaleItem[];
}

export interface SaleItem {
  id?: number;
  saleId?: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt?: Date;
}
