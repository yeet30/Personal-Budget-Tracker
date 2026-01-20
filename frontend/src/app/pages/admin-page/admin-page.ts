import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUserRow, UserService } from '../../user-service';

type EditModel = {
  email: string;
  username: string;
  role_id: number;
  password?: string;
};

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminUsersPage implements OnInit {
  users = signal<AdminUserRow[]>([]);
  loading = signal<boolean>(true);

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  createForm = signal({
    email: '',
    username: '',
    password: '',
    role_id: 1,
  });

  editingId = signal<number | null>(null);
  editForm = signal<EditModel>({
    email: '',
    username: '',
    role_id: 1,
    password: '',
  });
  fieldErrors = signal<{
    email?: string;
    username?: string;
    password?: string;
  }>({});

  constructor(private userService: UserService) {}

  async ngOnInit() {
    await this.loadUsers();
  }

  clearMessages() {
    this.error.set(null);
    this.success.set(null);
  }

  async loadUsers() {
    this.loading.set(true);
    this.clearMessages();

    try {
      const res = await this.userService.adminGetUsers();
      this.users.set(res.users ?? []);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to load users.');
    } finally {
      this.loading.set(false);
    }
  }

  startEdit(u: AdminUserRow) {
    this.clearMessages();
    this.editingId.set(u.user_id);
    this.editForm.set({
      email: u.email,
      username: u.username,
      role_id: u.role_id,
      password: '',
    });
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm.set({ email: '', username: '', role_id: 1, password: '' });
  }

  async saveEdit(userId: number) {
    this.clearMessages();

    const model = this.editForm();
    const payload: any = {
      email: model.email.trim().toLowerCase(),
      username: model.username.trim(),
      role_id: model.role_id,
    };

    if (model.password && model.password.trim().length > 0) {
      payload.password = model.password;
    }

    try {
      await this.userService.adminUpdateUser(userId, payload);
      this.success.set('User updated.');
      this.cancelEdit();
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to update user.');
    }
  }

  async createUser() {
    this.clearMessages();
    this.fieldErrors.set({});

    const m = this.createForm();
    const errors: any = {};

    if (!m.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email)) {
      errors.email = 'Invalid email format.';
    }

    if (!m.username.trim()) {
      errors.username = 'Username is required.';
    } else if (m.username.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    }

    if (!m.password) {
      errors.password = 'Password is required.';
    } else if (m.password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }

    try {
      await this.userService.adminCreateUser({
        email: m.email.trim().toLowerCase(),
        username: m.username.trim(),
        password: m.password,
        role_id: Number(m.role_id),
      });

      this.success.set('User created.');
      this.createForm.set({ email: '', username: '', password: '', role_id: 1 });
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to create user.');
    }
  }

  async deleteUser(u: AdminUserRow) {
    this.clearMessages();

    const ok = confirm(`Delete user #${u.user_id} (${u.username})?`);
    if (!ok) return;

    try {
      await this.userService.adminDeleteUser(u.user_id);
      this.success.set('User deleted.');
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to delete user.');
    }
  }

  roleLabel(roleId: number) {
    return roleId === 2 ? 'Admin' : 'User';
  }
}
