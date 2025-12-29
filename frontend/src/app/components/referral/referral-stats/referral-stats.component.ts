import { Component, OnInit } from '@angular/core';
import { ReferralService } from '../../../services/referral.service';
import { ReferralStats } from '../../../models';

@Component({
  selector: 'app-referral-stats',
  templateUrl: './referral-stats.component.html',
  styleUrls: ['./referral-stats.component.css']
})
export class ReferralStatsComponent implements OnInit {
  loading = true;
  stats: ReferralStats = {
    total: 0,
    submitted: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    emergency: 0,
    critical: 0
  };

  constructor(private referralService: ReferralService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.referralService.getReferralStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loading = false;
      }
    });
  }
}