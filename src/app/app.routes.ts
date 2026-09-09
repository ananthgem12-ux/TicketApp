import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
  {
    path: 'passes',
    loadComponent: () => import('./pages/passes/passes.page').then(m => m.PassesPage)
  },
  {
    path: 'live',
    loadComponent: () => import('./pages/live/live.page').then(m => m.LivePage)
  },
  {
    path: 'ticket',
    loadComponent: () => import('./pages/ticket/ticket.page').then(m => m.TicketPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'booking',
    loadComponent: () => import('./pages/booking/booking.page').then(m => m.BookingPage)
  },
  {
    path: 'ticket-generation',
    loadComponent: () => import('./pages/ticket-generation/ticket-generation.page').then(m => m.TicketGenerationPage)
  },
  {
    path: 'bus-ticket',
    loadComponent: () => import('./pages/bus-ticket/bus-ticket.page').then(m => m.BusTicketPage)
  },
  {
    path: 'bus-otp',
    loadComponent: () => import('./pages/bus-otp/bus-otp.page').then(m => m.BusOtpPage)
  },
  {
    path: 'temp-home',
    loadComponent: () => import('./pages/temp-home/temp-home.page').then(m => m.TempHomePage)
  },
  {
    path: 'commuter-proxy/**',
    redirectTo: 'home'
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];