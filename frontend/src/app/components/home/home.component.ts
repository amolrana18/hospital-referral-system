import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { StatItem } from '../../models/statistics.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  isLoggedIn = false;
  statistics: StatItem[] = [];
  isLoading = true;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.setDefaultStatistics();
  }
  // Add this method to your home.component.ts
navigateToContact(): void {
  // You can implement navigation to contact page
  // For now, let's show a contact modal or alert
  alert('Contact Support:\nPhone: 1800-XXX-XXXX\nEmail: support@medilink.uk.gov.in\nWhatsApp: +91-XXXXXXXXXX');
  
  // Or navigate to contact page if you have one
  // this.router.navigate(['/contact']);
}
showFaq: boolean = true;

toggleFaq(): void {
  this.showFaq = !this.showFaq;
}


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.animateCounters();
      this.initScrollAnimations();
    }, 500);
  }

  navigateToLogin(userType?: string): void {
    if (userType) {
      this.router.navigate(['/login'], { queryParams: { type: userType } });
    } else {
      this.router.navigate(['/login']);
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  private setDefaultStatistics(): void {
    this.statistics = [
      {
        icon: '🏥',
        value: 10,
        label: 'Hospitals Connected',
        progressWidth: '85%'
      },
      {
        icon: '👥',
        value: 18,
        label: 'Patients Served',
        progressWidth: '92%'
      },
      {
        icon: '🚑',
        value: 3,
        label: 'Successful Referrals',
        progressWidth: '78%'
      },
      {
        icon: '⚡',
        value: 99.9,
        label: 'Uptime Percentage',
        progressWidth: '99%'
      }
    ];
    this.isLoading = false;
  }

  private animateCounters(): void {
    const counters = document.querySelectorAll('.counter');
    const speed = 200;

    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target')!;
      const increment = target / speed;

      const updateCount = () => {
        const count = +counter.innerHTML;
        if (count < target) {
          counter.innerHTML = Math.ceil(count + increment).toString();
          setTimeout(updateCount, 1);
        } else {
          counter.innerHTML = target.toString();
        }
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCount();
            observer.unobserve(entry.target);
          }
        });
      });

      observer.observe(counter);
    });
  }

  private initScrollAnimations(): void {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in', 'visible');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      observer.observe(section);
    });
  }
}