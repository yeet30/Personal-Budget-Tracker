import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { LoginForm, LoginSchema } from '../../form-validator';
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
    private auth: AuthService,
    private router: Router,
  ) {}

  formData: LoginForm = {
    email: '',
    password: '',
  };

  fieldErrors = signal<Partial<Record<LoginField, string>>>({});

  backendError = signal<string | null>(null);
  loading = signal<boolean>(false);

  clearMessages() {
    this.backendError.set(null);
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
      this.loading.set(true);

      const res: any = await this.auth.login(
        this.formData.email,
        this.formData.password
      );

      const roleId = this.auth.user()?.role_id;

      if (roleId === 2) {
        await this.router.navigate(['/admin/users']);
      } else {
        await this.router.navigate(['/home']);
      }
    } catch (err: any) {
      this.backendError.set(err?.error?.message ?? 'Invalid email or password.');
    } finally {
      this.loading.set(false);
    }
  }
}
