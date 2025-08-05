import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  Router,
  ActivatedRoute,
  NavigationEnd,
} from '@angular/router';
import { SplashScreenComponent } from './components/splash-screen/splash-screen';
import { filter, map, startWith, distinctUntilChanged } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout';
import { DashboardLayoutComponent } from './layouts/dashboard-layout/dashboard-layout';
import { EmptyLayout } from "./layouts/empty-layout/empty-layout";
import { NotificationContainerComponent } from './shared/components/notification-container/notification-container';
import { QuotaWarningComponent } from './shared/components/quota-warning/quota-warning';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    PublicLayoutComponent,
    DashboardLayoutComponent,
    CommonModule,
    EmptyLayout,
    SplashScreenComponent,
    NotificationContainerComponent,
    QuotaWarningComponent
],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly router = inject(Router);
  protected readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  /** Layout courant selon la route active */
  protected readonly currentLayout$: Observable<
    'public' | 'dashboard' | 'empty'
  > = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    startWith(null),
    map(() => {
      let route = this.activatedRoute.firstChild;
      while (route?.firstChild) {
        route = route.firstChild;
      }
      return (
        (route?.snapshot.data?.['layout'] as
          | 'public'
          | 'dashboard'
          | 'empty') || 'public'
      );
    }),
    distinctUntilChanged()
  );

  ngOnInit(): void {
    // Écouter les changements de route pour remettre le scroll en haut
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Utiliser setTimeout pour s'assurer que le DOM est mis à jour
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'auto' });
        }, 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected resetPosition() {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  protected readonly title = 'idem';
}
