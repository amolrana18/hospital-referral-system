import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { HospitalService } from '../../../services/hospital.service';
import { Hospital } from '../../../models';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = false;
  
  hospitals: Hospital[] = [];
  userRoles = [
    'Hospital Admin',
    'Doctor',
    'Nurse',
    'Patient'
  ];
  
  designations = [
    'Chief Medical Officer',
    'Senior Doctor',
    'Junior Doctor',
    'Consultant',
    'Resident',
    'Intern',
    'Head Nurse',
    'Staff Nurse',
    'Senior Nurse',
    'Administrator',
    'Manager',
    'Supervisor'
  ];
  
  departments = [
    'Emergency',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'Gynecology',
    'Surgery',
    'Medicine',
    'ICU',
    'Radiology',
    'Laboratory',
    'Pharmacy',
    'Administration'
  ];
  
  showStaffFields = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private hospitalService: HospitalService
  ) {
    console.log('RegisterComponent constructor called');
    this.registerForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      date_of_birth: ['', Validators.required],
      gender: ['', Validators.required],
      user_role: ['', Validators.required],
      hospital_id: [''],
      employee_code: [''],
      designation: [''],
      department: [''],
      specialization: [''],
      registration_number: [''],
      experience_years: [0],
      joining_date: ['']
    });
  }

  ngOnInit(): void {
    console.log('RegisterComponent initialized');
    console.log('User roles:', this.userRoles);
    
    // If already logged in, redirect to dashboard
    if (this.authService.isLoggedIn()) {
      console.log('User already logged in, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Load hospitals for staff selection (non-blocking)
    setTimeout(() => {
      this.loadHospitals();
    }, 100);

    // Watch role changes
    this.registerForm.get('user_role')?.valueChanges.subscribe(role => {
      console.log('Role changed to:', role);
      this.showStaffFields = role !== 'Patient' && role !== 'Super Admin';
      console.log('Show staff fields:', this.showStaffFields);
      
      if (this.showStaffFields) {
        this.registerForm.get('hospital_id')?.setValidators([Validators.required]);
        this.registerForm.get('designation')?.setValidators([Validators.required]);
        this.registerForm.get('department')?.setValidators([Validators.required]);
      } else {
        this.registerForm.get('hospital_id')?.clearValidators();
        this.registerForm.get('designation')?.clearValidators();
        this.registerForm.get('department')?.clearValidators();
      }
      
      this.registerForm.get('hospital_id')?.updateValueAndValidity();
      this.registerForm.get('designation')?.updateValueAndValidity();
      this.registerForm.get('department')?.updateValueAndValidity();
    });
  }

  loadHospitals(): void {
    // Load actual hospitals from database for registration
    this.hospitalService.getHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        console.log('Hospitals loaded from database:', this.hospitals.length);
      },
      error: (error) => {
        console.error('Error loading hospitals from database:', error);
        // Fallback to dummy data if API fails
        this.hospitals = [
          { 
            hospital_id: 1, 
            name: 'AIIMS Rishikesh',
            type: 'AIIMS',
            hospital_level: 'Tertiary',
            state_id: 1,
            district_id: 1,
            address: 'Rishikesh, Uttarakhand',
            pincode: '249203',
            contact_number: '0135-2462000',
            emergency_number: '0135-2462102',
            hospital_code: 'AIIMS_RKH',
            bed_capacity: 750,
            operational_beds: 600,
            icu_beds: 50,
            ventilator_beds: 25,
            is_active: true
          },
          { 
            hospital_id: 2, 
            name: 'Government Medical College, Haldwani',
            type: 'Medical College',
            hospital_level: 'Medical College',
            state_id: 1,
            district_id: 2,
            address: 'Haldwani, Uttarakhand',
            pincode: '263139',
            contact_number: '05946-286000',
            emergency_number: '05946-286108',
            hospital_code: 'GMC_HLD',
            bed_capacity: 500,
            operational_beds: 400,
            icu_beds: 30,
            ventilator_beds: 15,
            is_active: true
          },
          { 
            hospital_id: 3, 
            name: 'Doon Hospital, Dehradun',
            type: 'Government',
            hospital_level: 'District Hospital',
            state_id: 1,
            district_id: 3,
            address: 'Dehradun, Uttarakhand',
            pincode: '248001',
            contact_number: '0135-2653298',
            emergency_number: '0135-2653299',
            hospital_code: 'DOON_DDN',
            bed_capacity: 300,
            operational_beds: 250,
            icu_beds: 20,
            ventilator_beds: 10,
            is_active: true
          }
        ];
        console.log('Using fallback hospitals:', this.hospitals.length);
      }
    });
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    // Format the data
    const formData = { ...this.registerForm.value };
    
    // Convert experience_years to number
    if (formData.experience_years) {
      formData.experience_years = parseInt(formData.experience_years);
    }

    this.authService.register(formData).subscribe({
      next: (response) => {
        console.log('Registration successful:', response);
        this.success = true;
        this.loading = false;
        
        // Auto login after successful registration
        setTimeout(() => {
          this.authService.login({
            email: formData.email,
            password: formData.password
          }).subscribe({
            next: () => {
              this.router.navigate(['/dashboard']);
            },
            error: (loginError) => {
              console.error('Auto-login failed:', loginError);
              this.router.navigate(['/login']);
            }
          });
        }, 2000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        let errorMessage = 'Registration failed. Please try again.';
        
        if (error.status === 0) {
          errorMessage = 'Cannot connect to server. Please check if the backend is running on http://localhost:5000';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.error = errorMessage;
        this.loading = false;
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']);
  }
}