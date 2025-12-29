import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  constructor(private authService: AuthService) {
    // Initialize socket when service is created
    this.initializeSocket();
  }

  private initializeSocket(): void {
    if (this.authService.isLoggedIn()) {
      this.connect();
    }
  }

  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected = true;
      
      // Join hospital room if user is logged in
      const user = this.authService.currentUserValue;
      if (user?.hospital_id) {
        this.joinHospitalRoom(user.hospital_id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  connect(): void {
    if (!this.socket) {
      console.log('Initializing socket connection...');
      this.socket = io(environment.socketUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true
      });
      this.setupSocketEvents();
    }
    
    if (!this.connected && this.socket.disconnected) {
      console.log('Reconnecting socket...');
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  joinHospitalRoom(hospitalId: number): void {
    if (this.socket && this.connected) {
      this.socket.emit('join:hospital', hospitalId);
      console.log('Joined hospital room:', hospitalId);
    }
  }

  joinReferralRoom(referralId: number): void {
    if (this.socket && this.connected) {
      this.socket.emit('join:referral', referralId);
      console.log('Joined referral room:', referralId);
    }
  }

  // Listen for events
  onReferralAlert(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('referral:alert', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onReferralCreated(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('referral:created', (data) => {
          console.log('Referral created event received:', data);
          observer.next(data);
        });
      }
    });
  }

  onReferralStatusUpdate(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('referral:status', (data) => {
          console.log('Referral status update received:', data);
          observer.next(data);
        });
      }
    });
  }

  onBedUpdate(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('bed:updated', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onHospitalUpdate(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('hospital:updated', (data) => {
          observer.next(data);
        });
      }
    });
  }

  onTreatmentUpdate(): Observable<any> {
    return new Observable(observer => {
      if (this.socket) {
        this.socket.on('referral:update', (data) => {
          observer.next(data);
        });
      }
    });
  }

  // Remove listeners
  removeListener(event: string): void {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }
}