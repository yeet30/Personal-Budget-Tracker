import { Component } from '@angular/core';
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

  constructor (public service: UserService){}

  formData : RegisterForm = {
    username: '',
    email: '',
    password: '',
    passwordAgain: ''
  }
  passwordPattern = /.*\d.*/;

  RegisterAttempt(){
    const result = RegisterationSchema.safeParse(this.formData);

    if(!result.success){
      console.warn('Invalid payload blocked', result.error)
      return;
    }
    else{
      console.log('The payload is being sent.');
      this.service.addUser(this.formData)
      .then(response => {
        console.log('User created:', response);
      })
      .catch(error => {
        console.error('Failed to create user', error);
      });
    }

  }


  
}
