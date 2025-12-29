import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HospitalService } from '../../../services/hospital.service';
import { District, Block } from '../../../models';

@Component({
  selector: 'app-hospital-form',
  templateUrl: './hospital-form.component.html',
  styleUrls: ['./hospital-form.component.css']
})
export class HospitalFormComponent implements OnInit {
  hospitalForm: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = false;
  isEditMode = false;
  hospitalId?: number;
  
  districts: District[] = [];
  blocks: Block[] = [];
  
  hospitalTypes = [
    'Government',
    'Private',
    'Charitable',
    'Trust',
    'Medical College',
    'AIIMS',
    'ESI',
    'Military'
  ];
  
  hospitalLevels = [
    'Primary Health Centre',
    'Community Health Centre',
    'Sub-District Hospital',
    'District Hospital',
    'Tertiary',
    'Super Specialty',
    'Medical College'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private hospitalService: HospitalService
  ) {
    this.hospitalForm = this.formBuilder.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      hospital_level: ['', Validators.required],
      state_id: [1], // Uttarakhand state ID
      district_id: ['', Validators.required],
      block_id: [{value: '', disabled: true}],
      address: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      contact_number: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      emergency_number: ['', Validators.required],
      email: ['', [Validators.email]],
      bed_capacity: [0, [Validators.required, Validators.min(0)]],
      operational_beds: [0, [Validators.required, Validators.min(0)]],
      icu_beds: [0, [Validators.required, Validators.min(0)]],
      ventilator_beds: [0, [Validators.required, Validators.min(0)]],
      latitude: [''],
      longitude: [''],
      established_year: ['', [Validators.pattern('^[0-9]{4}$')]],
      website: ['']
    });
  }

  ngOnInit(): void {
    // Check if in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.hospitalId = params['id'];
        this.loadHospitalData(this.hospitalId);
      }
    });

    // Load districts
    this.loadDistricts();

    // Watch district changes to load blocks
    this.hospitalForm.get('district_id')?.valueChanges.subscribe(districtId => {
      if (districtId) {
        this.loadBlocksByDistrict(districtId);
        this.hospitalForm.get('block_id')?.enable();
      } else {
        this.blocks = [];
        this.hospitalForm.get('block_id')?.disable();
        this.hospitalForm.get('block_id')?.setValue('');
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

  loadHospitalData(hospitalId: number): void {
    this.loading = true;
    this.hospitalService.getHospital(hospitalId).subscribe({
      next: (hospital) => {
        this.hospitalForm.patchValue(hospital);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading hospital:', error);
        this.error = 'Failed to load hospital data';
        this.loading = false;
      }
    });
  }

  get f() { return this.hospitalForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = false;

    if (this.hospitalForm.invalid) {
      return;
    }

    this.loading = true;

    const formData = { ...this.hospitalForm.value };

    // Convert numeric values
    formData.district_id = parseInt(formData.district_id) || null;
    formData.block_id = formData.block_id ? parseInt(formData.block_id) : null;
    formData.bed_capacity = parseInt(formData.bed_capacity) || 0;
    formData.operational_beds = parseInt(formData.operational_beds) || 0;
    formData.icu_beds = parseInt(formData.icu_beds) || 0;
    formData.ventilator_beds = parseInt(formData.ventilator_beds) || 0;

    // Handle established_year
    if (formData.established_year) {
      formData.established_year = parseInt(formData.established_year);
    } else {
      formData.established_year = null;
    }

    // Handle empty strings - convert to null
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' || formData[key] === undefined) {
        formData[key] = null;
      }
    });

    // Ensure required fields are not null
    if (!formData.name || !formData.type || !formData.hospital_level || 
        !formData.district_id || !formData.address || !formData.pincode || 
        !formData.contact_number || !formData.emergency_number) {
      this.error = 'Please fill all required fields';
      this.loading = false;
      return;
    }

    console.log('Sending hospital data:', formData);

    if (this.isEditMode && this.hospitalId) {
      // Update existing hospital
      this.hospitalService.updateHospital(this.hospitalId, formData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          
          setTimeout(() => {
            this.router.navigate(['/dashboard/hospitals']);
          }, 2000);
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to update hospital';
          this.loading = false;
        }
      });
    } else {
      // Create new hospital
      this.hospitalService.createHospital(formData).subscribe({
        next: () => {
          this.success = true;
          this.loading = false;
          
          setTimeout(() => {
            this.router.navigate(['/dashboard/hospitals']);
          }, 2000);
        },
        error: (error) => {
          console.error('Hospital creation error:', error);
          this.error = error.error?.message || error.message || 'Failed to create hospital';
          this.loading = false;
        }
      });
    }
  }

  navigateBack(): void {
    this.router.navigate(['/dashboard/hospitals']);
  }

  validateBedCounts(): void {
    const bedCapacity = this.hospitalForm.get('bed_capacity')?.value;
    const operationalBeds = this.hospitalForm.get('operational_beds')?.value;
    
    if (operationalBeds > bedCapacity) {
      this.hospitalForm.get('operational_beds')?.setErrors({ exceedsCapacity: true });
    } else {
      this.hospitalForm.get('operational_beds')?.setErrors(null);
    }
  }
}