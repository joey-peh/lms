import { inject, OnInit, OnDestroy, Directive } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { LmsSandboxService } from '../../store/sandbox/lms-sandbox-service';
import { LoginUser } from '../../models/lms-models';

@Directive()
export abstract class BaseUserComponent implements OnInit, OnDestroy {
  protected sandbox = inject(LmsSandboxService);
  protected dialog = inject(MatDialog);

  protected user!: LoginUser;
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.sandbox.getCurrentUser().subscribe((user) => {
      if (user != null) this.user = user;
    });
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
