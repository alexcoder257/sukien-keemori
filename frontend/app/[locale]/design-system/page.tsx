import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Link2,
  QrCode,
  Sparkles,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, InputAffix, InputGroup } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Radio, RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

/**
 * Trang tham chiếu nội bộ cho design system — dùng để đối chiếu token, font,
 * màu và component với bản thiết kế. Không phải trang sản phẩm nên nội dung
 * đặt trực tiếp, không qua dictionary.
 */

const palette = [
  { name: "Forest Ink", hex: "#0B0D0B", className: "bg-forest-ink" },
  { name: "Forest", hex: "#10261D", className: "bg-forest" },
  { name: "Forest Soft", hex: "#173429", className: "bg-forest-soft" },
  { name: "Champagne", hex: "#D8C39B", className: "bg-champagne" },
  { name: "Deep Gold", hex: "#B88A4A", className: "bg-deep-gold" },
  { name: "Ivory", hex: "#F5F0E6", className: "bg-ivory" },
  { name: "Paper", hex: "#EDE6D9", className: "bg-paper" },
];

const spacingScale = [4, 8, 16, 24, 32, 48, 64, 96, 128];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-2">
        <p className="text-eyebrow text-primary">{title}</p>
        <Separator />
      </div>
      {children}
    </section>
  );
}

/** Trang tham chiếu nội bộ của đội ngũ — không phải trang sản phẩm. */
export const metadata: Metadata = { robots: NO_INDEX };

export default function DesignSystemPage() {
  return (
    <main className="theme-forest min-h-screen bg-background text-foreground">
      <div className="container-page space-y-16 py-16">
        <header className="space-y-4">
          <h1>Wedding SaaS Design System</h1>
          <p className="max-w-2xl text-body-lg text-muted-foreground">
            Hệ thống thiết kế dành cho nền tảng tạo thiệp cưới online cao cấp,
            tinh tế và giàu cảm xúc.
          </p>
          <Link
            href="./design-system/album"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-small font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Preview album dùng chung <ArrowRight className="size-4" />
          </Link>
        </header>

        <Section title="Color System">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
            {palette.map((color) => (
              <div key={color.hex} className="space-y-2">
                <div
                  className={`h-20 rounded-lg ring-1 ring-foreground/15 ${color.className}`}
                />
                <p className="text-small font-medium">{color.name}</p>
                <p className="text-caption text-muted-foreground">
                  {color.hex}
                </p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-6">
            <h1>H1 — Inter / 64px / Bold</h1>
            <h2>H2 — Inter / 48px / Bold</h2>
            <h3>H3 — Inter / 36px / SemiBold</h3>
            <h4>H4 — Inter / 28px / Medium</h4>
            <p className="text-body-lg">Body Large — Inter / 18px / Regular</p>
            <p className="text-body">Body Base — Inter / 16px / Regular</p>
            <p className="text-small">Small — Inter / 14px / Regular</p>
            <p className="text-caption">Caption — Inter / 12px / Regular</p>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-6">
            <Button>
              Bắt đầu tạo thiệp <ArrowRight />
            </Button>
            <Button variant="outline">
              Khám phá mẫu thiệp <ArrowRight />
            </Button>
            <Button variant="ghost">
              Tạo thiệp của bạn <ArrowRight />
            </Button>
            <Button variant="secondary">Secondary</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Yêu thích">
              <Heart />
            </Button>
          </div>
        </Section>

        <Section title="Badges (gói dịch vụ)">
          <div className="flex flex-wrap gap-4">
            <Badge variant="free">Free</Badge>
            <Badge variant="gold">Gold</Badge>
            <Badge variant="diamond">Diamond</Badge>
          </div>
        </Section>

        <Section title="Icon set (line style)">
          <div className="flex flex-wrap gap-8 text-champagne [&_svg]:size-6">
            <Heart />
            <Sparkles />
            <CheckCircle2 />
            <Calendar />
            <ImageIcon />
            <Link2 />
            <QrCode />
            <ArrowRight />
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="ds-default">Default</Label>
              <Input id="ds-default" placeholder="Email của bạn" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-filled">Filled</Label>
              <Input id="ds-filled" defaultValue="hello@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-success">Success</Label>
              <InputGroup>
                <Input
                  id="ds-success"
                  data-state="success"
                  defaultValue="hello@example.com"
                />
                <InputAffix className="text-success">
                  <CheckCircle2 />
                </InputAffix>
              </InputGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ds-error">Error</Label>
              <InputGroup>
                <Input id="ds-error" aria-invalid defaultValue="hello@" />
                <InputAffix className="text-destructive">
                  <XCircle />
                </InputAffix>
              </InputGroup>
              <p className="text-caption text-destructive">
                Email không hợp lệ
              </p>
            </div>
          </div>
        </Section>

        <Section title="Checkbox & Radio">
          <div className="flex flex-wrap items-center gap-12">
            <Label className="gap-3">
              <Checkbox defaultChecked />
              Tôi đồng ý với Điều khoản sử dụng
            </Label>
            <RadioGroup defaultValue="a" className="flex gap-8">
              <Label className="gap-3">
                <Radio value="a" />
                Tùy chọn được chọn
              </Label>
              <Label className="gap-3">
                <Radio value="b" />
                Tùy chọn chưa chọn
              </Label>
            </RadioGroup>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-8 lg:grid-cols-2">
            <Card tone="light">
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-full ring-1 ring-foreground/15">
                  <Heart className="size-4" />
                </span>
                <CardTitle className="text-h3">
                  Hãy bắt đầu từ lời mời đầu tiên.
                </CardTitle>
                <CardDescription>
                  Chọn một mẫu thiệp, kể câu chuyện của hai bạn và gửi niềm vui
                  đến những người thân yêu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost">
                  Bắt đầu tạo thiệp <ArrowRight />
                </Button>
              </CardContent>
            </Card>

            <Card tone="dark">
              <CardHeader>
                <p className="text-eyebrow text-muted-foreground">
                  Trải nghiệm trọn vẹn
                </p>
                <CardTitle className="text-h2">Diamond 249k</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-small">
                {[
                  "Mẫu cao cấp độc quyền",
                  "Album không giới hạn",
                  "Hiệu ứng & storytelling nâng cao",
                ].map((item) => (
                  <p key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="size-4 text-champagne" />
                    {item}
                  </p>
                ))}
                <Button variant="ghost" className="mt-4">
                  Tạo thiệp của bạn <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Spacing scale (multiples of 8)">
          <div className="flex flex-wrap items-end gap-6">
            {spacingScale.map((step) => (
              <div key={step} className="space-y-2 text-center">
                <div
                  className="border border-dashed border-primary/50"
                  style={{ width: step, height: step }}
                />
                <p className="text-caption text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Radius scale">
          <div className="flex flex-wrap gap-6 text-center text-caption text-muted-foreground [&>div]:space-y-2 [&_span]:block [&_span]:size-16 [&_span]:border [&_span]:border-primary/50">
            <div>
              <span className="rounded-sm" />
              4px · rounded-sm
            </div>
            <div>
              <span className="rounded-lg" />
              8px · rounded-lg
            </div>
            <div>
              <span className="rounded-xl" />
              12px · rounded-xl
            </div>
            <div>
              <span className="rounded-2xl" />
              16px · rounded-2xl
            </div>
            <div>
              <span className="rounded-3xl" />
              24px · rounded-3xl
            </div>
            <div>
              <span className="rounded-4xl" />
              32px · rounded-4xl
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
