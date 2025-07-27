import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink],
  templateUrl: './empty-layout.html',
  styleUrl: './empty-layout.scss',
})
export class EmptyLayout {}
