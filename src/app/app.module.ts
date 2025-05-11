import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NavComponent } from './components/navigation/navigation.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { CardComponent } from './components/card/card.component';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MiniCardComponent } from './components/mini-card/mini-card.component';
import { UserComponent } from './components/user/user.component';
import { CourseComponent } from './components/course/course.component';
import { CommonChartComponent } from './components/common-chart/common-chart.component';
import { MatTableModule } from '@angular/material/table';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    NavComponent,
    CardComponent,
    MiniCardComponent,
    UserComponent,
    CourseComponent,
    CommonChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    BaseChartDirective,
    MatTableModule
  ],
  providers: [provideCharts(withDefaultRegisterables()), provideHttpClient(withFetch())],
  bootstrap: [AppComponent]
})
export class AppModule { }
