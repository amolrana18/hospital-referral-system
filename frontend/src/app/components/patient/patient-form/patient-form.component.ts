import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientService } from '../../../services/patient.service';
import { HospitalService } from '../../../services/hospital.service';
import { District, Block } from '../../../models';

@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css']
})
export class PatientFormComponent implements OnInit {
  patientForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = false;
  
  districts: District[] = [];
  blocks: Block[] = [];
  
  bloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'
  ];
  
  maritalStatuses = [
    'Single', 'Married', 'Divorced', 'Widowed', 'Separated'
  ];
  
  categories = [
    'General', 'SC', 'ST', 'OBC'
  ];
  
  rhFactors = [
    'Positive', 'Negative', 'Unknown'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private patientService: PatientService,
    private hospitalService: HospitalService
  ) {
    this.patientForm = this.formBuilder.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      date_of_birth: [''],
      gender: ['Male', Validators.required],
      phone_number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      alternate_phone: ['', Validators.pattern('^[0-9]{10}$')],
      email: ['', Validators.email],
      address: ['', Validators.required],
      state_id: [1], // Uttarakhand
      district_id: [''],
      block_id: [''],
      village: [''],
      pincode: ['', Validators.pattern('^[0-9]{6}$')],
      aadhaar: ['', Validators.pattern('^[0-9]{12}$')],
      pan_number: ['', Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')],
      blood_group: ['Unknown'],
      rh_factor: ['Unknown'],
      marital_status: [''],
      occupation: [''],
      religion: [''],
      category: [''],
      medical_history: [''],
      surgical_history: [''],
      allergies: [''],
      current_medications: [''],
      family_history: [''],
      emergency_contact_name: [''],
      emergency_contact_number: ['', Validators.pattern('^[0-9]{10}$')],
      emergency_contact_relationship: ['']
    });
  }

  ngOnInit(): void {
    this.loadDistricts();
    
    // Watch district changes
    this.patientForm.get('district_id')?.valueChanges.subscribe(districtId => {
      if (districtId) {
        this.loadBlocksByDistrict(districtId);
      } else {
        this.blocks = [];
      }
    });
  }

  loadDistricts(): void {
    this.hospitalService.getDistricts().subscribe({
      next: (districts) => {
        this.districts = districts;
      },
      error: (error) => {
        console.error('Error loading districts:', error);
      }
    });
  }

  loadBlocksByDistrict(districtId: number): void {
    this.hospitalService.getBlocksByDistrict(districtId).subscribe({
      next: (blocks) => {
        this.blocks = blocks;
      },
      error: (error) => {
        console.error('Error loading blocks:', error);
      }
    });
  }

  get f() { return this.patientForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.patientForm.invalid) {
      return;
    }

    this.loading = true;

    // Clean form data - convert empty strings to null for optional fields
    const formData = { ...this.patientForm.value };
    
    // Convert empty strings to null for optional fields
    Object.keys(formData).forEach(key => {
      if (formData[key] === '') {
        formData[key] = null;
      }
    });

    this.patientService.createPatient(formData).subscribe({
      next: (patient) => {
        this.success = true;
        this.loading = false;
        
        setTimeout(() => {
          this.router.navigate(['/dashboard/patients/search']);
        }, 2000);
      },
      error: (error) => {
        console.error('Patient creation error:', error);
        
        // Handle different types of errors
        if (error.error?.message) {
          this.error = error.error.message;
        } else if (error.error?.errors) {
          this.error = error.error.errors.join(', ');
        } else {
          this.error = error.message || 'Failed to create patient';
        }
        
        this.loading = false;
      }
    });
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard']);
  }

  calculateAge(): number {
    const dob = this.f['date_of_birth'].value;
    if (!dob) return 0;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}