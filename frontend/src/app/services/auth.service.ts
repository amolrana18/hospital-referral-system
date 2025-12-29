import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(localStorage.getItem('currentUser') || 'null')
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (response.success && response.token) {
            const user = response.user;
            user.token = response.token;
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('token', response.token);
            this.currentUserSubject.next(user);
            return user;
          }
          throw new Error('Login failed');
        })
      );
  }

  register(userData: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`)
      .pipe(
        map(response => {
          if (response.success) {
            const user = response.user;
            // Update the current user in localStorage and BehaviorSubject
            const updatedUser = {
              ...this.currentUserValue,
              ...user,
              hospitalName: user.hospitalName || user.hospital_name
            };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
            return updatedUser;
          }
          throw new Error('Failed to get profile');
        })
      );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/profile`, profileData);
  }

  changePassword(passwordData: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/auth/change-password`, passwordData);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue && !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUserRole(): string {
    return this.currentUserValue?.role || '';
  }

  getHospitalId(): number | undefined {
    return this.currentUserValue?.hospital_id;
  }

  getUserId(): number | undefined {
    return this.currentUserValue?.id;
  }
}