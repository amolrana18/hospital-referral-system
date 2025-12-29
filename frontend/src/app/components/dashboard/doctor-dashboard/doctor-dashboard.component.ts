import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ReferralService } from '../../../services/referral.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  currentUser: any = null;
  hospitalName = '';
  referrals: any[] = [];
  appointments: any[] = [];
  bedAvailability: any = {};
  stats = {
    total_referrals: 0,
    pending_referrals: 0,
    completed_referrals: 0
  };
  
  private socketSubscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private referralService: ReferralService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  get displayHospitalName(): string {
    return this.currentUser?.hospitalName || this.hospitalName || 'Hospital';
  }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.hospitalName = this.currentUser?.hospitalName || 'Loading...';
    
    // Load user profile first to get hospital name
    this.loadUserProfile();
    
    // Then load dashboard data
    this.loadDashboardData();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserProfile(): void {
    this.authService.getProfile().subscribe({
      next: (profile) => {
        // Update currentUser with profile data
        this.currentUser = {
          ...this.currentUser,
          ...profile,
          hospitalName: profile.hospitalName || profile.hospital_name || this.currentUser?.hospitalName
        };
        this.hospitalName = this.currentUser.hospitalName || 'Hospital';
        
        // Force change detection
        setTimeout(() => {
          this.hospitalName = this.currentUser.hospitalName || 'Hospital';
        }, 0);
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.hospitalName = this.currentUser?.hospitalName || 'Hospital';
      }
    });
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load doctor's referrals
    this.referralService.getReferrals().subscribe({
      next: (referrals) => {
        this.referrals = referrals.slice(0, 10);
        this.calculateStats(referrals);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading referrals:', error);
        this.loading = false;
      }
    });

    // Load mock appointments
    this.appointments = [
      { patient_name: 'Rohit Sharma', phone_number: '9876543210', appointment_date: '2024-12-15', start_time: '10:00', status: 'Scheduled' },
      { patient_name: 'Priya Singh', phone_number: '9876543211', appointment_date: '2024-12-15', start_time: '11:00', status: 'Confirmed' },
      { patient_name: 'Amit Kumar', phone_number: '9876543212', appointment_date: '2024-12-15', start_time: '14:00', status: 'Scheduled' }
    ];

    // Load mock bed availability
    this.bedAvailability = {
      available_beds: 24,
      available_icu: 3
    };
  }

  calculateStats(referrals: any[]): void {
    this.stats.total_referrals = referrals.length;
    this.stats.pending_referrals = referrals.filter(r => r.status === 'Submitted').length;
    this.stats.completed_referrals = referrals.filter(r => r.status === 'Completed').length;
  }

  setupSocketListeners(): void {
    // Listen for referral alerts (incoming referrals)
    const alertSub = this.socketService.onReferralAlert().subscribe(data => {
      console.log('New referral alert:', data);
      this.showReferralAlert(data);
    });

    // Listen for referral updates
    const referralSub = this.socketService.onReferralStatusUpdate().subscribe(data => {
      console.log('Referral update received:', data);
      this.referralService.getReferrals().subscribe(referrals => {
        this.referrals = referrals.slice(0, 10);
        this.calculateStats(referrals);
      });
    });

    this.socketSubscriptions.push(alertSub, referralSub);
  }

  showReferralAlert(data: any): void {
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Patient Referral', {
        body: `${data.patient_name} referred from ${data.referring_hospital}`,
        icon: '/assets/images/hospital-icon.png'
      });
    }
    
    // You can also show an in-app notification here
    alert(`New ${data.priority} referral: ${data.patient_name} from ${data.referring_hospital}`);
  }

  navigateToPatientSearch(): void {
    this.router.navigate(['/dashboard/patients/search']);
  }

  navigateToNewPatient(): void {
    this.router.navigate(['/dashboard/patients/new']);
  }

  navigateToNewReferral(): void {
    this.router.navigate(['/dashboard/referrals/new']);
  }

  navigateToReferrals(): void {
    this.router.navigate(['/dashboard/referrals']);
  }

  navigateToBedStatus(): void {
    this.router.navigate(['/dashboard/realtime/beds']);
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'Emergency': return 'bg-danger';
      case 'Critical': return 'bg-warning text-dark';
      case 'Urgent': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success';
      case 'Rejected': return 'bg-danger';
      case 'Completed': return 'bg-primary';
      case 'In Transit': return 'bg-warning text-dark';
      case 'Submitted': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getAppointmentStatusClass(status: string): string {
    switch (status) {
      case 'Confirmed': return 'bg-success';
      case 'Scheduled': return 'bg-primary';
      case 'Cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}