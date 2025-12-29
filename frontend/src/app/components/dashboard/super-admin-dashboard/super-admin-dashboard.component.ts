import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReferralService } from '../../../services/referral.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { DashboardStats, ReferralStats, DistrictStat, HospitalStat } from '../../../models';

@Component({
  selector: 'app-super-admin-dashboard',
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.css']
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  loading = true;
  stats: DashboardStats = {
    total_hospitals: 0,
    total_beds: 0,
    available_beds: 0,
    total_icu_beds: 0,
    total_ventilators: 0
  };
  
  referralStats: ReferralStats = {
    total: 0,
    submitted: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    emergency: 0,
    critical: 0
  };
  
  districtStats: DistrictStat[] = [];
  bedOccupancy: HospitalStat[] = [];
  recentReferrals: any[] = [];
  
  private socketSubscriptions: Subscription[] = [];

  constructor(
    private referralService: ReferralService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load super admin dashboard data using the referral service method
    this.referralService.getSuperAdminDashboard().subscribe({
      next: (data) => {
        this.stats = {
          total_hospitals: data.hospitalStats.total_hospitals,
          total_beds: data.hospitalStats.total_beds,
          available_beds: data.hospitalStats.available_beds,
          total_icu_beds: data.hospitalStats.available_icu_beds,
          total_ventilators: data.hospitalStats.available_ventilators
        };
        this.referralStats = data.referralStats;
        this.recentReferrals = data.recentReferrals;
        this.districtStats = data.districtStats;
        this.bedOccupancy = data.bedOccupancy;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        // Fallback to individual API calls if dashboard endpoint fails
        this.loadFallbackData();
      }
    });
  }

  loadFallbackData(): void {
    // Load referral stats as fallback
    this.referralService.getReferralStats().subscribe({
      next: (stats) => {
        this.referralStats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading referral stats:', error);
        this.loading = false;
      }
    });
  }



  setupSocketListeners(): void {
    // Listen for bed updates
    const bedUpdateSub = this.socketService.onBedUpdate().subscribe(data => {
      console.log('Bed update received:', data);
      // Update dashboard stats
      this.loadDashboardData();
    });

    // Listen for referral updates
    const referralSub = this.socketService.onReferralStatusUpdate().subscribe(data => {
      console.log('Referral update received:', data);
      // Reload entire dashboard data to get latest stats
      this.loadDashboardData();
    });

    // Listen for new referrals
    const newReferralSub = this.socketService.onReferralCreated().subscribe(data => {
      console.log('New referral created:', data);
      // Reload dashboard data
      this.loadDashboardData();
    });

    this.socketSubscriptions.push(bedUpdateSub, referralSub, newReferralSub);
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