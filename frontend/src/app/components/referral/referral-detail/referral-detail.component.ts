import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReferralService } from '../../../services/referral.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { Referral, TreatmentUpdate } from '../../../models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-referral-detail',
  templateUrl: './referral-detail.component.html',
  styleUrls: ['./referral-detail.component.css']
})
export class ReferralDetailComponent implements OnInit, OnDestroy {
  loading = true;
  referralId!: number;
  referral!: Referral;
  timeline: any[] = [];
  treatmentUpdates: TreatmentUpdate[] = [];
  
  userRole = '';
  hospitalId?: number;
  canUpdateStatus = false;
  canAddUpdates = false;
  
  statusUpdateForm = {
    status: '',
    review_notes: ''
  };
  
  treatmentUpdateForm = {
    update_type: 'Consultation',
    update_notes: ''
  };
  
  showStatusUpdate = false;
  showTreatmentUpdate = false;
  
  updateTypes = [
    'Consultation',
    'Procedure',
    'Medication',
    'Discharge',
    'Follow-up',
    'Surgery',
    'Investigation',
    'Observation'
  ];
  
  private socketSubscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private referralService: ReferralService,
    private authService: AuthService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.referralId = params['id'];
      this.loadReferralDetails();
    });

    this.userRole = this.authService.getUserRole();
    this.hospitalId = this.authService.getHospitalId();
    
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReferralDetails(): void {
    this.loading = true;
    
    this.referralService.getReferral(this.referralId).subscribe({
      next: (referral) => {
        this.referral = referral;
        this.checkPermissions();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading referral:', error);
        this.loading = false;
      }
    });

    // Load timeline
    this.referralService.getReferralTimeline(this.referralId).subscribe({
      next: (timeline) => {
        this.timeline = timeline;
      },
      error: (error) => {
        console.error('Error loading timeline:', error);
      }
    });
  }

  checkPermissions(): void {
    // Hospital Admin can update status for incoming referrals
    this.canUpdateStatus = this.userRole === 'Hospital Admin' && 
      this.referral.receiving_hospital_id === this.hospitalId &&
      ['Submitted', 'Under Review'].includes(this.referral.status);

    // Doctors/Nurses can add treatment updates for admitted patients
    this.canAddUpdates = (this.userRole === 'Doctor' || this.userRole === 'Nurse') &&
      this.referral.receiving_hospital_id === this.hospitalId &&
      ['Admitted', 'Treatment Started'].includes(this.referral.status);
  }

  setupSocketListeners(): void {
    // Join referral room
    this.socketService.joinReferralRoom(this.referralId);

    // Listen for status updates
    const statusUpdateSub = this.socketService.onReferralStatusUpdate().subscribe(data => {
      if (data.referral_id === this.referralId) {
        this.loadReferralDetails();
      }
    });

    // Listen for treatment updates
    const treatmentUpdateSub = this.socketService.onTreatmentUpdate().subscribe(data => {
      if (data.referral_id === this.referralId) {
        this.loadReferralDetails();
      }
    });

    this.socketSubscriptions.push(statusUpdateSub, treatmentUpdateSub);
  }

  updateStatus(): void {
    if (!this.statusUpdateForm.status) {
      return;
    }

    this.referralService.updateReferralStatus(this.referralId, this.statusUpdateForm).subscribe({
      next: () => {
        this.showStatusUpdate = false;
        this.statusUpdateForm = { status: '', review_notes: '' };
        this.loadReferralDetails();
      },
      error: (error) => {
        console.error('Error updating status:', error);
      }
    });
  }

  addTreatmentUpdate(): void {
    if (!this.treatmentUpdateForm.update_notes) {
      return;
    }

    this.referralService.addTreatmentUpdate(this.referralId, this.treatmentUpdateForm).subscribe({
      next: () => {
        this.showTreatmentUpdate = false;
        this.treatmentUpdateForm = { update_type: 'Consultation', update_notes: '' };
        this.loadReferralDetails();
      },
      error: (error) => {
        console.error('Error adding treatment update:', error);
      }
    });
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
      case 'Admitted': return 'bg-info';
      case 'Submitted': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getTimelineIcon(event: string): string {
    switch (event) {
      case 'Created': return 'fas fa-plus-circle text-primary';
      case 'Status Update': return 'fas fa-sync-alt text-info';
      case 'Treatment Update': return 'fas fa-stethoscope text-success';
      default: return 'fas fa-circle text-secondary';
    }
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/referrals']);
  }

  toggleStatusUpdate(): void {
    this.showStatusUpdate = !this.showStatusUpdate;
    if (this.showStatusUpdate) {
      this.showTreatmentUpdate = false;
    }
  }

  toggleTreatmentUpdate(): void {
    this.showTreatmentUpdate = !this.showTreatmentUpdate;
    if (this.showTreatmentUpdate) {
      this.showStatusUpdate = false;
    }
  }
}