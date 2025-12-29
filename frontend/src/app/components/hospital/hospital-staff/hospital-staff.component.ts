import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalService } from '../../../services/hospital.service';
import { AuthService } from '../../../services/auth.service';
import { Staff } from '../../../models';

declare var bootstrap: any;

@Component({
  selector: 'app-hospital-staff',
  templateUrl: './hospital-staff.component.html',
  styleUrls: ['./hospital-staff.component.css']
})
export class HospitalStaffComponent implements OnInit {
  loading = true;
  isSubmitting = false;
  hospitalId?: number;
  hospitalName = '';
  staffList: Staff[] = [];
  staffForm: FormGroup;
  
  staffStats = {
    total: 0,
    doctors: 0,
    nurses: 0,
    onDuty: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private hospitalService: HospitalService,
    private authService: AuthService
  ) {
    this.staffForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      phone: [''],
      dateOfBirth: [''],
      gender: [''],
      userRole: ['', Validators.required],
      designation: ['', Validators.required],
      department: [''],
      specialization: [''],
      qualifications: [''],
      registrationNumber: [''],
      experienceYears: [0],
      contactNumber: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.hospitalId = params['id'];
      
      // If no hospital ID in route, get it from current user (for Hospital Admin)
      if (!this.hospitalId) {
        this.hospitalId = this.authService.getHospitalId();
      }
      
      if (this.hospitalId) {
        this.loadHospitalStaff(this.hospitalId);
        this.loadHospitalDetails(this.hospitalId);
      } else {
        console.error('No hospital ID available');
        this.loading = false;
      }
    });
  }

  loadHospitalDetails(hospitalId: number): void {
    this.hospitalService.getHospital(hospitalId).subscribe({
      next: (hospital) => {
        this.hospitalName = hospital.name;
      },
      error: (error) => {
        console.error('Error loading hospital details:', error);
      }
    });
  }

  loadHospitalStaff(hospitalId: number): void {
    this.loading = true;
    this.hospitalService.getHospitalStaff(hospitalId).subscribe({
      next: (staff) => {
        this.staffList = staff;
        this.calculateStaffStats(staff);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospital staff:', error);
        this.loading = false;
      }
    });
  }

  calculateStaffStats(staff: Staff[]): void {
    this.staffStats.total = staff.length;
    this.staffStats.doctors = staff.filter(s => 
      s.designation.includes('Doctor') || s.designation.includes('Medical')
    ).length;
    this.staffStats.nurses = staff.filter(s => 
      s.designation.includes('Nurse')
    ).length;
    this.staffStats.onDuty = staff.filter(s => 
      s.current_status === 'On-Duty'
    ).length;
  }

  getDesignationBadgeClass(designation: string): string {
    if (designation.includes('Doctor') || designation.includes('Medical')) {
      return 'bg-primary';
    } else if (designation.includes('Nurse')) {
      return 'bg-success';
    } else if (designation.includes('Admin')) {
      return 'bg-info';
    } else if (designation.includes('Technician')) {
      return 'bg-warning text-dark';
    } else {
      return 'bg-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'On-Duty': return 'bg-success';
      case 'Off-Duty': return 'bg-secondary';
      case 'On-Leave': return 'bg-warning text-dark';
      case 'On-Call': return 'bg-info';
      case 'Emergency Duty': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getStaffByDepartment(): any {
    const departments: { [key: string]: Staff[] } = {};
    
    this.staffList.forEach(staff => {
      const department = staff.department || 'Other';
      if (!departments[department]) {
        departments[department] = [];
      }
      departments[department].push(staff);
    });
    
    return Object.keys(departments).map(dept => ({
      name: dept,
      staff: departments[dept],
      count: departments[dept].length
    }));
  }

  openAddStaffModal(): void {
    this.staffForm.reset();
    const modal = new bootstrap.Modal(document.getElementById('addStaffModal'));
    modal.show();
  }

  onSubmit(): void {
    if (this.staffForm.valid && this.hospitalId) {
      this.isSubmitting = true;
      
      const formData = this.staffForm.value;
      const staffData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        user_role: formData.userRole,
        hospital_id: this.hospitalId,
        designation: formData.designation,
        department: formData.department,
        specialization: formData.specialization,
        qualifications: formData.qualifications,
        registration_number: formData.registrationNumber,
        experience_years: formData.experienceYears,
        contact_number: formData.contactNumber
      };

      this.hospitalService.addStaff(staffData).subscribe({
        next: (response) => {
          console.log('Staff added successfully:', response);
          this.isSubmitting = false;
          
          const modal = bootstrap.Modal.getInstance(document.getElementById('addStaffModal'));
          modal.hide();
          
          this.loadHospitalStaff(this.hospitalId!);
          alert('Staff member added successfully!');
        },
        error: (error) => {
          console.error('Error adding staff:', error);
          this.isSubmitting = false;
          alert('Error adding staff member. Please try again.');
        }
      });
    }
  }

  passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }
}