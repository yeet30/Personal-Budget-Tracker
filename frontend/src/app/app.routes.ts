import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./auth-guards";

export const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    loadComponent: () => import("./pages/landing-page/landing-page").then((m) => m.LandingPage),
  },
  {
    path: "login",
    pathMatch: "full",
    canActivate: [guestGuard],
    loadComponent: () => import("./pages/login-page/login-page").then((m) => m.LoginPage),
  },
  {
    path: "register",
    pathMatch: "full",
    canActivate: [guestGuard],
    loadComponent: () => import("./pages/register-page/register-page").then((m) => m.RegisterPage),
  },
  {
    path: "home",
    pathMatch: "full",
    canActivate: [authGuard],
    loadComponent: () => import("./pages/home-page/home-page").then((m) => m.HomePage),
  },
];
