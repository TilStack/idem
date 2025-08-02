import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { first } from 'rxjs';
import { Loader } from '../../../../components/loader/loader';
import { BrandingService } from '../../services/ai-agents/branding.service';
import { BrandIdentityModel } from '../../models/brand-identity.model';
import { CookieService } from '../../../../shared/services/cookie.service';
import { BrandingDisplayComponent } from './components/branding-display/branding-display';
import { BrandingGenerationComponent } from './components/branding-generation/branding-generation';

@Component({
  selector: 'app-show-branding',
  standalone: true,
  imports: [Loader, BrandingDisplayComponent, BrandingGenerationComponent],
  templateUrl: './show-branding.html',
  styleUrl: './show-branding.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowBrandingComponent {
  route = inject(ActivatedRoute);
  brandingService = inject(BrandingService);
  isBrandingLoaded = signal(true);
  currentUser?: User | null;
  auth = inject(AuthService);
  user$ = this.auth.user$;
  branding: BrandIdentityModel | null = null;
  isBrandExists = signal(false);
  cookiesService = inject(CookieService);
  protected readonly globalCss = signal<string>('');
  constructor() {
    this.projectIdFromCookie.set(this.cookiesService.get('projectId'));
  }
  protected readonly projectIdFromCookie = signal<string | null>(null);
  ngOnInit() {
    try {
      this.isBrandingLoaded.set(true);

      this.auth.user$.pipe(first()).subscribe((user) => {
        if (user) {
          this.currentUser = user;
        } else {
          console.log('Utilisateur non connecté');
          return;
        }
      });

      if (this.projectIdFromCookie() == null) {
        console.log('ID du projet introuvable');
        return;
      } else {
        this.brandingService
          .getBrandIdentityModelById(this.projectIdFromCookie()!)
          .subscribe({
            next: (brandModelData) => {
              if (
                brandModelData.sections &&
                brandModelData.sections.length > 0
              ) {
                this.branding = brandModelData;


                
                this.isBrandingLoaded.set(false);
              } else {
                this.isBrandExists.set(false);
                this.isBrandingLoaded.set(false);
              }
            },
            error: (err) => {
              console.error(
                `Error fetching branding information for project ID: ${this.projectIdFromCookie()}:`,
                err
              );
              this.branding = null;
              this.isBrandingLoaded.set(false);
              this.isBrandExists.set(false);
            },
          });
      }
    } catch (error) {
      console.error(
        'Erreur lors du chargement du projet ou de l’utilisateur',
        error
      );
    }
  }



  protected onBrandingGenerated(brandingData: BrandIdentityModel): void {
    console.log('Branding generated:', brandingData);
    this.branding = brandingData;
    this.isBrandExists.set(true);
    this.isBrandingLoaded.set(false);
  }
}
