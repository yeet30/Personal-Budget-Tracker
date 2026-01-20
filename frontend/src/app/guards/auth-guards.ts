import { inject } from "@angular/core";
import { CanActivateFn, Router, UrlTree } from "@angular/router";
import { AuthService } from "../services/auth-service";

async function ensureAuthLoaded(auth: AuthService) {
  if (auth.loading()) {
    await auth.refreshMe();
  }
}

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await ensureAuthLoaded(auth);

  if (auth.user()) return true;

  return router.createUrlTree(["/login"]);
};

export const guestGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await ensureAuthLoaded(auth);

  if (auth.user()) return router.createUrlTree(["/home"]);

  return true;
};
