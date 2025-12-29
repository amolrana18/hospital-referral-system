import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userRole = '';
  userName = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.userRole = currentUser.role;
    this.userName = currentUser.name || currentUser.fullName || 
                   `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User';
    
    // Auto-redirect to role-specific dashboard
    this.redirectToRoleDashboard();
  }

  private redirectToRoleDashboard(): void {
    switch (this.userRole) {
      case 'Super Admin':
        this.router.navigate(['/dashboard/super-admin']);
        break;
      case 'Hospital Admin':
        this.router.navigate(['/dashboard/hospital-admin']);
        break;
      case 'Doctor':
      case 'Nurse':
        this.router.navigate(['/dashboard/doctor']);
        break;
      default:
        console.warn('Unknown role:', this.userRole);
    }
  }

  getDashboardTitle(): string {
    switch (this.userRole) {
      case 'Super Admin':
        return 'Super Admin Dashboard';
      case 'Hospital Admin':
        return 'Hospital Admin Dashboard';
      case 'Doctor':
        return 'Doctor Dashboard';
      case 'Nurse':
        return 'Nurse Dashboard';
      default:
        return 'Dashboard';
    }
  }
}