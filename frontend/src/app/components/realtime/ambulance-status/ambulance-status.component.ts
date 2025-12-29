import { Component, OnInit, OnDestroy } from '@angular/core';
import { RealtimeService } from '../../../services/realtime.service';
import { SocketService } from '../../../services/socket.service';
import { Subscription, interval } from 'rxjs';
import { Ambulance } from '../../../models';

@Component({
  selector: 'app-ambulance-status',
  templateUrl: './ambulance-status.component.html',
  styleUrls: ['./ambulance-status.component.css']
})
export class AmbulanceStatusComponent implements OnInit, OnDestroy {
  loading = true;
  ambulances: Ambulance[] = [];
  filteredAmbulances: Ambulance[] = [];
  
  filters = {
    status: '',
    district: '',
    type: '',
    search: ''
  };
  
  districts: string[] = [];
  statuses: string[] = [];
  types: string[] = [];
  
  private socketSubscriptions: Subscription[] = [];
  private refreshInterval?: Subscription;
  private map: any;

  constructor(
    private realtimeService: RealtimeService,
    private socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.loadAmbulanceStatus();
    this.setupAutoRefresh();
    this.initMap();
  }

  ngOnDestroy(): void {
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
    }
  }

  loadAmbulanceStatus(): void {
    this.loading = true;
    this.realtimeService.getAmbulanceStatus().subscribe({
      next: (ambulances) => {
        this.ambulances = ambulances;
        this.extractFilterOptions();
        this.applyFilters();
        this.updateMap();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ambulance status:', error);
        this.loading = false;
      }
    });
  }

  extractFilterOptions(): void {
    const districtSet = new Set<string>();
    const statusSet = new Set<string>();
    const typeSet = new Set<string>();
    
    this.ambulances.forEach(ambulance => {
      if (ambulance.district_name) districtSet.add(ambulance.district_name);
      if (ambulance.current_status) statusSet.add(ambulance.current_status);
      if (ambulance.ambulance_type) typeSet.add(ambulance.ambulance_type);
    });
    
    this.districts = Array.from(districtSet).sort();
    this.statuses = Array.from(statusSet).sort();
    this.types = Array.from(typeSet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.ambulances];

    // Apply status filter
    if (this.filters.status) {
      filtered = filtered.filter(ambulance => 
        ambulance.current_status === this.filters.status
      );
    }

    // Apply district filter
    if (this.filters.district) {
      filtered = filtered.filter(ambulance => 
        ambulance.district_name === this.filters.district
      );
    }

    // Apply type filter
    if (this.filters.type) {
      filtered = filtered.filter(ambulance => 
        ambulance.ambulance_type === this.filters.type
      );
    }

    // Apply search filter
    if (this.filters.search) {
      const searchLower = this.filters.search.toLowerCase();
      filtered = filtered.filter(ambulance => 
        ambulance.vehicle_number.toLowerCase().includes(searchLower) ||
        ambulance.driver_name?.toLowerCase().includes(searchLower) ||
        ambulance.stationed_hospital?.toLowerCase().includes(searchLower)
      );
    }

    this.filteredAmbulances = filtered;
  }

  clearFilters(): void {
    this.filters = {
      status: '',
      district: '',
      type: '',
      search: ''
    };
    this.applyFilters();
  }

  initMap(): void {
    // This would be implemented with a proper mapping library like Leaflet or Google Maps
    // For now, we'll just set up the structure
    console.log('Map initialization would go here');
  }

  updateMap(): void {
    // Update map markers based on filtered ambulances
    const ambulanceMarkers = this.filteredAmbulances
      .filter(ambulance => ambulance.gps_latitude && ambulance.gps_longitude)
      .map(ambulance => ({
        lat: ambulance.gps_latitude!,
        lng: ambulance.gps_longitude!,
        title: ambulance.vehicle_number,
        status: ambulance.current_status,
        driver: ambulance.driver_name
      }));
    
    console.log('Map markers:', ambulanceMarkers);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Available': return 'bg-success';
      case 'On-Duty': return 'bg-primary';
      case 'Maintenance': return 'bg-warning text-dark';
      case 'Offline': return 'bg-danger';
      case 'Fuel Refill': return 'bg-info';
      case 'Cleaning': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'Mobile ICU': return 'bg-danger';
      case 'Advanced': return 'bg-warning text-dark';
      case 'Cardiac': return 'bg-info';
      case 'Neonatal': return 'bg-primary';
      default: return 'bg-secondary';
    }
  }

  getEquipmentIcon(equipped: boolean): string {
    return equipped ? 'fa-check text-success' : 'fa-times text-danger';
  }

  getLocationTimeClass(minutes: number): string {
    if (minutes < 5) return 'text-success';
    if (minutes < 15) return 'text-warning';
    return 'text-danger';
  }

  refreshData(): void {
    this.loadAmbulanceStatus();
  }

  sortBy(property: string): void {
    this.filteredAmbulances.sort((a: any, b: any) => {
      if (property === 'status') {
        const statusOrder = ['Available', 'On-Duty', 'Maintenance', 'Offline'];
        return statusOrder.indexOf(a.current_status) - statusOrder.indexOf(b.current_status);
      } else if (property === 'district') {
        return (a.district_name || '').localeCompare(b.district_name || '');
      } else if (property === 'type') {
        return (a.ambulance_type || '').localeCompare(b.ambulance_type || '');
      }
      return 0;
    });
  }

  setupAutoRefresh(): void {
    // Refresh every 30 seconds
    this.refreshInterval = interval(30000).subscribe(() => {
      this.loadAmbulanceStatus();
    });
  }
}