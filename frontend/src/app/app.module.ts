import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';

// App Components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { TestRegisterComponent } from './test-register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
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
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';

// Services
import { AuthService } from './services/auth.service';
import { HospitalService } from './services/hospital.service';
import { ReferralService } from './services/referral.service';
import { PatientService } from './services/patient.service';
import { SocketService } from './services/socket.service';
import { RealtimeService } from './services/realtime.service';
import { StatisticsService } from './services/statistics.service';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    TestRegisterComponent,
    DashboardComponent,
    NavbarComponent,
    SidebarComponent,
    SuperAdminDashboardComponent,
    HospitalAdminDashboardComponent,
    DoctorDashboardComponent,
    HospitalListComponent,
    HospitalFormComponent,
    HospitalStaffComponent,
    UpdateBedStatusComponent,
    ReferralListComponent,
    ReferralFormComponent,
    ReferralDetailComponent,
    ReferralStatsComponent,
    PatientFormComponent,
    PatientSearchComponent,
    BedStatusComponent,
    AmbulanceStatusComponent,
    RealTimeUpdatesComponent,
    ProfileComponent,
    ConfirmDialogComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    
    // Angular Material
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule
  ],
  providers: [
    AuthService,
    HospitalService,
    ReferralService,
    PatientService,
    SocketService,
    RealtimeService,
    StatisticsService,
    AuthGuard,
    RoleGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }