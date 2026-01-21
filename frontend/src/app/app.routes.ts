import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guards';
import { adminGuard } from './guards/admin-guard';
import { userGuard } from './guards/user-guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/landing-page/landing-page').then((m) => m.LandingPage),
  },

  {
    path: 'login',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/login-page/login-page').then((m) => m.LoginPage),
  },

  {
    path: 'register',
    pathMatch: 'full',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/register-page/register-page').then((m) => m.RegisterPage),
  },

  {
    path: 'home',
    pathMatch: 'full',
    canActivate: [userGuard],
    loadComponent: () => import('./pages/home-page/home-page').then((m) => m.HomePage),
  },

  {
    path: 'admin/users',
    pathMatch: 'full',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-page/admin-page').then((m) => m.AdminUsersPage),
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about-page/about-page').then((m) => m.AboutPage),
  },
  {
    path: 'features',
    loadComponent: () => import('./pages/features-page/features-page').then((m) => m.FeaturesPage),
  },
  /*{
    path: 'budgets/new',
    loadComponent: () =>
      import('./pages/budget-new-page/budget-new-page').then((m) => m.BudgetNewPage),
      canActivate: [authGuard]
  },
  {
    path: 'budgets/:id',
    loadComponent: () => import('./pages/budget-page/budget-page').then((m) => m.BudgetPage),
    canActivate: [authGuard]
  },*/
];
