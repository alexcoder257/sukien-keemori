"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  completeOAuthLogin,
  forgotPassword,
  getMe,
  login,
  logout,
  deleteAccount,
  register,
  resetPassword,
  updateProfile,
  type AuthUser,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from "@/apis";
import type { Locale } from "@/i18n/config";
import { notificationQueryKeys } from "./use-notification";

export const authQueryKeys = {
  all: ["auth"] as const,
  me: () => [...authQueryKeys.all, "me"] as const,
};

export function useCurrentUserQuery(enabled = true) {
  return useQuery({
    queryKey: authQueryKeys.me(),
    queryFn: getMe,
    retry: false,
    enabled,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authQueryKeys.me(), user);
      queryClient.removeQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Bước cuối của luồng OAuth: đổi cặp token trên URL lấy phiên đăng nhập.
 * Dọn cache giống `useLoginMutation` vì đây cũng là một lần đổi tài khoản.
 */
export function useOAuthLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ accessToken, refreshToken }: OAuthTokens) =>
      completeOAuthLogin(accessToken, refreshToken),
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authQueryKeys.me(), user);
      queryClient.removeQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authQueryKeys.me(), user);
    },
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: (user) => {
      queryClient.setQueryData<AuthUser>(authQueryKeys.me(), user);
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      // Tài khoản không còn — mọi cache đều là dữ liệu của người đã xoá.
      queryClient.clear();
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: authQueryKeys.all });
      queryClient.removeQueries({ queryKey: notificationQueryKeys.all });
    },
  });
}

interface ForgotPasswordInput {
  email: string;
  locale: Locale;
  captchaToken?: string;
  isResend?: boolean;
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: ({
      email,
      locale,
      captchaToken,
      isResend,
    }: ForgotPasswordInput) =>
      forgotPassword(email, locale, captchaToken, isResend),
  });
}

interface ResetPasswordInput {
  token: string;
  password: string;
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: ({ token, password }: ResetPasswordInput) =>
      resetPassword(token, password),
  });
}
