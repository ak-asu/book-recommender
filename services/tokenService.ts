import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";

import * as storageService from "./storageService";
import { api } from "./apiService";

import { logError } from "@/lib/errorHandler";

// Token expiry check interval (10 minutes)
const TOKEN_CHECK_INTERVAL = 10 * 60 * 1000;

// Token refresh threshold - refresh when under 15 minutes to expiration
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000;

// Class to handle token lifecycle management
class TokenManager {
  private checkIntervalId: NodeJS.Timeout | null = null;
  private isRefreshing = false;

  // Start background token checking
  public startTokenMonitoring(): void {
    if (typeof window === "undefined") return;
    // Clear any existing interval
    this.stopTokenMonitoring();
    // Set up a new interval
    this.checkIntervalId = setInterval(() => {
      this.checkAndRefreshToken().catch((err) => {
        logError(err, {
          service: "TokenManager",
          operation: "checkAndRefreshToken",
        });
      });
    }, TOKEN_CHECK_INTERVAL);
    // Also check immediately
    this.checkAndRefreshToken().catch((err) => {
      logError(err, { service: "TokenManager", operation: "initialCheck" });
    });
  }

  // Stop background token checking
  public stopTokenMonitoring(): void {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
    }
  }

  // Check token expiration and refresh if needed
  private async checkAndRefreshToken(): Promise<void> {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing) return;
    try {
      this.isRefreshing = true;
      // Get current user and token
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        // No logged in user, no need to refresh
        return;
      }
      // Check if token needs refreshing
      const tokenResult = await currentUser.getIdTokenResult();
      const expirationTime = new Date(tokenResult.expirationTime).getTime();
      const timeToExpire = expirationTime - Date.now();
      // If token is close to expiry, refresh it
      if (timeToExpire < REFRESH_THRESHOLD_MS) {
        try {
          // Try the normal refresh method first
          const newToken = await currentUser.getIdToken(true);
          // Update the stored token
          storageService.saveUserAuth(newToken);
        } catch {
          // If normal refresh fails, try the server-side refresh
          const response = await api.post(
            "/api/auth/refresh",
            {},
            {
              isAuthenticated: true,
            },
          );
          if (response.error) throw response.error;
          // Use the custom token to sign in again
          const customToken = response.data.customToken;
          await signInWithCustomToken(auth, customToken);
          // Get the new ID token and save it
          const newIdToken = await auth.currentUser?.getIdToken();
          if (newIdToken) {
            storageService.saveUserAuth(newIdToken);
          }
        }
      }
    } catch (error) {
      // If all refresh attempts fail, log out the user as a safety measure
      logError(error, {
        service: "TokenManager",
        operation: "checkAndRefreshToken",
        critical: true,
      });
      // Force logout
      try {
        await signOut(getAuth());
        storageService.clearUserAuth();
        window.location.href = "/login?reason=session_expired";
      } catch {}
    } finally {
      this.isRefreshing = false;
    }
  }

  // Force an immediate token refresh
  public async forceRefresh(): Promise<string | null> {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      const newToken = await currentUser.getIdToken(true);
      storageService.saveUserAuth(newToken);
      return newToken;
    } catch (error) {
      logError(error, { service: "TokenManager", operation: "forceRefresh" });
      return null;
    }
  }
}

// Export a singleton instance
export const tokenManager = new TokenManager();
