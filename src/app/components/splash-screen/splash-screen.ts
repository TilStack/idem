import {
  Component,
  OnInit,
  inject,
  signal,
  ElementRef,
  AfterViewInit,
  Renderer2,
  ApplicationRef,
  PLATFORM_ID,
  DestroyRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, NavigationStart } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './splash-screen.html',
  styleUrl: './splash-screen.css',
})
export class SplashScreenComponent implements OnInit, AfterViewInit {
  protected readonly router = inject(Router);
  protected readonly elementRef = inject(ElementRef);
  protected readonly renderer = inject(Renderer2);
  protected readonly appRef = inject(ApplicationRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);

  // Track loading progress
  protected readonly progress = signal(0);
  protected readonly animationComplete = signal(false);

  ngOnInit(): void {
    // Set initial loading state
    this.progress.set(0);

    // Listen for resource load events only in browser context
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('load', () => {
        this.progress.set(100);
        setTimeout(() => {
          this.animationComplete.set(true);
          setTimeout(() => {
            this.loading.set(false);
          }, 300);
        }, 500);
      });
    } else {
      // In SSR context, set progress to complete immediately
      this.progress.set(100);
      this.animationComplete.set(true);
      this.loading.set(false);
    }
  }

  ngAfterViewInit(): void {
    // Skip loading animation in SSR context
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    
    // Use Angular's ApplicationRef to detect when the app is stable
    // This is more Angular-idiomatic than using direct DOM queries

    // Track resources loading
    const totalResources = 20; // Estimate of total resources to load
    let resourcesLoaded = 0;

    // Update progress function without triggering manual change detection
    const updateProgress = () => {
      resourcesLoaded++;
      const percentage = Math.min(
        Math.floor((resourcesLoaded / totalResources) * 100),
        95
      );
      this.progress.set(percentage);
      // Removed this.appRef.tick() to avoid recursive calls
    };

    // Use renderer to listen to page load events
    const document = this.elementRef.nativeElement.ownerDocument;
    this.renderer.listen(document, 'DOMContentLoaded', () => {
      updateProgress();
    });

    // Register for style loading completion
    this.appRef.isStable.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((isStable) => {
      if (isStable) {
        // Application is stable, meaning most resources are loaded
        setTimeout(() => {
          this.progress.set(100);
          // Removed appRef.tick call

          setTimeout(() => {
            this.animationComplete.set(true);
            // Removed appRef.tick call

            setTimeout(() => {
              this.loading.set(false);
              // Removed appRef.tick call
            }, 300);
          }, 500);
        }, 300);
      } else {
        // Each time stability changes, update progress
        updateProgress();
      }
    });

    // Simulate gradual progress while waiting for full stability
    // Only run this in browser context
    let progressInterval: number | undefined;
    if (isPlatformBrowser(this.platformId)) {
      progressInterval = window.setInterval(() => {
        if (this.progress() < 90) {
          this.progress.update((value) => Math.min(value + 5, 90));
        } else {
          clearInterval(progressInterval);
        }
      }, 300);
    }

    // Clean up interval after a reasonable timeout
    if (isPlatformBrowser(this.platformId) && progressInterval !== undefined) {
      setTimeout(() => {
        clearInterval(progressInterval);
      }, 10000);
    }

    // Complete loading when navigation finishes (fallback)
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.progress() < 100) {
          setTimeout(() => {
            this.progress.set(100);
            setTimeout(() => {
              this.animationComplete.set(true);
              setTimeout(() => {
                this.loading.set(false);
              }, 300);
            }, 500);
          }, 800);
        }
      });
  }
}
