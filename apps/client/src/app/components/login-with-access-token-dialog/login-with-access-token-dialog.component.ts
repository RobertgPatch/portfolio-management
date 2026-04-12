import { GfDialogHeaderComponent } from '@ghostfolio/ui/dialog-header';

import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { LoginWithAccessTokenDialogParams } from './interfaces/interfaces';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    GfDialogHeaderComponent,
    MatButtonModule,
    MatDialogModule
  ],
  selector: 'gf-login-with-access-token-dialog',
  styleUrls: ['./login-with-access-token-dialog.scss'],
  templateUrl: './login-with-access-token-dialog.html'
})
export class GfLoginWithAccessTokenDialogComponent {
  public constructor(
    @Inject(MAT_DIALOG_DATA) public data: LoginWithAccessTokenDialogParams,
    public dialogRef: MatDialogRef<GfLoginWithAccessTokenDialogComponent>
  ) {}

  public onClose() {
    this.dialogRef.close();
  }
}
