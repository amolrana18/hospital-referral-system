import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReferralService } from '../../../services/referral.service';
import { HospitalService } from '../../../services/hospital.service';
import { PatientService } from '../../../services/patient.service';
import { AuthService } from '../../../services/auth.service';
import { SocketService } from '../../../services/socket.service';
import { Hospital, Patient } from '../../../models';

@Component({
  selector: 'app-referral-form',
  templateUrl: './referral-form.component.html',
  styleUrls: ['./referral-form.component.css']
})
export class ReferralFormComponent implements OnInit {
  referralForm: FormGroup;
  loading = true;
  submitting = false;
  submitted = false;
  error = '';
  success = false;
  
  hospitals: Hospital[] = [];
  patients: Patient[] = [];
  searchQuery = '';
  searching = false;
  
  userRole = '';
  hospitalId?: number;
  staffId?: number;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private referralService: ReferralService,
    private hospitalService: HospitalService,
    private patientService: PatientService,
    private authService: AuthService,
    private socketService: SocketService
  ) {
    this.referralForm = this.formBuilder.group({
      patient_id: ['', Validators.required],
      receiving_hospital_id: ['', Validators.required],
      reason_for_referral: ['', Validators.required],
      clinical_summary: ['', Validators.required],
      priority: ['Routine', Validators.required],
      bed_required: [false],
      doctor_required: [false],
      ambulance_required: [false],
      bed_type_required: ['General'],
      doctor_specialization_required: [''],
      ambulance_type_required: ['Basic'],
      attached_report_ids: ['']
    });
  }

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole();
    this.hospitalId = this.authService.getHospitalId();
    this.staffId = this.authService.currentUserValue?.staffId;
    
    this.loadHospitals();
  }

  loadHospitals(): void {
    this.loading = true;
    this.hospitalService.getHospitals().subscribe({
      next: (hospitals) => {
        // Filter out current hospital
        this.hospitals = hospitals.filter(h => h.hospital_id !== this.hospitalId);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospitals:', error);
        this.loading = false;
      }
    });
  }

  searchPatients(): void {
    if (!this.searchQuery || this.searchQuery.length < 2) {
      return;
    }

    this.searching = true;
    this.patientService.searchPatients(this.searchQuery).subscribe({
      next: (patients) => {
        this.patients = patients;
        this.searching = false;
      },
      error: (error) => {
        console.error('Error searching patients:', error);
        this.searching = false;
      }
    });
  }

  selectPatient(patient: Patient): void {
    this.referralForm.patchValue({
      patient_id: patient.patient_id
    });
    this.patients = [];
    this.searchQuery = `${patient.first_name} ${patient.last_name}`;
  }

  clearPatientSearch(): void {
    this.patients = [];
    this.searchQuery = '';
    this.referralForm.patchValue({
      patient_id: ''
    });
  }

  get f() { return this.referralForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.referralForm.invalid) {
      this.error = 'Please fill in all required fields';
      return;
    }

    // Validate that a patient is selected
    if (!this.referralForm.value.patient_id) {
      this.error = 'Please select a patient';
      return;
    }

    // Validate that a receiving hospital is selected
    if (!this.referralForm.value.receiving_hospital_id) {
      this.error = 'Please select a receiving hospital';
      return;
    }

    this.submitting = true;

    const formData = {
      ...this.referralForm.value,
      // Ensure boolean values are properly set
      bed_required: !!this.referralForm.value.bed_required,
      doctor_required: !!this.referralForm.value.doctor_required,
      ambulance_required: !!this.referralForm.value.ambulance_required
    };

    console.log('Submitting referral data:', formData);

    this.referralService.createReferral(formData).subscribe({
      next: (referral) => {
        console.log('Referral created successfully:', referral);
        this.success = true;
        this.submitting = false;
        
        // Emit socket event for real-time updates
        // this.socketService.emitReferralCreated(referral);

        // Redirect after success
        setTimeout(() => {
          this.router.navigate(['/dashboard/referrals', referral.referral_id]);
        }, 2000);
      },
      error: (error) => {
        console.error('Referral creation error:', error);
        this.error = error.error?.message || error.message || 'Failed to create referral';
        this.submitting = false;
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/referrals']);
  }

  getPriorityOptions(): any[] {
    return [
      { value: 'Routine', label: 'Routine', color: 'secondary' },
      { value: 'Urgent', label: 'Urgent', color: 'info' },
      { value: 'Emergency', label: 'Emergency', color: 'warning' },
      { value: 'Critical', label: 'Critical', color: 'danger' }
    ];
  }

  getBedTypeOptions(): any[] {
    return [
      { value: 'General', label: 'General Bed' },
      { value: 'ICU', label: 'ICU Bed' },
      { value: 'Emergency', label: 'Emergency Bed' },
      { value: 'Private', label: 'Private Room' },
      { value: 'Isolation', label: 'Isolation Room' },
      { value: 'Pediatric', label: 'Pediatric Bed' },
      { value: 'Maternity', label: 'Maternity Bed' }
    ];
  }

  getAmbulanceTypeOptions(): any[] {
    return [
      { value: 'Basic', label: 'Basic Ambulance' },
      { value: 'Advanced', label: 'Advanced Ambulance' },
      { value: 'Mobile ICU', label: 'Mobile ICU' },
      { value: 'Neonatal', label: 'Neonatal Ambulance' },
      { value: 'Cardiac', label: 'Cardiac Ambulance' }
    ];
  }
}