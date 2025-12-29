import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { SocketService } from './services/socket.service';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Hospital Referral System';
  isLoggedIn = false;
  userRole = '';

  constructor(
    private router: Router,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check authentication status
    this.isLoggedIn = this.authService.isLoggedIn();
    this.userRole = this.authService.getUserRole();
    
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userRole = user?.role || '';
      
      // Only connect socket if explicitly needed (not on every login)
      // Socket connection will be handled by individual components if needed
    });

    // Handle route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Scroll to top on route change
      window.scrollTo(0, 0);
    });
  }

  logout(): void {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/login']);
  }
}