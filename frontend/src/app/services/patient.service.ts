import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Patient, PatientVisit } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAllPatients(): Observable<Patient[]> {
    return this.http.get<any>(`${this.apiUrl}/patients`)
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to get patients');
        })
      );
  }

  createPatient(patientData: any): Observable<Patient> {
    return this.http.post<any>(`${this.apiUrl}/patients`, patientData)
      .pipe(
        map(response => {
          if (response.success) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to create patient');
        })
      );
  }

  getPatient(id: number): Observable<Patient> {
    return this.http.get<any>(`${this.apiUrl}/patients/${id}`)
      .pipe(map(response => response.data));
  }

  searchPatients(query: string): Observable<Patient[]> {
    return this.http.get<any>(`${this.apiUrl}/patients/search?q=${query}`)
      .pipe(map(response => response.data));
  }

  createPatientVisit(patientId: number, visitData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/patients/${patientId}/visits`, visitData);
  }

  getPatientVisits(patientId: number): Observable<PatientVisit[]> {
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/visits`)
      .pipe(map(response => response.data));
  }
}