import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Hospital, District, Block, BedUpdate, Staff } from '../models';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<any>(`${this.apiUrl}/hospitals`)
      .pipe(map(response => response.data));
  }

  getHospital(id: number): Observable<Hospital> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/${id}`)
      .pipe(map(response => response.data));
  }

  createHospital(hospitalData: any): Observable<Hospital> {
    return this.http.post<any>(`${this.apiUrl}/hospitals`, hospitalData)
      .pipe(map(response => response.data));
  }

  updateHospital(id: number, hospitalData: any): Observable<Hospital> {
    return this.http.put<any>(`${this.apiUrl}/hospitals/${id}`, hospitalData)
      .pipe(map(response => response.data));
  }

  updateBedAvailability(id: number, bedData: BedUpdate): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/hospitals/${id}/beds`, bedData);
  }

  getHospitalResources(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/${id}/resources`)
      .pipe(map(response => response.data));
  }

  getDistricts(): Observable<District[]> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/districts`)
      .pipe(map(response => response.data));
  }

  getBlocksByDistrict(districtId: number): Observable<Block[]> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/districts/${districtId}/blocks`)
      .pipe(map(response => response.data));
  }

  getHospitalStaff(hospitalId: number): Observable<Staff[]> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/${hospitalId}/staff`)
      .pipe(map(response => response.data));
  }

  addStaff(staffData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/hospitals/staff`, staffData)
      .pipe(map(response => response.data));
  }

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/hospitals/dashboard/stats`);
  }
}