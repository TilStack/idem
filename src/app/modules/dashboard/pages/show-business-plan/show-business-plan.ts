import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { AuthService } from '../../../auth/services/auth.service';
import { first } from 'rxjs';
import { Loader } from '../../../../components/loader/loader';
import { BusinessPlanService } from '../../services/ai-agents/business-plan.service';
import { CookieService } from '../../../../shared/services/cookie.service';
import { BusinessPlanDisplayComponent } from './components/business-plan-display/business-plan-display';
import { BusinessPlanGenerationComponent } from './components/business-plan-generation/business-plan-generation';

@Component({
  selector: 'app-show-business-plan',
  standalone: true,
  imports: [Loader, BusinessPlanDisplayComponent, BusinessPlanGenerationComponent],
  templateUrl: './show-business-plan.html',
  styleUrls: ['./show-business-plan.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowBusinessPlan {
  businessPlanService = inject(BusinessPlanService);
  isBusinessplanLoaded = signal(true);
  currentUser?: User | null;
  auth = inject(AuthService);
  user$ = this.auth.user$;
  cookiesService = inject(CookieService);
  protected readonly projectIdFromCookie = signal<string | null>(null);
  isBusinessplanExists = signal(false);
  businessPlan: any = null;

  constructor() {
    this.projectIdFromCookie.set(this.cookiesService.get('projectId'));
  }

  ngOnInit() {
    try {
      this.isBusinessplanLoaded.set(true);

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
        this.businessPlanService
          .getBusinessplanItems(this.projectIdFromCookie()!)
          .subscribe({
            next: (businessPlans) => {
              if (businessPlans && businessPlans.sections.length > 0) {
                // Get the most recent business plan
                this.businessPlan = businessPlans;
                if (
                  this.businessPlan.sections &&
                  this.businessPlan.sections.length > 0
                ) {
                  this.isBusinessplanExists.set(true);
                } else {
                  this.isBusinessplanExists.set(false);
                }
              } else {
                this.businessPlan = null;
                this.isBusinessplanExists.set(false);
              }
              this.isBusinessplanLoaded.set(false);
            },
            error: (err) => {
              console.error(
                `Error fetching business plan for project ID: ${this.projectIdFromCookie()}:`,
                err
              );
              this.businessPlan = null;
              this.isBusinessplanLoaded.set(false);
              this.isBusinessplanExists.set(false);
            },
          });
      }
    } catch (error) {
      console.error(
        "Erreur lors du chargement du projet ou de l'utilisateur",
        error
      );
    }
  }



  protected onBusinessPlanGenerated(businessPlanData: any): void {
    console.log('Business plan generated:', businessPlanData);
    this.businessPlan = businessPlanData;
    this.isBusinessplanExists.set(true);
    this.isBusinessplanLoaded.set(false);
  }
}
