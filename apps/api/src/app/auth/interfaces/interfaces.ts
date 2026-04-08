import { Provider } from '@prisma/client';

export interface OidcContext {
  claims?: {
    sub?: string;
  };
}

export interface OidcIdToken {
  sub?: string;
}

export interface OidcParams {
  id_token?: string;
  sub?: string;
}

export interface OidcProfile {
  id?: string;
  sub?: string;
}

export interface ValidateOAuthLoginParams {
  provider: Provider;
  thirdPartyId: string;
  groups?: string[];
}
