import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  address: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private apiUrl = `${environment.apiUrl}customers`;

  constructor(private http: HttpClient) {}

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  createCustomer(customer: Customer): Observable<Customer[]> {
    console.log('Creating customer:', customer);
    return this.http.post<Customer[]>(this.apiUrl, [customer]).pipe(
      catchError(this.handleError)
    );
  }

  updateCustomer(customer: Customer): Observable<Customer[]> {
    return this.http.put<Customer[]>(`${this.apiUrl}/${customer.id}`, [customer]).pipe(
      catchError(this.handleError)
    );
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error);
  }
} 