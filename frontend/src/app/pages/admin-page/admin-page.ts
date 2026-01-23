import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminUserRow, UserService } from '../../services/user-service';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeEmail,
  normalizeUsername,
} from '../../validation-rules';
import type { RoleRow } from '../../services/user-service';

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
  roles = signal<RoleRow[]>([]);

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
    await this.loadRoles();
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
      const passErr = validatePassword(model.password);
      if (passErr) {
        this.error.set(passErr);
        return;
      }
      payload.password = model.password;
    }

    payload.email = normalizeEmail(model.email);
    payload.username = normalizeUsername(model.username);

    try {
      await this.userService.adminUpdateUser(userId, payload);
      this.success.set('User updated.');
      this.cancelEdit();
      await this.loadUsers();
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to update user.');
    }
  }

  async loadRoles() {
    try {
      const res = await this.userService.adminGetRoles();
      this.roles.set(res.roles ?? []);

      if (this.roles().length > 0) {
        const defaultId = this.roles()[0].role_id;
        this.createForm.set({ ...this.createForm(), role_id: defaultId });
        this.editForm.set({ ...this.editForm(), role_id: defaultId });
      }
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to load roles.');
      this.roles.set([]);
    }
  }

  async createUser() {
    this.clearMessages();
    this.fieldErrors.set({});
    const errors: any = {};

    const m = this.createForm();

    const emailErr = validateEmail(m.email);
    if (emailErr) errors.email = emailErr;

    const usernameErr = validateUsername(m.username);
    if (usernameErr) errors.username = usernameErr;

    const passErr = validatePassword(m.password);
    if (passErr) errors.password = passErr;

    if (Object.keys(errors).length > 0) {
      this.fieldErrors.set(errors);
      return;
    }
    const payload = {
      email: normalizeEmail(m.email),
      username: normalizeUsername(m.username),
      password: m.password,
      role_id: Number(m.role_id),
    };
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
  onCreateRoleChange(roleId: any) {
    this.createForm.set({
      email: this.createForm().email,
      username: this.createForm().username,
      password: this.createForm().password,
      role_id: Number(roleId),
    });
  }

  onEditRoleChange(roleId: any) {
    this.editForm.set({
      email: this.editForm().email,
      username: this.editForm().username,
      password: this.editForm().password,
      role_id: Number(roleId),
    });
  }
  
  setCreateRole(roleId: any) {
    const id = Number(roleId);
    const curr = this.createForm();
    this.createForm.set({ ...curr, role_id: id });
  }

  setEditRole(roleId: any) {
    const id = Number(roleId);
    const curr = this.editForm();
    this.editForm.set({ ...curr, role_id: id });
  }

  roleLabel(roleId: number) {
    return this.roles().find((r) => r.role_id === roleId)?.name ?? 'Unknown';
  }
}
