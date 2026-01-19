import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RegisterationSchema, RegisterForm } from '../../form-validator';
import { UserService } from '../../user-service';

type RegisterField = 'username' | 'email' | 'password' | 'passwordAgain';

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

  fieldErrors = signal<Partial<Record<RegisterField, string>>>({});

  emailBackendError = signal<string | null>(null);
  usernameBackendError = signal<string | null>(null);

  backendError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  clearMessages() {
    this.backendError.set(null);
    this.successMessage.set(null);
    this.usernameBackendError.set(null);
    this.emailBackendError.set(null);
  }

  clearAllFieldErrors() {
    this.fieldErrors.set({});
  }

  clearFieldError(field: RegisterField) {
    const current = this.fieldErrors();
    this.fieldErrors.set({ ...current, [field]: undefined });
  }

  async RegisterAttempt() {
    this.clearMessages();
    this.clearAllFieldErrors();

    const result = RegisterationSchema.safeParse(this.formData);

    if (!result.success) {
      const next: Partial<Record<RegisterField, string>> = {};

      for (const issue of result.error.issues) {
        const key = issue.path?.[0];
        if (typeof key === 'string') {
          const k = key as RegisterField;
          if (!next[k]) next[k] = issue.message;
        }
      }

      this.fieldErrors.set(next);
      return;
    }

    try {
      await this.service.addUser(this.formData);

      this.successMessage.set('Registration successful! You can now log in.');

      this.clearAllFieldErrors();
      this.usernameBackendError.set(null);
      this.emailBackendError.set(null);
      this.backendError.set(null);

      this.formData = {
        username: '',
        email: '',
        password: '',
        passwordAgain: '',
      };
    } catch (err: any) {
      const beFieldErrors = err?.error?.errors;

      if (err?.status === 409 && beFieldErrors) {
        this.usernameBackendError.set(beFieldErrors.username ?? null);
        this.emailBackendError.set(beFieldErrors.email ?? null);
        this.backendError.set(err?.error?.message ?? 'User already exists.');
        return;
      }

      this.backendError.set(err?.error?.message ?? 'There was an error. Try again!');
    }
  }
}
