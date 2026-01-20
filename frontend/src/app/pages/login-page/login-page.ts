import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LoginForm, LoginSchema } from '../../form-validator';
import { UserService } from '../../services/user-service';
import { AuthService } from '../../services/auth-service';

type LoginField = 'email' | 'password';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, CommonModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  standalone: true,
})
export class LoginPage {
  constructor(
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
  ) {}

  formData: LoginForm = {
    email: '',
    password: '',
  };

  fieldErrors = signal<Partial<Record<LoginField, string>>>({});

  backendError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  clearMessages() {
    this.backendError.set(null);
    this.successMessage.set(null);
  }

  clearAllFieldErrors() {
    this.fieldErrors.set({});
  }

  clearFieldError(field: LoginField) {
    const current = this.fieldErrors();
    this.fieldErrors.set({ ...current, [field]: undefined });
  }

  async loginAttempt() {
    this.clearMessages();
    this.clearAllFieldErrors();

    const result = LoginSchema.safeParse(this.formData);

    if (!result.success) {
      const next: Partial<Record<LoginField, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path?.[0];
        if (typeof key === 'string') {
          const k = key as LoginField;
          if (!next[k]) next[k] = issue.message;
        }
      }
      this.fieldErrors.set(next);
      return;
    }

    try {
      const res: any = await this.userService.login(this.formData.email, this.formData.password);

      await this.auth.refreshMe();

      this.successMessage.set(res?.message ?? 'Login successful.');

      this.router.navigate(['/home']);
    } catch (err: any) {
      this.backendError.set(err?.error?.message ?? 'Invalid email or password.');
    }
  }
}
