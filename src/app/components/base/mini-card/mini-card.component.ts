import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-mini-card',
  standalone: false,
  templateUrl: './mini-card.component.html',
  styleUrl: './mini-card.component.css'
})
export class MiniCardComponent {
  @Input() title: string = "";
  @Input() textValue: string = "";
  @Input() icon: string = "";
  @Input() link: string = "";
}
