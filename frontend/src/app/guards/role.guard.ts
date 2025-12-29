import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if route is restricted by role
    const requiredRole = route.data['role'];
    const requiredRoles = route.data['roles'] as Array<string>;
    
    if (requiredRole && currentUser.role !== requiredRole) {
      // Role not authorized
      this.router.navigate(['/dashboard']);
      return false;
    }

    if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
      // Role not in allowed roles
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}