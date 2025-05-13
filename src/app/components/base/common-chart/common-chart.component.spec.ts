import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonChartComponent } from './common-chart.component';

describe('CommonChartComponent', () => {
  let component: CommonChartComponent;
  let fixture: ComponentFixture<CommonChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CommonChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
