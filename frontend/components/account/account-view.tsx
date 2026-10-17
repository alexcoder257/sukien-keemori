"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ApiError, type AuthUser } from "@/apis";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { PhoneField } from "@/components/shared/phone-field";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  useCurrentUserQuery,
  useDeleteAccountMutation,
  useUpdateProfileMutation,
} from "@/hooks/use-auth";
import { useAccountStatsQuery } from "@/hooks/use-account";
import { profileSchema, type ProfileValues } from "@/lib/schemas/account";
import { findPhoneCountry, parseE164, toE164 } from "@/constants";
import { formatDate } from "@/lib/format";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";

type Props = {
  dict: Dictionary["account"];
  phoneFieldDict: Dictionary["common"]["phoneField"];
  locale: Locale;
};

/**
 * Cách người dùng đăng nhập được. Một tài khoản có thể nối cả hai nhà cung cấp
 * (cùng email), nên đây là danh sách chứ không phải một giá trị; không nối nhà
 * cung cấp nào thì chỉ còn đường email/mật khẩu.
 */
function signInMethods(
  user: AuthUser,
  dict: Dictionary["account"]["info"],
): string {
  const methods = [
    user.googleLinked ? dict.signInGoogle : null,
    user.facebookLinked ? dict.signInFacebook : null,
  ].filter((method): method is string => method !== null);
  return methods.length > 0 ? methods.join(" · ") : dict.signInPassword;
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="text-caption font-medium tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </h2>
  );
}

/**
 * Trang tài khoản: hồ sơ + số liệu, tùy chỉnh, thông tin
 * tài khoản và xóa tài khoản. Route đã được `proxy.ts` gác đăng nhập.
 */
export function AccountView({ dict, phoneFieldDict, locale }: Props) {
  const router = useRouter();
  const numberLocale = locale === "vi" ? "vi-VN" : "en-US";

  const { data: user } = useCurrentUserQuery();
  const { data: stats } = useAccountStatsQuery(!!user);
  const updateMutation = useUpdateProfileMutation();
  const deleteMutation = useDeleteAccountMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Toggle giữ ở state cục bộ, chỉ gửi lên backend khi bấm Lưu — tránh mỗi cú
  // click gửi một request riêng (spam khi người dùng bấm nhanh nhiều lần).
  const [prefs, setPrefs] = useState({
    emailNotifications: user?.emailNotifications ?? true,
    allowShowcase: user?.allowShowcase ?? true,
  });
  // Đồng bộ lại khi hồ sơ nạp xong hoặc đổi tài khoản — điều chỉnh state lúc
  // render thay vì trong effect (tránh cascading render không cần thiết).
  const [syncedUserId, setSyncedUserId] = useState(user?.id);
  if (user && user.id !== syncedUserId) {
    setSyncedUserId(user.id);
    setPrefs({
      emailNotifications: user.emailNotifications,
      allowShowcase: user.allowShowcase,
    });
  }
  const prefsDirty =
    !!user &&
    (prefs.emailNotifications !== user.emailNotifications ||
      prefs.allowShowcase !== user.allowShowcase);

  const schema = useMemo(
    () => profileSchema(dict.profile.errors),
    [dict.profile.errors],
  );
  // Số lưu trong DB là E.164 (`+84941757062`) — tách lại thành cờ + số nội địa
  // để ô nhập trông đúng như lúc đăng ký.
  const storedPhone = useMemo(() => parseE164(user?.phone), [user?.phone]);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    // `values` đồng bộ lại form khi hồ sơ nạp xong từ React Query.
    values: {
      fullName: user?.fullName ?? "",
      phoneCountry: storedPhone.country,
      phone: storedPhone.national,
    },
  });

  async function onSubmit(values: ProfileValues) {
    try {
      const national = values.phone.trim();
      await updateMutation.mutateAsync({
        fullName: values.fullName,
        // Chuỗi rỗng là tín hiệu xoá số điện thoại — backend đổi thành NULL.
        phone: national
          ? toE164(findPhoneCountry(values.phoneCountry).dial, national)
          : "",
        ...prefs,
      });
      toast.success(dict.profile.saved);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    }
  }

  async function onDeleteAccount() {
    try {
      await deleteMutation.mutateAsync();
      toast.success(dict.danger.success);
      setConfirmDelete(false);
      router.replace(`/${locale}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : String(err));
    }
  }

  const submitting = isSubmitting || updateMutation.isPending;

  const statItems = stats
    ? ([
        { label: dict.stats.cards, value: stats.cards },
        { label: dict.stats.views, value: stats.views },
        { label: dict.stats.wishes, value: stats.wishes },
      ] as const)
    : null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardContent className="flex flex-col gap-8">
          {/* Dưới `sm` hai khối xếp dọc: đứng chung một hàng thì cụm số liệu
              (không co được) ép cột tên về gần 0px, tên và email bị cắt mất
              còn badge vai trò tràn đè lên con số. */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex min-w-0 items-center gap-4 sm:flex-1">
              <UserAvatar user={user} className="size-16" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-body-lg font-semibold">
                    {user?.fullName}
                  </p>
                  {user ? (
                    <Badge variant="outline" size="xs">
                      {dict.info.roles[user.role]}
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-small text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            {statItems ? (
              <dl className="grid grid-cols-3 gap-2 rounded-xl border border-border py-3 sm:flex sm:shrink-0 sm:gap-6 sm:border-0 sm:py-0">
                {statItems.map((item) => (
                  <div key={item.label} className="min-w-0 text-center">
                    <dd className="text-h4 font-semibold text-primary">
                      {item.value.toLocaleString(numberLocale)}
                    </dd>
                    <dt className="text-caption text-muted-foreground">
                      {item.label}
                    </dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <SectionHeading>{dict.profile.heading}</SectionHeading>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-full-name">{dict.profile.fullName}</Label>
              <Input
                id="account-full-name"
                autoComplete="name"
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={
                  errors.fullName ? "account-full-name-error" : undefined
                }
                {...register("fullName")}
              />
              {errors.fullName ? (
                <p
                  id="account-full-name-error"
                  className="text-caption text-destructive"
                >
                  {errors.fullName.message}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-email">{dict.profile.email}</Label>
              <Input id="account-email" value={user?.email ?? ""} disabled />
              <p className="text-caption text-muted-foreground">
                {dict.profile.emailNote}
              </p>
            </div>
            <Controller
              control={control}
              name="phone"
              render={({ field }) => (
                <Controller
                  control={control}
                  name="phoneCountry"
                  render={({ field: countryField }) => (
                    <PhoneField
                      locale={locale}
                      label={dict.profile.phone}
                      placeholder={dict.profile.phonePlaceholder}
                      countryDict={phoneFieldDict}
                      country={countryField.value}
                      onCountryChange={countryField.onChange}
                      value={field.value}
                      onValueChange={field.onChange}
                      onBlur={field.onBlur}
                      error={errors.phone?.message}
                      disabled={submitting}
                    />
                  )}
                />
              )}
            />

            <Separator className="my-2" />

            <SectionHeading>{dict.prefs.heading}</SectionHeading>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium">
                  {dict.prefs.emailNotifications.label}
                </p>
                <p className="text-small text-muted-foreground">
                  {dict.prefs.emailNotifications.description}
                </p>
              </div>
              <Switch
                aria-label={dict.prefs.emailNotifications.label}
                checked={prefs.emailNotifications}
                disabled={!user || submitting}
                onCheckedChange={(checked) =>
                  setPrefs((prev) => ({
                    ...prev,
                    emailNotifications: checked,
                  }))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-body font-medium">
                  {dict.prefs.allowShowcase.label}
                </p>
                <p className="text-small text-muted-foreground">
                  {dict.prefs.allowShowcase.description}
                </p>
              </div>
              <Switch
                aria-label={dict.prefs.allowShowcase.label}
                checked={prefs.allowShowcase}
                disabled={!user || submitting}
                onCheckedChange={(checked) =>
                  setPrefs((prev) => ({ ...prev, allowShowcase: checked }))
                }
              />
            </div>

            <Button
              type="submit"
              size="sm"
              className="self-start"
              disabled={submitting || (!isDirty && !prefsDirty)}
            >
              {dict.profile.save}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <SectionHeading>{dict.info.heading}</SectionHeading>
          <dl className="flex flex-col gap-3 text-body">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{dict.info.role}</dt>
              <dd className="font-medium">
                {user ? dict.info.roles[user.role] : null}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{dict.info.signIn}</dt>
              <dd className="font-medium">
                {user ? signInMethods(user, dict.info) : null}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">{dict.info.memberSince}</dt>
              <dd className="font-medium">
                {user ? formatDate(user.createdAt, locale) : null}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 px-2">
        <div>
          <p className="text-body font-medium text-destructive">
            {dict.danger.title}
          </p>
          <p className="text-small text-muted-foreground">
            {dict.danger.description}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          // `ml-auto`: màn hẹp thì nút rớt xuống dòng riêng, và phải dạt phải
          // như lúc còn đứng chung hàng với phần mô tả.
          className="ml-auto border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
        >
          {dict.danger.action}
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{dict.danger.confirmTitle}</DialogTitle>
            <DialogDescription>{dict.danger.confirmBody}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              {dict.danger.cancel}
            </DialogClose>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDeleteAccount}
              disabled={deleteMutation.isPending}
            >
              {dict.danger.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
