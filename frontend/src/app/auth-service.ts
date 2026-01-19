import { Injectable, signal } from "@angular/core";
import { UserService } from "./user-service";

export type AuthUser = {
  user_id: number;
  email: string;
  username: string;
  role_id: number;
};

@Injectable({ providedIn: "root" })
export class AuthService {
  user = signal<AuthUser | null>(null);
  loading = signal<boolean>(true);

  constructor(private userService: UserService) {}

  async refreshMe() {
    try {
      const res: any = await this.userService.me();
      this.user.set(res?.user ?? null);
    } finally {
      this.loading.set(false);
    }
  }

  async logout() {
    await this.userService.logout();
    this.user.set(null);
  }
}
