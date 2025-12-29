import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalService } from '../../../services/hospital.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';

@Component({
  selector: 'app-update-bed-status',
  templateUrl: './update-bed-status.component.html',
  styleUrls: ['./update-bed-status.component.css']
})
export class UpdateBedStatusComponent implements OnInit {
  bedForm: FormGroup;
  loading = true;
  submitting = false;
  submitted = false;
  error = '';
  success = false;
  
  hospitalId?: number;
  hospitalName = '';
  currentStats = {
    bed_capacity: 0,
    operational_beds: 0,
    icu_beds: 0,
    ventilator_beds: 0
  };

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private hospitalService: HospitalService,
    private authService: AuthService,
    private socketService: SocketService
  ) {
    this.bedForm = this.formBuilder.group({
      operational_beds: [0, [Validators.required, Validators.min(0)]],
      icu_beds: [0, [Validators.required, Validators.min(0)]],
      ventilator_beds: [0, [Validators.required, Validators.min(0)]],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.hospitalId = this.authService.getHospitalId();
    
    if (!this.hospitalId) {
      this.error = 'No hospital associated with your account';
      this.loading = false;
      return;
    }

    this.loadHospitalData();
  }

  loadHospitalData(): void {
    this.loading = true;
    
    // Load hospital details
    this.hospitalService.getHospital(this.hospitalId!).subscribe({
      next: (hospital) => {
        this.hospitalName = hospital.name;
        this.currentStats = {
          bed_capacity: hospital.bed_capacity,
          operational_beds: hospital.operational_beds,
          icu_beds: hospital.icu_beds,
          ventilator_beds: hospital.ventilator_beds
        };
        
        // Set form values
        this.bedForm.patchValue({
          operational_beds: hospital.operational_beds,
          icu_beds: hospital.icu_beds,
          ventilator_beds: hospital.ventilator_beds
        });
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospital:', error);
        this.error = 'Failed to load hospital data';
        this.loading = false;
      }
    });
  }

  get f() { return this.bedForm.controls; }

  validateBedCounts(): void {
    const operationalBeds = this.f['operational_beds'].value;
    const icuBeds = this.f['icu_beds'].value;
    const ventilatorBeds = this.f['ventilator_beds'].value;

    // ICU beds cannot exceed operational beds
    if (icuBeds > operationalBeds) {
      this.f['icu_beds'].setErrors({ exceedsOperational: true });
    } else {
      this.f['icu_beds'].setErrors(null);
    }

    // Ventilator beds cannot exceed ICU beds
    if (ventilatorBeds > icuBeds) {
      this.f['ventilator_beds'].setErrors({ exceedsICU: true });
    } else {
      this.f['ventilator_beds'].setErrors(null);
    }
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.bedForm.invalid) {
      return;
    }

    this.submitting = true;

    const formData = this.bedForm.value;
    
    // Convert to numbers
    formData.operational_beds = parseInt(formData.operational_beds);
    formData.icu_beds = parseInt(formData.icu_beds);
    formData.ventilator_beds = parseInt(formData.ventilator_beds);

    this.hospitalService.updateBedAvailability(this.hospitalId!, formData).subscribe({
      next: () => {
        this.success = true;
        this.submitting = false;
        
        // Emit socket event for real-time updates
        // this.socketService.emitBedUpdate({
        //   hospital_id: this.hospitalId,
        //   hospital_name: this.hospitalName,
        //   operational_beds: formData.operational_beds,
        //   icu_beds: formData.icu_beds,
        //   ventilator_beds: formData.ventilator_beds,
        //   updated_at: new Date()
        // });

        // Update current stats
        this.currentStats.operational_beds = formData.operational_beds;
        this.currentStats.icu_beds = formData.icu_beds;
        this.currentStats.ventilator_beds = formData.ventilator_beds;

        // Reset form after success
        setTimeout(() => {
          this.submitted = false;
          this.success = false;
        }, 3000);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update bed availability';
        this.submitting = false;
      }
    });
  }

  calculateOccupancyRate(): number {
    if (this.currentStats.bed_capacity === 0) return 0;
    return Math.round(((this.currentStats.bed_capacity - this.currentStats.operational_beds) / this.currentStats.bed_capacity) * 100);
  }

  getOccupancyClass(rate: number): string {
    if (rate < 70) return 'text-success';
    if (rate < 90) return 'text-warning';
    return 'text-danger';
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/hospital-admin']);
  }
}