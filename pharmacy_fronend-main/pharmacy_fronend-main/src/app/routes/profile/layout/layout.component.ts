import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Router, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService, User } from '@core';
import { PageHeaderComponent } from '@shared';
import { environment } from '@env/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-profile-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    TranslateModule,
    PageHeaderComponent,
    RouterOutlet,
  ],
})
export class ProfileLayoutComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  user: Partial<User> = {
    name: '',
    avatar: '',
  };

  ngOnInit() {
    this.authService.user().subscribe(user => {
      if (user) {
        this.user.name = user.name;
        this.user.avatar = user.avatar;
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    const userStr = localStorage.getItem('user');
    let userId: number | undefined;
    if (userStr) {
      try {
        const userObj = JSON.parse(userStr);
        userId = userObj.id;
      } catch (e) {
        userId = undefined;
      }
    }
    const apiUrl = `${environment.apiUrl || ''}user/upload-avatar/${userId}`;
    const token = localStorage.getItem('ng-matero-token');
    const formData = new FormData();
    if (file) {
      // Create a FileReader to read the image
      const reader = new FileReader();
      formData.append('file', file);
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ? JSON.parse(token)['access_token'] || '' : ''}`,
        },
        body: formData,
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to add user');
          return res.json();
        })
        .then(data => {
          this.snackBar.open('User profile pic added successfully!', 'Close', { duration: 2000 });
        })
        .catch(() => {
          this.snackBar.open('Failed to add user profile pic !', 'Close', { duration: 2000 });
        });
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          // Update the avatar preview
          this.user.avatar = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }
}
