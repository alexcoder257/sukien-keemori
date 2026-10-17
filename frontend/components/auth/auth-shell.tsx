import type { ReactNode } from "react";
import { BrandIcon } from "@/components/shared/brand-logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthLogo() {
  return <BrandIcon className="mx-auto size-12 shadow-sm" sizes="48px" />;
}

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Card className="border-border/70 shadow-lg">
      <CardHeader className="items-center gap-1 text-center">
        <AuthLogo />
        <CardTitle className="mt-2 text-xl">{title}</CardTitle>
        <CardDescription className="text-balance">{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10.5px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
