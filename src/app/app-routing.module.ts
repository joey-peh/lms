import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavComponent } from './components/navigation/navigation.component';
import { LocationStrategy, HashLocationStrategy } from '@angular/common';
import { AuthGuard } from './auth.guard';
import { UserComponent } from './components/user/user.component';
import { CourseComponent } from './components/course/course.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: NavComponent,
    children: [
      {
        path: 'home',
        component: DashboardComponent,
        canActivate: [AuthGuard],
      },      
      {
        path: 'user',
        component: UserComponent,
        canActivate: [AuthGuard],
      },
      {
        path: 'course',
        component: CourseComponent,
        canActivate: [AuthGuard],
      }
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: [
    { provide: LocationStrategy, useClass: HashLocationStrategy }]
})
export class AppRoutingModule { }
