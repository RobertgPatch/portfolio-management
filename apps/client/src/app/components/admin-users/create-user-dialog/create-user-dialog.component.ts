import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { CreateUserDialogResult } from './interfaces/interfaces';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  selector: 'gf-create-user-dialog',
  styleUrls: ['./create-user-dialog.scss'],
  templateUrl: './create-user-dialog.html'
})
export class GfCreateUserDialogComponent {
  public form = new FormGroup({
    thirdPartyId: new FormControl('', Validators.required),
    role: new FormControl('USER')
  });

  public roles = ['USER', 'ADMIN', 'DEMO'];

  public constructor(
    public dialogRef: MatDialogRef<GfCreateUserDialogComponent>
  ) {}

  public onCancel() {
    this.dialogRef.close();
  }

  public onSubmit() {
    if (this.form.valid) {
      this.dialogRef.close({
        thirdPartyId: this.form.value.thirdPartyId,
        role: this.form.value.role
      } as CreateUserDialogResult);
    }
  }
}
