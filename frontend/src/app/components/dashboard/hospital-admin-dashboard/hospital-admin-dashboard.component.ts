import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalService } from '../../../services/hospital.service';
import { ReferralService } from '../../../services/referral.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-hospital-admin-dashboard',
  templateUrl: './hospital-admin-dashboard.component.html',
  styleUrls: ['./hospital-admin-dashboard.component.css']
})
export class HospitalAdminDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  currentUser: any = null;
  hospitalName = '';
  hospital: any = {};
  bedStats: any = {};
  referralStats: any = {};
  staffStats: any = {};
  recentReferrals: any[] = [];
  
  private socketSubscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private hospitalService: HospitalService,
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
    const hospitalId = this.authService.getHospitalId();

    console.log('Hospital ID from auth:', hospitalId);
    console.log('Current user:', this.authService.currentUserValue);

    if (!hospitalId) {
      console.log('No hospital ID found');
      this.loading = false;
      return;
    }

    // Load hospital details
    this.hospitalService.getHospital(hospitalId).subscribe({
      next: (hospital) => {
        console.log('Hospital data received:', hospital);
        this.hospital = hospital;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospital:', error);
        this.loading = false;
      }
    });

    // Load hospital resources
    this.hospitalService.getHospitalResources(hospitalId).subscribe({
      next: (resources) => {
        this.bedStats = resources;
      },
      error: (error) => {
        console.error('Error loading hospital resources:', error);
      }
    });

    // Load referral stats
    this.referralService.getReferralStats().subscribe({
      next: (stats) => {
        this.referralStats = stats;
      },
      error: (error) => {
        console.error('Error loading referral stats:', error);
      }
    });

    // Load recent referrals
    this.referralService.getReferrals().subscribe({
      next: (referrals) => {
        this.recentReferrals = referrals.slice(0, 10);
      },
      error: (error) => {
        console.error('Error loading referrals:', error);
      }
    });

    // Load mock staff stats
    this.staffStats = {
      total_staff: 45,
      on_duty: 32,
      doctors: 15,
      nurses: 20
    };
  }

  setupSocketListeners(): void {
    // Listen for referral alerts (incoming referrals)
    const alertSub = this.socketService.onReferralAlert().subscribe(data => {
      console.log('New referral alert:', data);
      this.showReferralAlert(data);
    });

    // Listen for bed updates
    const bedUpdateSub = this.socketService.onBedUpdate().subscribe(data => {
      console.log('Bed update received:', data);
      this.loadDashboardData();
    });

    // Listen for referral updates
    const referralSub = this.socketService.onReferralStatusUpdate().subscribe(data => {
      console.log('Referral update received:', data);
      this.referralService.getReferralStats().subscribe(stats => {
        this.referralStats = stats;
      });
    });

    this.socketSubscriptions.push(alertSub, bedUpdateSub, referralSub);
  }

  showReferralAlert(data: any): void {
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Patient Referral', {
        body: `${data.patient_name} referred from ${data.referring_hospital}`,
        icon: '/assets/images/hospital-icon.png'
      });
    }
    
    // Show in-app alert
    alert(`New ${data.priority} referral: ${data.patient_name} from ${data.referring_hospital}`);
  }

  navigateToBedUpdate(): void {
    this.router.navigate(['/dashboard/beds/update']);
  }

  navigateToStaff(): void {
    this.router.navigate(['/dashboard/staff']);
  }

  navigateToReferrals(): void {
    this.router.navigate(['/dashboard/referrals']);
  }

  getBedOccupancyRate(): number {
    if (!this.hospital.bed_capacity || this.hospital.bed_capacity === 0) {
      return 0;
    }
    return Math.round(((this.hospital.bed_capacity - (this.bedStats.available_beds || 0)) / this.hospital.bed_capacity) * 100);
  }

  getOccupancyClass(rate: number): string {
    if (rate < 70) return 'bg-success';
    if (rate < 90) return 'bg-warning';
    return 'bg-danger';
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

  refreshDashboard(): void {
    this.loadDashboardData();
  }
}