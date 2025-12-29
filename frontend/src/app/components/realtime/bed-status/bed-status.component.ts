import { Component, OnInit, OnDestroy } from '@angular/core';
import { RealtimeService } from '../../../services/realtime.service';
import { SocketService } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription, interval } from 'rxjs';
import { BedStatus } from '../../../models';

@Component({
  selector: 'app-bed-status',
  templateUrl: './bed-status.component.html',
  styleUrls: ['./bed-status.component.css']
})
export class BedStatusComponent implements OnInit, OnDestroy {
  loading = true;
  bedStatusList: BedStatus[] = [];
  filteredBedStatus: BedStatus[] = [];
  
  filters = {
    district: '',
    search: '',
    minAvailability: 0
  };
  
  districts: string[] = [];
  userRole = '';
  
  private socketSubscriptions: Subscription[] = [];
  private refreshInterval?: Subscription;

  constructor(
    private realtimeService: RealtimeService,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.loadBedStatus();
    this.setupSocketListeners();
    this.setupAutoRefresh();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadBedStatus(): void {
    this.loading = true;
    this.realtimeService.getBedStatus().subscribe({
      next: (bedStatus) => {
        this.bedStatusList = bedStatus;
        this.extractDistricts();
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bed status:', error);
        this.loading = false;
      }
    });
  }

  extractDistricts(): void {
    const districtSet = new Set<string>();
    this.bedStatusList.forEach(status => {
      if (status.district_name) {
        districtSet.add(status.district_name);
      }
    });
    this.districts = Array.from(districtSet).sort();
  }

  setupSocketListeners(): void {
    const bedUpdateSub = this.socketService.onBedUpdate().subscribe(data => {
      console.log('Real-time bed update received:', data);
      this.loadBedStatus();
    });

    this.socketSubscriptions.push(bedUpdateSub);
  }

  setupAutoRefresh(): void {
    // Refresh every 30 seconds
    this.refreshInterval = interval(30000).subscribe(() => {
      this.loadBedStatus();
    });
  }

  applyFilters(): void {
    let filtered = [...this.bedStatusList];

    // Apply district filter
    if (this.filters.district) {
      filtered = filtered.filter(status => 
        status.district_name === this.filters.district
      );
    }

    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(status => 
        status.hospital_name.toLowerCase().includes(searchLower) ||
        status.district_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply availability filter
    if (this.filters.minAvailability > 0) {
      filtered = filtered.filter(status => 
        status.available_beds >= this.filters.minAvailability
      );
    }

    this.filteredBedStatus = filtered;
  }

  clearFilters(): void {
    this.filters = {
      district: '',
      search: '',
      minAvailability: 0
    };
    this.applyFilters();
  }

  getOccupancyClass(occupancyRate: number): string {
    if (occupancyRate < 70) return 'bg-success';
    if (occupancyRate < 90) return 'bg-warning';
    return 'bg-danger';
  }

  getAvailabilityClass(available: number, total: number): string {
    const percentage = (available / total) * 100;
    if (percentage >= 30) return 'text-success';
    if (percentage >= 10) return 'text-warning';
    return 'text-danger';
  }

  getICUAvailabilityClass(available: number, total: number): string {
    if (available >= 5) return 'text-success';
    if (available >= 2) return 'text-warning';
    return 'text-danger';
  }

  refreshData(): void {
    this.loadBedStatus();
  }

  sortBy(property: string): void {
    this.filteredBedStatus.sort((a: any, b: any) => {
      if (property === 'available_beds') {
        return b.available_beds - a.available_beds;
      } else if (property === 'occupancy_rate') {
        return b.occupancy_rate - a.occupancy_rate;
      } else if (property === 'hospital_name') {
        return a.hospital_name.localeCompare(b.hospital_name);
      }
      return 0;
    });
  }

  getTotalAvailableBeds(): number {
    return this.filteredBedStatus.reduce((sum, h) => sum + (h.available_beds || 0), 0);
  }

  getTotalICUBeds(): number {
    return this.filteredBedStatus.reduce((sum, h) => sum + (h.available_icu_beds || 0), 0);
  }

  getAverageOccupancy(): number {
    if (this.filteredBedStatus.length === 0) return 0;
    const total = this.filteredBedStatus.reduce((sum, h) => sum + (h.occupancy_rate || 0), 0);
    return Math.round(total / this.filteredBedStatus.length);
  }
}