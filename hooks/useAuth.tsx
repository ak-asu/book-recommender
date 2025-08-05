import { useDispatch, useSelector } from "react-redux";
import { AnyAction } from "@reduxjs/toolkit";

import { RootState } from "@/store";
import {
  login as loginAction,
  logout as logoutAction,
} from "@/store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, loading, error } = useSelector(
    (state: RootState) => state.auth,
  );

  const loginUser = (email: string, password: string) => {
    return dispatch(loginAction({ email, password }) as unknown as AnyAction);
  };

  const logoutUser = () => {
    return dispatch(logoutAction() as unknown as AnyAction);
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login: loginUser,
    logout: logoutUser,
  };
};
