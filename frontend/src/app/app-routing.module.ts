import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { TestRegisterComponent } from './test-register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SuperAdminDashboardComponent } from './components/dashboard/super-admin-dashboard/super-admin-dashboard.component';
import { HospitalAdminDashboardComponent } from './components/dashboard/hospital-admin-dashboard/hospital-admin-dashboard.component';
import { DoctorDashboardComponent } from './components/dashboard/doctor-dashboard/doctor-dashboard.component';
import { HospitalListComponent } from './components/hospital/hospital-list/hospital-list.component';
import { HospitalFormComponent } from './components/hospital/hospital-form/hospital-form.component';
import { HospitalStaffComponent } from './components/hospital/hospital-staff/hospital-staff.component';
import { UpdateBedStatusComponent } from './components/hospital/update-bed-status/update-bed-status.component';
import { ReferralListComponent } from './components/referral/referral-list/referral-list.component';
import { ReferralFormComponent } from './components/referral/referral-form/referral-form.component';
import { ReferralDetailComponent } from './components/referral/referral-detail/referral-detail.component';
import { ReferralStatsComponent } from './components/referral/referral-stats/referral-stats.component';
import { PatientFormComponent } from './components/patient/patient-form/patient-form.component';
import { PatientSearchComponent } from './components/patient/patient-search/patient-search.component';
import { BedStatusComponent } from './components/realtime/bed-status/bed-status.component';
import { AmbulanceStatusComponent } from './components/realtime/ambulance-status/ambulance-status.component';
import { RealTimeUpdatesComponent } from './components/realtime/real-time-updates/real-time-updates.component';
import { ProfileComponent } from './components/profile/profile.component';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      // Super Admin Routes
      { 
        path: 'super-admin', 
        component: SuperAdminDashboardComponent,
        canActivate: [RoleGuard],
        data: { role: 'Super Admin' }
      },
      
      // Hospital Admin Routes
      { 
        path: 'hospital-admin', 
        component: HospitalAdminDashboardComponent,
        canActivate: [RoleGuard],
        data: { role: 'Hospital Admin' }
      },
      
      // Doctor Routes
      { 
        path: 'doctor', 
        component: DoctorDashboardComponent,
        canActivate: [RoleGuard],
        data: { role: 'Doctor' }
      },
      
      // Hospital Management
      { 
        path: 'hospitals', 
        component: HospitalListComponent,
        canActivate: [RoleGuard],
        data: { role: 'Super Admin' }
      },
      { 
        path: 'hospitals/new', 
        component: HospitalFormComponent,
        canActivate: [RoleGuard],
        data: { role: 'Super Admin' }
      },
      { 
        path: 'hospitals/edit/:id', 
        component: HospitalFormComponent,
        canActivate: [RoleGuard],
        data: { role: 'Super Admin' }
      },
      { 
        path: 'hospitals/:id/staff', 
        component: HospitalStaffComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Super Admin', 'Hospital Admin'] }
      },
      { 
        path: 'staff', 
        component: HospitalStaffComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Hospital Admin'] }
      },
      { 
        path: 'beds/update', 
        component: UpdateBedStatusComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Hospital Admin', 'Super Admin'] }
      },
      
      // Referral Management
      { 
        path: 'referrals', 
        component: ReferralListComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'referrals/new', 
        component: ReferralFormComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Doctor', 'Nurse', 'Hospital Admin'] }
      },
      { 
        path: 'referrals/:id', 
        component: ReferralDetailComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'referrals/stats', 
        component: ReferralStatsComponent,
        canActivate: [AuthGuard]
      },
      
      // Patient Management
      { 
        path: 'patients/new', 
        component: PatientFormComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Doctor', 'Nurse', 'Hospital Admin'] }
      },
      { 
        path: 'patients/search', 
        component: PatientSearchComponent,
        canActivate: [RoleGuard],
        data: { roles: ['Doctor', 'Nurse', 'Hospital Admin'] }
      },
      
      // Real-time Monitoring
      { 
        path: 'realtime/beds', 
        component: BedStatusComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'realtime/ambulances', 
        component: AmbulanceStatusComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: 'realtime/updates', 
        component: RealTimeUpdatesComponent,
        canActivate: [AuthGuard]
      },
      
      // Profile
      { 
        path: 'profile', 
        component: ProfileComponent,
        canActivate: [AuthGuard]
      },
      
      // Default redirect based on role - remove specific role requirement
      { path: '', component: DashboardComponent, pathMatch: 'full' }
    ]
  },
  
  // Fallback route
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }