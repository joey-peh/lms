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
import { CardComponent } from './components/base/card/card.component';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { MiniCardComponent } from './components/base/mini-card/mini-card.component';
import { UserComponent } from './components/user/user.component';
import { CommonChartComponent } from './components/base/common-chart/common-chart.component';
import { MatTableModule } from '@angular/material/table';
import { DatePipe } from '@angular/common';
import { DiscussionsComponent } from './components/discussions/discussions.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from './components/base/confirm-dialog/confirm-dialog.component';
import { MatSortModule } from '@angular/material/sort';
import { CommonTableComponent } from './components/base/common-table/common-table.component';
import { StoreModule } from '@ngrx/store';
import { LmsEffects } from './store/effects/lms.effects';
import { lmsReducer } from './store/reducers/lms.reducer';
import { EffectsModule } from '@ngrx/effects';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    NavComponent,
    CardComponent,
    MiniCardComponent,
    UserComponent,
    CommonChartComponent,
    DiscussionsComponent,
    ConfirmDialogComponent,
    CommonTableComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    StoreModule.forRoot({ lms: lmsReducer }),
    EffectsModule.forRoot([LmsEffects]),
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
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSortModule,
  ],
  providers: [
    provideCharts(withDefaultRegisterables()),
    provideHttpClient(withFetch()),
    DatePipe,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
