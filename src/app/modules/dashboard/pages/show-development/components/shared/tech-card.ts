import { Component, Input, Output, EventEmitter, signal, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';

export interface TechCardModel {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  badges: string[];
  versions?: string[];
}

@Component({
  selector: 'app-tech-card',
  standalone: true,
  imports: [CommonModule, FormsModule, DropdownModule, ButtonModule],
  templateUrl: './tech-card.html',
  styleUrl: './tech-card.css'
})
export class TechCardComponent {
  readonly tech = input.required<TechCardModel>();
  readonly selected = input<boolean>();
  readonly selectedVersion = input<string | null>();
  readonly showAdvancedOptions = input<boolean>();

  readonly techSelect = output<string>();
  readonly versionSelect = output<string>();
  
  protected advancedOptionsVisible = signal(false);
  
  protected isAdvancedOptionsVisible = computed(() => this.advancedOptionsVisible());

  protected toggleAdvancedOptions(): void {
    this.advancedOptionsVisible.update(current => !current);
  }

  protected selectTech(): void {
    this.techSelect.emit(this.tech().id);
  }

  protected selectVersion(version: string): void {
    this.versionSelect.emit(version);
  }
}
