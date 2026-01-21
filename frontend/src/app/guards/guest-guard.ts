import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  while (auth.loading()) {
    await new Promise((r) => setTimeout(r, 10));
  }

  if (auth.user()) {
    return router.parseUrl('/home');
  }

  return true;
};
