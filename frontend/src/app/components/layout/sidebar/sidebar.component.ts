import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface MenuItem {
  title: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  roles: string[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userRole = '';
  menuItems: MenuItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    this.userRole = currentUser?.role || '';

    this.initializeMenu();
  }

  initializeMenu(): void {
    // Common menu items for all roles
    const commonMenu: MenuItem[] = [
      {
        title: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        route: '/dashboard',
        roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']
      }
    ];

    // Super Admin specific menu
    const superAdminMenu: MenuItem[] = [
      {
        title: 'Hospital Management',
        icon: 'fas fa-hospital',
        children: [
          {
            title: 'All Hospitals',
            icon: 'fas fa-list',
            route: '/dashboard/hospitals',
            roles: ['Super Admin']
          },
          {
            title: 'Add New Hospital',
            icon: 'fas fa-plus-circle',
            route: '/dashboard/hospitals/new',
            roles: ['Super Admin']
          }
        ],
        roles: ['Super Admin']
      },
      {
        title: 'Real-time Monitoring',
        icon: 'fas fa-chart-line',
        route: '/dashboard/super-admin',
        roles: ['Super Admin']
      }
    ];

    // Hospital Admin specific menu
    const hospitalAdminMenu: MenuItem[] = [
      {
        title: 'Hospital Management',
        icon: 'fas fa-hospital',
        children: [
          {
            title: 'Hospital Staff',
            icon: 'fas fa-user-md',
            route: '/dashboard/hospitals/staff',
            roles: ['Hospital Admin']
          },
          {
            title: 'Update Bed Status',
            icon: 'fas fa-bed',
            route: '/dashboard/beds/update',
            roles: ['Hospital Admin']
          }
        ],
        roles: ['Hospital Admin']
      },
      {
        title: 'Referral Management',
        icon: 'fas fa-ambulance',
        route: '/dashboard/referrals',
        roles: ['Hospital Admin']
      }
    ];

    // Doctor specific menu
    const doctorMenu: MenuItem[] = [
      {
        title: 'Patient Management',
        icon: 'fas fa-user-injured',
        children: [
          {
            title: 'New Patient',
            icon: 'fas fa-user-plus',
            route: '/dashboard/patients/new',
            roles: ['Doctor', 'Nurse']
          },
          {
            title: 'Search Patient',
            icon: 'fas fa-search',
            route: '/dashboard/patients/search',
            roles: ['Doctor', 'Nurse']
          }
        ],
        roles: ['Doctor', 'Nurse']
      },
      {
        title: 'Referral Management',
        icon: 'fas fa-ambulance',
        children: [
          {
            title: 'New Referral',
            icon: 'fas fa-plus',
            route: '/dashboard/referrals/new',
            roles: ['Doctor', 'Nurse']
          },
          {
            title: 'My Referrals',
            icon: 'fas fa-list',
            route: '/dashboard/referrals',
            roles: ['Doctor', 'Nurse']
          }
        ],
        roles: ['Doctor', 'Nurse']
      }
    ];

    // Combine menus based on role
    this.menuItems = [...commonMenu];

    if (this.userRole === 'Super Admin') {
      this.menuItems = [...this.menuItems, ...superAdminMenu];
    } else if (this.userRole === 'Hospital Admin') {
      this.menuItems = [...this.menuItems, ...hospitalAdminMenu];
    } else if (this.userRole === 'Doctor' || this.userRole === 'Nurse') {
      this.menuItems = [...this.menuItems, ...doctorMenu];
    }

    // Add common items for all logged in users
    this.menuItems.push(
      {
        title: 'Real-time Status',
        icon: 'fas fa-clock',
        children: [
          {
            title: 'Bed Status',
            icon: 'fas fa-bed',
            route: '/dashboard/realtime/beds',
            roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']
          },
          {
            title: 'Ambulance Status',
            icon: 'fas fa-ambulance',
            route: '/dashboard/realtime/ambulances',
            roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']
          }
        ],
        roles: ['Super Admin', 'Hospital Admin', 'Doctor', 'Nurse']
      },
      {
        title: 'Analytics',
        icon: 'fas fa-chart-bar',
        route: '/dashboard/referrals/stats',
        roles: ['Super Admin', 'Hospital Admin', 'Doctor']
      }
    );
  }

  toggleSubMenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  hasAccess(item: MenuItem): boolean {
    return item.roles.includes(this.userRole);
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}