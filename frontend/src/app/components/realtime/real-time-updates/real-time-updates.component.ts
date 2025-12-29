import { Component, OnInit, OnDestroy } from '@angular/core';
import { SocketService } from '../../../services/socket.service';
import { RealtimeService } from '../../../services/realtime.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-real-time-updates',
  templateUrl: './real-time-updates.component.html',
  styleUrls: ['./real-time-updates.component.css']
})
export class RealTimeUpdatesComponent implements OnInit, OnDestroy {
  updates: any[] = [];
  loading = true;
  userRole = '';
  hospitalId?: number;
  
  filters = {
    type: '',
    priority: ''
  };
  
  updateTypes = [
    { value: '', label: 'All Types' },
    { value: 'referral', label: 'Referrals' },
    { value: 'bed', label: 'Bed Updates' },
    { value: 'ambulance', label: 'Ambulance Updates' },
    { value: 'hospital', label: 'Hospital Updates' }
  ];
  
  priorities = [
    { value: '', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'routine', label: 'Routine' }
  ];
  
  private socketSubscriptions: Subscription[] = [];

  constructor(
    private socketService: SocketService,
    private realtimeService: RealtimeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.hospitalId = this.authService.getHospitalId();
    
    this.loadInitialUpdates();
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadInitialUpdates(): void {
    this.loading = true;
    this.realtimeService.getReferralUpdates().subscribe({
      next: (referrals) => {
        this.updates = referrals.map(ref => ({
          id: ref.referral_id,
          type: 'referral',
          title: 'New Referral',
          message: `${ref.patient_name} referred from ${ref.referring_hospital}`,
          priority: ref.priority,
          time: new Date(ref.referral_date),
          data: ref
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading updates:', error);
        this.loading = false;
      }
    });
  }

  setupSocketListeners(): void {
    // Listen for new referrals
    const referralSub = this.socketService.onReferralCreated().subscribe(data => {
      this.addUpdate({
        type: 'referral',
        title: 'New Referral Created',
        message: `Patient referred from ${data.referring_hospital_name}`,
        priority: data.priority,
        time: new Date(),
        data: data
      });
    });

    // Listen for bed updates
    const bedSub = this.socketService.onBedUpdate().subscribe(data => {
      this.addUpdate({
        type: 'bed',
        title: 'Bed Availability Updated',
        message: `${data.hospital_name} updated bed count`,
        priority: 'routine',
        time: new Date(),
        data: data
      });
    });

    // Listen for hospital updates
    const hospitalSub = this.socketService.onHospitalUpdate().subscribe(data => {
      this.addUpdate({
        type: 'hospital',
        title: 'Hospital Information Updated',
        message: `${data.name} details updated`,
        priority: 'routine',
        time: new Date(),
        data: data
      });
    });

    // Listen for treatment updates
    const treatmentSub = this.socketService.onTreatmentUpdate().subscribe(data => {
      this.addUpdate({
        type: 'treatment',
        title: 'Treatment Update',
        message: `Treatment update for referral ${data.referral_id}`,
        priority: data.is_critical ? 'critical' : 'routine',
        time: new Date(),
        data: data
      });
    });

    this.socketSubscriptions.push(referralSub, bedSub, hospitalSub, treatmentSub);
  }

  addUpdate(update: any): void {
    this.updates.unshift(update);
    
    // Keep only last 100 updates
    if (this.updates.length > 100) {
      this.updates.pop();
    }
  }

  applyFilters(): void {
    // In a real implementation, this would filter the updates array
    // For now, we'll just log the filter values
    console.log('Filters applied:', this.filters);
  }

  clearFilters(): void {
    this.filters = {
      type: '',
      priority: ''
    };
  }

  getUpdateIcon(type: string): string {
    switch (type) {
      case 'referral': return 'fas fa-ambulance';
      case 'bed': return 'fas fa-bed';
      case 'hospital': return 'fas fa-hospital';
      case 'treatment': return 'fas fa-stethoscope';
      case 'ambulance': return 'fas fa-truck-medical';
      default: return 'fas fa-bell';
    }
  }

  getUpdateColor(type: string): string {
    switch (type) {
      case 'referral': return 'text-primary';
      case 'bed': return 'text-success';
      case 'hospital': return 'text-info';
      case 'treatment': return 'text-warning';
      case 'ambulance': return 'text-danger';
      default: return 'text-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'critical': return 'bg-danger';
      case 'emergency': return 'bg-warning text-dark';
      case 'urgent': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getTimeAgo(time: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(time).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  clearAllUpdates(): void {
    this.updates = [];
  }

  markAllAsRead(): void {
    // In a real implementation, this would mark updates as read
    console.log('Marking all updates as read');
  }
}