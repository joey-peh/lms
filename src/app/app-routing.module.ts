import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavComponent } from './components/navigation/navigation.component';

const routes: Routes = [
  {
    path: 'home',
    component: NavComponent,
    children: [
      { path: '', component: DashboardComponent }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'login'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
