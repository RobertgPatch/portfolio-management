import { SettingsStorageService } from '@ghostfolio/client/services/settings-storage.service';

import { Injectable } from '@angular/core';
import { EMPTY, of } from 'rxjs';

/**
 * Stub WebAuthn service – WebAuthn authentication has been replaced by
 * Authentik OIDC.  The service is kept as a no-op so that existing
 * injection sites (UserService, UserAccountSettings, etc.) continue to
 * compile without changes.
 */
@Injectable({
  providedIn: 'root'
})
export class WebAuthnService {
  private static readonly WEB_AUTH_N_DEVICE_ID = 'WEB_AUTH_N_DEVICE_ID';

  public constructor(
    private settingsStorageService: SettingsStorageService
  ) {}

  public isSupported() {
    return false;
  }

  public isEnabled() {
    return false;
  }

  public register() {
    return EMPTY;
  }

  public deregister() {
    this.settingsStorageService.removeSetting(
      WebAuthnService.WEB_AUTH_N_DEVICE_ID
    );
    return of(null);
  }

  public login() {
    return EMPTY;
  }
}
