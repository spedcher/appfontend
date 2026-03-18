import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  userForm!: FormGroup;
  isEditMode = signal(false);
  showModal = signal(false);
  errorMessage = signal('');

  ngOnInit() {
    this.initForm();
    this.loadUsers();
  }

  initForm() {
    this.userForm = this.fb.group({
      id: [null],
      username: ['', [Validators.required, Validators.maxLength(50)]],
      passwordHash: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      status: ['active', [Validators.required]]
    });
  }

  loadUsers() {
    this.userService.getAllUsers().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Error loading users:', err)
    });
  }

  openModal(user?: User) {
    this.errorMessage.set('');
    if (user) {
      this.isEditMode.set(true);
      this.userForm.patchValue({
        id: user.id,
        username: user.username,
        passwordHash: '', // Clear password for security, require re-entry or handle accordingly
        email: user.email,
        status: user.status
      });
      // Option: if editing, maybe password isn't strictly required unless changed? Wait, the backend requires it.
      // We will set passwordHash locally for now
      this.userForm.patchValue({ passwordHash: user.passwordHash });
    } else {
      this.isEditMode.set(false);
      this.userForm.reset({ status: 'active' });
    }
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveUser() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const userData: User = this.userForm.value;

    if (this.isEditMode()) {
      this.userService.updateUser(userData.id!, userData).subscribe({
        next: (updatedUser) => {
          this.users.update(users => users.map(u => u.id === updatedUser.id ? updatedUser : u));
          this.closeModal();
        },
        error: (err) => this.errorMessage.set('Update failed. User might not exist or duplicate data.')
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: (newUser) => {
          this.users.update(users => [...users, newUser]);
          this.closeModal();
        },
        error: (err) => this.errorMessage.set('Creation failed. Username or email might already exist.')
      });
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.users.update(users => users.filter(u => u.id !== id));
        },
        error: (err) => console.error('Error deleting user:', err)
      });
    }
  }
}
