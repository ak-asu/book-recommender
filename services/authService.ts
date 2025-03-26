import { userApi } from "./apiService";
import * as storageService from "./storageService";
import { withErrorHandling } from "./errorService";
import { tokenManager } from "./tokenService";

import { User, UserPreferences } from "@/types/user";
import { DEFAULT_VALUES } from "@/lib/constants";
import { ErrorCategory } from "@/lib/errorHandler";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegistrationData extends LoginCredentials {
  displayName: string;
}

export const registerUser = withErrorHandling(
  async (data: RegistrationData): Promise<User> => {
    return await userApi.register(data);
  },
  ErrorCategory.AUTH,
);

export const loginUser = withErrorHandling(
  async (credentials: LoginCredentials): Promise<User> => {
    const userData = await userApi.login(credentials);
    // Start token monitoring after successful login
    tokenManager.startTokenMonitoring();
    return userData;
  },
  ErrorCategory.AUTH,
);

export const logoutUser = withErrorHandling(async (): Promise<void> => {
  // Stop token monitoring when logging out
  tokenManager.stopTokenMonitoring();
  // Clear stored auth data
  storageService.clearUserAuth();
}, ErrorCategory.AUTH);

export const resetPassword = withErrorHandling(
  async (email: string): Promise<void> => {
    await userApi.resetPassword(email);
  },
  ErrorCategory.AUTH,
);

export const updateUserProfile = withErrorHandling(
  async (
    displayName: string | undefined,
    photoURL: string | undefined,
  ): Promise<User> => {
    const updateData: { displayName?: string; photoURL?: string } = {};
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    if (photoURL !== undefined) {
      updateData.photoURL = photoURL;
    }
    // Don't make API call if no data to update
    if (Object.keys(updateData).length === 0) {
      throw new Error("No profile data provided for update");
    }
    return await userApi.updateProfile(updateData);
  },
  ErrorCategory.USER,
);

export const getUserPreferences = withErrorHandling(
  async (): Promise<UserPreferences> => {
    try {
      return await userApi.getPreferences();
    } catch {
      return DEFAULT_VALUES.USER_PREFERENCES;
    }
  },
  ErrorCategory.USER,
);

export const updateUserPreferences = withErrorHandling(
  async (preferences: Partial<UserPreferences>): Promise<UserPreferences> => {
    return await userApi.updatePreferences(preferences);
  },
  ErrorCategory.USER,
);

export const checkAuthStatus = (): boolean => {
  const token = storageService.getUserAuth();
  return !!token;
};

export const handleAuthError = async (error: any): Promise<boolean> => {
  // Check if this is a token expiration error
  if (
    error?.code === "auth/id-token-expired" ||
    error?.message?.includes("token expired") ||
    error?.message?.includes("invalid token")
  ) {
    // Try to refresh the token
    const newToken = await tokenManager.forceRefresh();
    return !!newToken; // Return true if refresh succeeded
  }
  return false; // Other auth errors can't be automatically handled
};
