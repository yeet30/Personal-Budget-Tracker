import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService, CategoryRow } from '../../services/user-service';

type EditModel = {
  name: string;
  description: string;
};

@Component({
  selector: 'categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categories-page.html',
  styleUrl: './categories-page.scss',
})
export class AdminCategoriesPage implements OnInit {
  categories = signal<CategoryRow[]>([]);
  loading = signal<boolean>(true);
  creating = signal<boolean>(false);
  saving = signal<boolean>(false);
  deleting = signal<boolean>(false);

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  createForm = signal({
    name: '',
    description: '',
  });

  editingId = signal<number | null>(null);
  editForm = signal<EditModel>({
    name: '',
    description: '',
  });
  fieldErrors = signal<{
    name?: string;
    description?: string;
  }>({});

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      this.loading.set(true);
      this.error.set(null);
      const response = await this.userService.adminGetCategories();
      // Ensure we create a new array reference to trigger reactivity
      this.categories.set([...response.categories]);
    } catch (err: any) {
      this.error.set(err.error?.message || 'Failed to load categories');
      console.error('Failed to load categories:', err);
    } finally {
      this.loading.set(false);
    }
  }

  setCreateName(event: Event) {
    const target = event.target as HTMLInputElement;
    this.createForm.update(form => ({ ...form, name: target.value }));
  }

  setCreateDescription(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.createForm.update(form => ({ ...form, description: target.value }));
  }

  setEditName(event: Event) {
    const target = event.target as HTMLInputElement;
    this.editForm.update(form => ({ ...form, name: target.value }));
  }

  setEditDescription(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.editForm.update(form => ({ ...form, description: target.value }));
  }

  async createCategory() {
    this.fieldErrors.set({});
    this.error.set(null);
    this.success.set(null);

    const { name, description } = this.createForm();

    // Basic validation
    if (!name.trim()) {
      this.fieldErrors.set({ name: 'Category name is required' });
      return;
    }

    this.creating.set(true);
    try {
      const result = await this.userService.adminCreateCategory({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      console.log('Category created:', result);

      this.success.set('Category created successfully');
      this.createForm.set({ name: '', description: '' });
      
      // Force reload categories to ensure the new category appears
      console.log('Reloading categories...');
      await this.loadCategories();
      console.log('Categories reloaded, current count:', this.categories().length);
    } catch (err: any) {
      console.error('Failed to create category:', err);
      if (err.error?.errors) {
        this.fieldErrors.set(err.error.errors);
      } else {
        this.error.set(err.error?.message || 'Failed to create category');
      }
    } finally {
      this.creating.set(false);
    }
  }

  startEdit(category: CategoryRow) {
    this.editingId.set(category.category_id);
    this.editForm.set({
      name: category.name,
      description: category.description || '',
    });
    this.fieldErrors.set({});
    this.error.set(null);
    this.success.set(null);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm.set({ name: '', description: '' });
    this.fieldErrors.set({});
  }

  async saveEdit() {
    const id = this.editingId();
    if (!id) return;

    this.fieldErrors.set({});
    this.error.set(null);
    this.success.set(null);

    const { name, description } = this.editForm();

    if (!name.trim()) {
      this.fieldErrors.set({ name: 'Category name is required' });
      return;
    }

    this.saving.set(true);
    try {
      await this.userService.adminUpdateCategory(id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      this.success.set('Category updated successfully');
      this.editingId.set(null);
      await this.loadCategories();
    } catch (err: any) {
      if (err.error?.errors) {
        this.fieldErrors.set(err.error.errors);
      } else {
        this.error.set(err.error?.message || 'Failed to update category');
      }
    } finally {
      this.saving.set(false);
    }
  }

  async deleteCategory(category: CategoryRow) {
    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return;
    }

    this.deleting.set(true);
    try {
      this.error.set(null);
      this.success.set(null);
      await this.userService.adminDeleteCategory(category.category_id);
      this.success.set('Category deleted successfully');
      await this.loadCategories();
    } catch (err: any) {
      this.error.set(err.error?.message || 'Failed to delete category');
    } finally {
      this.deleting.set(false);
    }
  }
}