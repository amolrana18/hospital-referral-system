import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BedStatus, Ambulance } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHospitalResources(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/realtime/hospital-resources`)
      .pipe(map(response => response.data));
  }

  getBedStatus(): Observable<BedStatus[]> {
    return this.http.get<any>(`${this.apiUrl}/realtime/bed-status`)
      .pipe(map(response => response.data));
  }

  getAmbulanceStatus(): Observable<Ambulance[]> {
    return this.http.get<any>(`${this.apiUrl}/realtime/ambulance-status`)
      .pipe(map(response => response.data));
  }

  getReferralUpdates(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/realtime/referral-updates`)
      .pipe(map(response => response.data));
  }
}