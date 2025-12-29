import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Referral, TreatmentUpdate, ReferralStats } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReferralService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createReferral(referralData: any): Observable<Referral> {
    console.log('Creating referral with data:', referralData);
    return this.http.post<any>(`${this.apiUrl}/referrals`, referralData)
      .pipe(
        map(response => {
          console.log('Referral service response:', response);
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to create referral');
        })
      );
  }

  getReferrals(): Observable<Referral[]> {
    return this.http.get<any>(`${this.apiUrl}/referrals`)
      .pipe(map(response => response.data));
  }

  getReferral(id: number): Observable<Referral> {
    return this.http.get<any>(`${this.apiUrl}/referrals/${id}`)
      .pipe(map(response => response.data));
  }

  updateReferralStatus(id: number, statusData: any): Observable<Referral> {
    return this.http.put<any>(`${this.apiUrl}/referrals/${id}/status`, statusData)
      .pipe(map(response => response.data));
  }

  addTreatmentUpdate(referralId: number, updateData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/referrals/${referralId}/updates`, updateData);
  }

  getReferralStats(): Observable<ReferralStats> {
    return this.http.get<any>(`${this.apiUrl}/referrals/stats`)
      .pipe(map(response => response.data));
  }

  getReferralTimeline(referralId: number): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/referrals/${referralId}/timeline`)
      .pipe(map(response => response.data));
  }

  // Get dashboard data for super admin
  getSuperAdminDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/super-admin`)
      .pipe(map(response => response.data));
  }
}