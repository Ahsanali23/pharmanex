import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, User } from '@core';
import { ControlsOf, IProfile } from '@shared';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
  ],
})
export class ProfileSettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  reactiveForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    role: [{ value: 'cashier', disabled: true }],
  });

  ngOnInit() {
    // Load user data
    this.auth.user().subscribe(user => {
      if (user) {
        this.reactiveForm.patchValue({
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          role: user.role,
        });
      }
    });
  }

  getErrorMessage(form: FormGroup<ControlsOf<IProfile>>) {
    return form.get('email')?.hasError('required')
      ? 'You must enter a value'
      : form.get('email')?.hasError('email')
        ? 'Not a valid email'
        : '';
  }

  onSubmit() {
    if (this.reactiveForm.valid) {
      // Here you would typically call your API to update the user profile
      const formValue = this.reactiveForm.getRawValue();
      console.log('Form submitted:', formValue);

      // Show success message
      this.snackBar.open('Profile updated successfully', 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
      });
    }
  }
}
