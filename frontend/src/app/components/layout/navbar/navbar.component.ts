import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  userName = '';
  userRole = '';
  hospitalName = '';
  notifications: any[] = [];
  notificationCount = 0;
  showNotifications = false;
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  get displayHospitalName(): string {
    return this.currentUser?.hospitalName || this.hospitalName || '';
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser) {
      this.currentUser = currentUser;
      this.userName = currentUser.fullName || currentUser.name || `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      this.userRole = currentUser.role;
      this.hospitalName = currentUser.hospitalName || '';
    }

    // Subscribe to user changes to get updated hospital name
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userName = user.fullName || user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
        this.userRole = user.role;
        this.hospitalName = user.hospitalName || '';
      }
    });

    // Listen for real-time notifications
    this.setupSocketListeners();
  }

  setupSocketListeners(): void {
    // Listen for new referrals
    this.socketService.onReferralCreated().subscribe(data => {
      this.addNotification({
        type: 'referral',
        title: 'New Referral Created',
        message: `New referral from ${data.referring_hospital_name}`,
        time: new Date(),
        read: false
      });
    });

    // Listen for bed updates
    this.socketService.onBedUpdate().subscribe(data => {
      this.addNotification({
        type: 'bed',
        title: 'Bed Status Updated',
        message: `Bed availability updated at ${data.hospital_name}`,
        time: new Date(),
        read: false
      });
    });
  }

  addNotification(notification: any): void {
    this.notifications.unshift(notification);
    this.notificationCount++;
  }

  markAsRead(index: number): void {
    if (!this.notifications[index].read) {
      this.notifications[index].read = true;
      this.notificationCount--;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true;
      }
    });
    this.notificationCount = 0;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  navigateToProfile(): void {
    this.router.navigate(['/dashboard/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/login']);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'referral':
        return 'fas fa-hospital-user';
      case 'bed':
        return 'fas fa-bed';
      case 'emergency':
        return 'fas fa-ambulance';
      default:
        return 'fas fa-bell';
    }
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'referral':
        return 'bg-primary';
      case 'bed':
        return 'bg-info';
      case 'emergency':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}