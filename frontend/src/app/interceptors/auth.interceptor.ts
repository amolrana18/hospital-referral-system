import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if request has skip-auth header
    const skipAuth = request.headers.has('skip-auth');
    
    // Remove the skip-auth header before sending
    if (skipAuth) {
      request = request.clone({
        headers: request.headers.delete('skip-auth')
      });
    }

    const token = this.authService.getToken();
    
    // Only add auth header if not skipping auth and token exists
    if (token && !skipAuth) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !skipAuth) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        
        const errorMessage = error.error?.message || error.statusText;
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}