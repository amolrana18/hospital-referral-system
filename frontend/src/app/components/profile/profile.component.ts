import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  loading = false;
  savingProfile = false;
  changingPassword = false;
  
  profileSubmitted = false;
  passwordSubmitted = false;
  
  profileError = '';
  passwordError = '';
  
  profileSuccess = false;
  passwordSuccess = false;
  
  user: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) {
    this.profileForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.loading = true;
    this.authService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.loading = false;
      }
    });
  }

  get f() { return this.profileForm.controls; }
  get p() { return this.passwordForm.controls; }

  passwordMatchValidator(form: FormGroup): any {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    
    return null;
  }

  updateProfile(): void {
    this.profileSubmitted = true;
    this.profileError = '';
    this.profileSuccess = false;

    if (this.profileForm.invalid) {
      return;
    }

    this.savingProfile = true;

    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.profileSuccess = true;
        this.savingProfile = false;
        
        // Reload user profile
        this.loadUserProfile();
        
        setTimeout(() => {
          this.profileSuccess = false;
        }, 3000);
      },
      error: (error) => {
        this.profileError = error.error?.message || 'Failed to update profile';
        this.savingProfile = false;
      }
    });
  }

  changePassword(): void {
    this.passwordSubmitted = true;
    this.passwordError = '';
    this.passwordSuccess = false;

    if (this.passwordForm.invalid) {
      return;
    }

    this.changingPassword = true;

    const passwordData = {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    };

    this.authService.changePassword(passwordData).subscribe({
      next: () => {
        this.passwordSuccess = true;
        this.changingPassword = false;
        this.passwordForm.reset();
        this.passwordSubmitted = false;
        
        setTimeout(() => {
          this.passwordSuccess = false;
        }, 3000);
      },
      error: (error) => {
        this.passwordError = error.error?.message || 'Failed to change password';
        this.changingPassword = false;
      }
    });
  }

  getUserRoleBadgeClass(): string {
    switch (this.user?.role) {
      case 'Super Admin': return 'bg-danger';
      case 'Hospital Admin': return 'bg-primary';
      case 'Doctor': return 'bg-success';
      case 'Nurse': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getInitials(): string {
    if (!this.user) return '';
    const firstInitial = this.user.firstName.charAt(0);
    const lastInitial = this.user.lastName.charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
  }
}