import { api } from "./api";

import { User } from "@/types";

export const authService = {
  login: async (email: string, password: string) => {
    return api.post("/auth/login", { email, password });
  },

  logout: async () => {
    return api.post("/auth/logout", {});
  },

  register: async (userData: Partial<User>) => {
    return api.post("/auth/register", userData);
  },

  getCurrentUser: async () => {
    return api.get("/auth/me");
  },

  updateProfile: async (userData: Partial<User>) => {
    return api.put("/auth/profile", userData);
  },
};
