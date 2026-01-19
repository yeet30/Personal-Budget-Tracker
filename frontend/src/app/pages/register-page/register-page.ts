import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterationSchema, RegisterForm } from '../../form-validator';
import { UserService } from '../../user-service';

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, CommonModule],
  templateUrl: './register-page.html',
  styleUrl: './register-page.scss',
  standalone: true,
})
export class RegisterPage {
  constructor(public service: UserService) {}

  formData: RegisterForm = {
    username: '',
    email: '',
    password: '',
    passwordAgain: '',
  };

  passwordPattern = /.*\d.*/;

  emailBackendError = signal<string | null>(null);
  usernameBackendError = signal<string | null>(null);
  backendError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  async RegisterAttempt() {
    this.backendError.set(null);
    this.successMessage.set(null);
    this.usernameBackendError.set(null);
    this.emailBackendError.set(null);
    const result = RegisterationSchema.safeParse(this.formData);
    if (!result.success) {
      console.warn('Invalid payload blocked', result.error);
      return;
    }

    try {
      await this.service.addUser(this.formData);

      this.successMessage.set('Registration successful! You can now log in.');

      this.formData = {
        username: '',
        email: '',
        password: '',
        passwordAgain: '',
      };
    } catch (err: any) {
      const fieldErrors = err?.error?.errors;

      if (err?.status === 409 && fieldErrors) {
        this.usernameBackendError.set(fieldErrors.username ?? null);
        this.emailBackendError.set(fieldErrors.email ?? null);
        this.backendError.set(err?.error?.message ?? 'User already exists.');
        return;
      }

      this.backendError.set(err?.error?.message ?? 'There was an error. Try again!');
    }
  }
}
