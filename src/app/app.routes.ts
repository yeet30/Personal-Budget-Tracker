import { Routes } from '@angular/router';

export const routes: Routes = [{
    path: '',
    pathMatch: 'full',
    loadComponent: () => {
        return import('./pages/landing-page/landing-page').then((m)=> m.LandingPage)
        }
    },
    {
        path: 'login',
        pathMatch: 'full',
        loadComponent: () => {
        return import('./pages/login-page/login-page').then((m)=> m.LoginPage)
        }
    },
    {
        path: 'register',
        pathMatch: 'full',
        loadComponent: () => {
        return import('./pages/register-page/register-page').then((m)=> m.RegisterPage)
        }
    }
];
