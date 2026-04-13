import ms from 'ms';

/**
 * Custom state store for OIDC authentication that doesn't rely on express-session.
 * This store manages OAuth2 state parameters in memory with automatic cleanup.
 */
export class OidcStateStore {
  private readonly STATE_EXPIRY_MS = ms('10 minutes');

  private stateMap = new Map<
    string,
    {
      appState?: unknown;
      ctx: { issued?: Date | string; maxAge?: number; nonce?: string };
      meta?: unknown;
      timestamp: number;
    }
  >();

  /**
   * Store request state.
   * Signature matches passport-openidconnect SessionStore
   */
  public store(
    _req: unknown,
    ctx: { maxAge?: number; nonce?: string; issued?: Date | string },
    appState: unknown,
    meta: unknown,
    callback: (err: Error | null, handle?: string) => void
  ) {
    try {
      // Generate a unique handle for this state
      const handle = this.generateHandle();

      this.stateMap.set(handle, {
        appState,
        ctx,
        meta,
        timestamp: Date.now()
      });

      // Clean up expired states
      this.cleanup();

      callback(null, handle);
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Verify request state.
   * Signature matches passport-openidconnect SessionStore
   */
  public verify(
    _req: unknown,
    handle: string,
    callback: (
      err: Error | null,
      appState?: unknown,
      ctx?: { maxAge?: number; nonce?: string; issued?: Date | string }
    ) => void
  ) {
    try {
      const data = this.stateMap.get(handle);

      if (!data) {
        return callback(null, undefined, undefined);
      }

      if (Date.now() - data.timestamp > this.STATE_EXPIRY_MS) {
        // State has expired
        this.stateMap.delete(handle);
        return callback(null, undefined, undefined);
      }

      // Remove state after verification (one-time use)
      this.stateMap.delete(handle);

      // Capture the nonce so the oauth2-gzip-patch can inject it into
      // synthetic JWTs built from userinfo (for encrypted JWE id_tokens).
      // Uses globalThis to bypass webpack module-scope isolation.
      const NONCE_KEY = '__oidc_pending_nonce';
      if (data.ctx?.nonce) {
        (globalThis as any)[NONCE_KEY] = data.ctx.nonce;
        console.log(
          `[oidc-state] Stored pending nonce on globalThis: ${data.ctx.nonce.substring(0, 8)}...`
        );
      } else {
        console.log(`[oidc-state] No nonce in ctx (keys: ${Object.keys(data.ctx || {}).join(',')})`);
      }

      const normalizedCtx = {
        ...data.ctx,
        issued:
          typeof data.ctx?.issued === 'string'
            ? new Date(data.ctx.issued)
            : data.ctx?.issued
      };

      callback(null, normalizedCtx, data.appState);
    } catch (error) {
      callback(error as Error);
    }
  }

  /**
   * Clean up expired states
   */
  private cleanup() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this.stateMap.entries()) {
      if (now - value.timestamp > this.STATE_EXPIRY_MS) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.stateMap.delete(key);
    }
  }

  /**
   * Generate a cryptographically secure random handle
   */
  private generateHandle() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      Date.now().toString(36)
    );
  }
}
