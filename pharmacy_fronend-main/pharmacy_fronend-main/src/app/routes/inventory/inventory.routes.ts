import { Routes } from '@angular/router';
import { CategoryComponent } from './category/category.component';
import { ProductComponent } from './products/product.component';

export const routes: Routes = [
  { path: 'category', component: CategoryComponent },
  { path: 'products', component: ProductComponent },
];
