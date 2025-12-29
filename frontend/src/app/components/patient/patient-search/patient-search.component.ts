import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { Patient } from '../../../models';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-patient-search',
  templateUrl: './patient-search.component.html',
  styleUrls: ['./patient-search.component.css']
})
export class PatientSearchComponent implements OnInit, AfterViewInit {
  loading = false;
  searching = false;
  searchQuery = '';
  patients: Patient[] = [];
  
  displayedColumns: string[] = ['name', 'phone', 'aadhaar', 'blood_group', 'address', 'actions'];
  dataSource = new MatTableDataSource<Patient>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private router: Router,
    private patientService: PatientService
  ) {}

  ngOnInit(): void {
    this.loadMockPatients();
  }

  loadMockPatients(): void {
    // Show mock patients immediately
    this.patients = [
      {
        patient_id: 1,
        first_name: 'Mohit',
        last_name: 'Singh',
        phone_number: '9876543210',
        aadhaar: '123456789012',
        blood_group: 'A+',
        date_of_birth: '1990-01-01',
        gender: 'Male',
        address: 'Test Address 1',
        village: 'Test Village',
        district_name: 'Almora',
        block_name: 'Test Block'
      },
      {
        patient_id: 2,
        first_name: 'Test',
        last_name: 'Patient',
        phone_number: '9876543211',
        aadhaar: '123456789013',
        blood_group: 'B+',
        date_of_birth: '1985-05-15',
        gender: 'Female',
        address: 'Test Address 2',
        village: 'Test Village 2',
        district_name: 'Dehradun',
        block_name: 'Test Block 2'
      }
    ] as Patient[];
    
    this.dataSource.data = this.patients;
    this.searching = false;
  }

  loadAllPatients(): void {
    this.searching = true;
    this.patientService.searchPatients('mo').subscribe({
      next: (patients) => {
        if (patients.length > 0) {
          this.patients = patients;
          this.dataSource.data = patients;
        }
        this.searching = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.searching = false;
      }
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  searchPatients(): void {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      // Show message for short queries
      this.patients = [];
      this.dataSource.data = [];
      return;
    }

    this.performSearch(this.searchQuery);
  }

  performSearch(query: string): void {
    this.searching = true;
    
    this.patientService.searchPatients(query).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.dataSource.data = patients;
        this.searching = false;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.searching = false;
      }
    });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.loadAllPatients();
  }

  navigateToPatientDetail(patientId: number): void {
    this.router.navigate(['/dashboard/patients', patientId]);
  }

  navigateToNewPatient(): void {
    this.router.navigate(['/dashboard/patients/new']);
  }

  navigateToNewReferral(patient: Patient): void {
    this.router.navigate(['/dashboard/referrals/new'], {
      queryParams: { patient_id: patient.patient_id }
    });
  }

  getBloodGroupBadgeClass(bloodGroup: string): string {
    switch (bloodGroup) {
      case 'A+': return 'bg-primary';
      case 'B+': return 'bg-success';
      case 'AB+': return 'bg-info';
      case 'O+': return 'bg-warning text-dark';
      case 'A-': return 'bg-danger';
      case 'B-': return 'bg-dark';
      case 'AB-': return 'bg-secondary';
      case 'O-': return 'bg-light text-dark';
      default: return 'bg-secondary';
    }
  }

  getFullAddress(patient: Patient): string {
    const parts = [];
    if (patient.village) parts.push(patient.village);
    if (patient.block_name) parts.push(patient.block_name);
    if (patient.district_name) parts.push(patient.district_name);
    return parts.join(', ');
  }
}