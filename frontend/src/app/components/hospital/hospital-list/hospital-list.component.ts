import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalService } from '../../../services/hospital.service';
import { Hospital } from '../../../models';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-hospital-list',
  templateUrl: './hospital-list.component.html',
  styleUrls: ['./hospital-list.component.css']
})
export class HospitalListComponent implements OnInit, AfterViewInit {
  loading = true;
  hospitals: Hospital[] = [];
  
  displayedColumns: string[] = ['name', 'type', 'district', 'beds', 'icu_beds', 'status', 'actions'];
  dataSource = new MatTableDataSource<Hospital>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private hospitalService: HospitalService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadHospitals();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadHospitals(): void {
    this.loading = true;
    this.hospitalService.getHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        this.dataSource.data = hospitals;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospitals:', error);
        this.loading = false;
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  navigateToAddHospital(): void {
    this.router.navigate(['/dashboard/hospitals/new']);
  }

  navigateToEditHospital(hospitalId: number): void {
    this.router.navigate(['/dashboard/hospitals/edit', hospitalId]);
  }

  navigateToHospitalStaff(hospitalId: number): void {
    this.router.navigate(['/dashboard/hospitals', hospitalId, 'staff']);
  }

  toggleHospitalStatus(hospital: Hospital): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: hospital.is_active ? 'Deactivate Hospital' : 'Activate Hospital',
        message: `Are you sure you want to ${hospital.is_active ? 'deactivate' : 'activate'} ${hospital.name}?`,
        confirmText: hospital.is_active ? 'Deactivate' : 'Activate',
        confirmColor: hospital.is_active ? 'warn' : 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateHospitalStatus(hospital.hospital_id, !hospital.is_active);
      }
    });
  }

  updateHospitalStatus(hospitalId: number, isActive: boolean): void {
    this.hospitalService.updateHospital(hospitalId, { is_active: isActive }).subscribe({
      next: () => {
        this.loadHospitals();
      },
      error: (error) => {
        console.error('Error updating hospital status:', error);
      }
    });
  }

  getHospitalTypeClass(type: string): string {
    switch (type) {
      case 'Government': return 'bg-primary';
      case 'Private': return 'bg-success';
      case 'Medical College': return 'bg-info';
      case 'AIIMS': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getBedAvailabilityClass(available: number, total: number): string {
    const percentage = (available / total) * 100;
    if (percentage >= 30) return 'text-success';
    if (percentage >= 10) return 'text-warning';
    return 'text-danger';
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'bg-success' : 'bg-danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
}