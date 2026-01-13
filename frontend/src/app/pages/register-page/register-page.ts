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

  backendError = signal<string | null>(null);

  successMessage = signal<string | null>(null);

  async RegisterAttempt() {
    const result = RegisterationSchema.safeParse(this.formData);
    if (!result.success) {
      console.warn('Invalid payload blocked', result.error);
      return;
    }

    this.backendError.set(null);
    this.successMessage.set(null);

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
      if (err?.status === 409) {
        this.backendError.set(
          err?.error?.message || 'User with that email already exists!'
        );
      } else {
        this.backendError.set(
          err?.error?.message || 'There was an error. Try again!'
        );
      }
    }
  }
}
