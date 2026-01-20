import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const userGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loading()) await auth.refreshMe();

  const u = auth.user();
  if (!u) return router.createUrlTree(['/login']);
  if (u.role_id === 2) return router.createUrlTree(['/admin/users']);

  return true;
};
