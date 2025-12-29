import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HomeStatistics } from '../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHomeStatistics(): Observable<any> {
    // Use direct HTTP call without auth headers
    return this.http.get(`${this.apiUrl}/hospitals/dashboard/stats`, {
      headers: { 'skip-auth': 'true' }
    });
  }
}