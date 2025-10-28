import { Routes } from '@angular/router';
import { salesandPurchaseComponent } from './salesandpurchase/salesandPurchase.component';
import { usersaleComponent } from './usersale/usersale.component';
export const routes: Routes = [
  { path: 'SalesAndPurchase', component: salesandPurchaseComponent },
  { path: 'UserSale', component: usersaleComponent },
];
