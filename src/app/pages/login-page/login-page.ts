import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginForm,LoginSchema } from '../../form-validator';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule,CommonModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
  standalone: true,
})
export class LoginPage {

  formData: LoginForm = {
    email: '',
    password: ''
  }

  loginAttempt(){
    const result = LoginSchema.safeParse(this.formData)
    
    if(!result.success){
      console.warn('Invalid payload blocked.', result.error)
      return;
    }
    else {
      console.log('Payload is being sent.');
    }

  }
}
