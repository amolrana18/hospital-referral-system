import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ReferralService } from '../../../services/referral.service';
import { HospitalService } from '../../../services/hospital.service';
import { AuthService } from '../../../services/auth.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';
import { Referral } from '../../../models';

@Component({
  selector: 'app-referral-list',
  templateUrl: './referral-list.component.html',
  styleUrls: ['./referral-list.component.css']
})
export class ReferralListComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = true;
  referrals: Referral[] = [];
  userRole = '';
  hospitalId?: number;
  
  displayedColumns: string[] = ['referral_code', 'patient', 'hospitals', 'priority', 'status', 'date', 'actions'];
  dataSource = new MatTableDataSource<Referral>();
  
  filters = {
    status: '',
    priority: '',
    search: ''
  };
  
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Approved', label: 'Approved' },
    { value: 'Rejected', label: 'Rejected' },
    { value: 'In Transit', label: 'In Transit' },
    { value: 'Admitted', label: 'Admitted' },
    { value: 'Completed', label: 'Completed' }
  ];
  
  priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'Routine', label: 'Routine' },
    { value: 'Urgent', label: 'Urgent' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Critical', label: 'Critical' }
  ];
  
  private socketSubscriptions: Subscription[] = [];
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private referralService: ReferralService,
    private hospitalService: HospitalService,
    private authService: AuthService,
    private socketService: SocketService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.hospitalId = this.authService.getHospitalId();
    
    this.loadReferrals();
    this.setupSocketListeners();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
  }

  loadReferrals(): void {
    this.loading = true;
    this.referralService.getReferrals().subscribe({
      next: (referrals) => {
        this.referrals = referrals;
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading referrals:', error);
        this.loading = false;
      }
    });
  }

  setupSocketListeners(): void {
    const referralUpdateSub = this.socketService.onReferralStatusUpdate().subscribe(data => {
      console.log('Referral update received:', data);
      this.loadReferrals();
    });

    const newReferralSub = this.socketService.onReferralCreated().subscribe(data => {
      console.log('New referral received:', data);
      this.loadReferrals();
    });

    this.socketSubscriptions.push(referralUpdateSub, newReferralSub);
  }

  applyFilters(): void {
    let filteredData = [...this.referrals];

    // Apply status filter
    if (this.filters.status) {
      filteredData = filteredData.filter(r => r.status === this.filters.status);
    }

    // Apply priority filter
    if (this.filters.priority) {
      filteredData = filteredData.filter(r => r.priority === this.filters.priority);
    }

    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filteredData = filteredData.filter(r => 
        r.patient_first_name?.toLowerCase().includes(searchLower) ||
        r.patient_last_name?.toLowerCase().includes(searchLower) ||
        r.referral_code?.toLowerCase().includes(searchLower) ||
        r.referring_hospital_name?.toLowerCase().includes(searchLower) ||
        r.receiving_hospital_name?.toLowerCase().includes(searchLower)
      );
    }

    this.dataSource.data = filteredData;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      priority: '',
      search: ''
    };
    this.applyFilters();
  }

  navigateToNewReferral(): void {
    this.router.navigate(['/dashboard/referrals/new']);
  }

  navigateToReferralDetail(referralId: number): void {
    this.router.navigate(['/dashboard/referrals', referralId]);
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

  canTakeAction(referral: Referral): boolean {
    if (this.userRole === 'Hospital Admin') {
      return referral.status === 'Submitted' && 
             referral.receiving_hospital_id === this.hospitalId;
    }
    return false;
  }

  approveReferral(referral: Referral): void {
    this.referralService.updateReferralStatus(referral.referral_id, {
      status: 'Approved',
      review_notes: 'Referral approved by hospital admin'
    }).subscribe({
      next: () => {
        this.loadReferrals();
      },
      error: (error) => {
        console.error('Error approving referral:', error);
      }
    });
  }

  rejectReferral(referral: Referral): void {
    this.referralService.updateReferralStatus(referral.referral_id, {
      status: 'Rejected',
      review_notes: 'Referral rejected by hospital admin'
    }).subscribe({
      next: () => {
        this.loadReferrals();
      },
      error: (error) => {
        console.error('Error rejecting referral:', error);
      }
    });
  }

  getReferralDirection(referral: Referral): string {
    if (referral.referring_hospital_id === this.hospitalId) {
      return 'Outgoing';
    } else if (referral.receiving_hospital_id === this.hospitalId) {
      return 'Incoming';
    }
    return '';
  }

  getReferralDirectionClass(referral: Referral): string {
    if (referral.referring_hospital_id === this.hospitalId) {
      return 'text-primary';
    } else if (referral.receiving_hospital_id === this.hospitalId) {
      return 'text-success';
    }
    return '';
  }
}