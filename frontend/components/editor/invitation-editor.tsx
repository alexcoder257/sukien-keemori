"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Monitor,
  Smartphone,
  Wand2,
} from "lucide-react";
import { InvitationView } from "@/components/invitation/invitation-view";
import { CheckoutDialog } from "@/components/payment/checkout-dialog";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  ALBUM_PHOTO_CAP,
  DEFAULT_GUEST_INVITE,
  INVITATION_BLOCKS,
  INVITATION_KIND_QUERY_PARAM,
  INVITATION_KIND_SLUGS,
  KIND_EDITOR_BLOCKS,
  kindHasGuestInvite,
  type InvitationKind,
} from "@/constants/invitation";
import { editorDictForKind } from "@/lib/invitation-kind-dict";
import { invitationDisplayName } from "@/components/invitation/shared/invitation-display-name";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import {
  sampleHasOwnPhotos,
  sampleInvitationContent,
} from "@/lib/data/invitation-sample";
import { atlasCell } from "@/lib/atlas";
import { fill } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApiError, hasSession } from "@/apis";
import { API_ERROR_CODES } from "@/constants/http";
import { useSaveCardMutation } from "@/hooks/use-card";
import { usePhotoUploader } from "@/hooks/use-photo-upload";
import {
  forgetStagedPhotos,
  hasUploadsInFlight,
  isUploading,
  photoUpload,
  releasePhoto,
  setRestoringPhotos,
  subscribePhotos,
  waitForPreparedPhotos,
} from "@/lib/album-uploads";
import { PhotoStagingError } from "@/lib/photo-staging";
import { useSmoothScroll } from "@/contexts/smooth-scroll-provider";
import {
  clearDraft,
  draftPhotoCount,
  readDraft,
  restoreDraftPhotos,
  saveDraft,
  type RestoredPhotos,
} from "@/lib/editor-draft";
import {
  invitationContentSchema,
  type InvitationContent,
} from "@/lib/schemas/invitation";
import { EditorBlock } from "./editor-block";
import { InvitationKindBadge } from "@/components/shared/invitation-kind-badge";
import { OccasionFields } from "./occasion-fields";
import { SharePreviewFields } from "@/components/editor/share-preview-fields";
import { DressCodeFields } from "./dress-code-fields";
import { GuestInviteBlock } from "./guest-invite-fields";
import { CoupleNamesLockedDialog } from "./couple-names-locked-dialog";
import { FillSampleConfirmDialog } from "./fill-sample-confirm-dialog";
import {
  PhotoSaveProgressDialog,
  type PhotoSaveProgress,
} from "./photo-save-progress-dialog";
import { parseGuestNames } from "@/lib/guest-list";
import { stripLegacyKeys } from "@/lib/legacy-content";
import {
  TemplatePickerDialog,
  type EditorTemplate,
} from "./template-picker-dialog";
import {
  AlbumFields,
  PhotoSlotFields,
  CeremoniesFields,
  CountdownFields,
  CoupleFields,
  EnvelopeFields,
  FamiliesFields,
  GiftBoxFields,
  MusicFields,
  ReceptionFields,
  StoryFields,
  ThankYouFields,
  TimelineFields,
  WishesFields,
  RsvpFields,
} from "./editor-blocks";

/**
 * Chờ mọi ảnh trong nội dung này tải xong. Không có timeout: bỏ cuộc giữa chừng
 * rồi lưu thì đúng tấm ảnh đang bay sẽ được gửi lại lần nữa, và cả hai bản đều
 * nằm lại trên đĩa.
 */
function waitForUploads(
  content: InvitationContent,
  /** 0 → 1: trung bình tiến độ của những tấm đang bay lúc bắt đầu đợi. */
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const urls = [...Object.values(content.photos), ...content.album.photos];
  if (!hasUploadsInFlight(urls)) return Promise.resolve();

  const inFlight = urls.filter(isUploading);
  const report = () => {
    if (!onProgress) return;
    const sum = inFlight.reduce((total, url) => {
      const upload = photoUpload(url);
      return total + (upload?.status === "uploading" ? upload.progress : 1);
    }, 0);
    onProgress(sum / inFlight.length);
  };
  report();

  return new Promise((resolve) => {
    const unsubscribe = subscribePhotos(() => {
      report();
      if (hasUploadsInFlight(urls)) return;
      unsubscribe();
      resolve();
    });
  });
}

/**
 * Nhịp cất nháp sau lần gõ cuối. Mỗi lượt cất chỉ là vài KB vào
 * `localStorage`; nhịp này để không ghi lại theo từng phím.
 */
const DRAFT_SAVE_DEBOUNCE_MS = 800;

type Mode = "edit" | "preview";
type Device = "desktop" | "mobile";

type Props = {
  initialContent: InvitationContent;
  /**
   * Loại thiệp — quyết định khối nào có trong form và chữ của chúng. Bất biến
   * suốt vòng đời thiệp: backend trả 400 nếu `content.kind` đổi.
   */
  kind: InvitationKind;
  /**
   * Thiệp đang sửa. Không có nghĩa là đang dựng thiệp mới — bấm lưu sẽ tạo một
   * thiệp mới thay vì ghi đè, nên trang gọi phải truyền id khi mở lại thiệp cũ.
   */
  cardId?: string;
  /** Đường dẫn của thiệp đang sửa — để mở thẳng các trang quản lý của nó. */
  cardSlug?: string;
  /**
   * Thiệp đang sửa đã thanh toán (link đang sống). Chưa trả — kể cả thiệp mới —
   * thì "Lưu & Tạo link" lưu bản nháp rồi mở hộp thanh toán; đã trả thì chỉ lưu.
   */
  paid?: boolean;
  /** Toàn bộ mẫu thiệp, để đổi mẫu ngay trong trình chỉnh sửa. */
  templates: EditorTemplate[];
  /** Slug mẫu mở đầu — của thiệp đang sửa, hoặc lấy từ URL với thiệp mới. */
  templateSlug: string;
  dict: Dictionary["editor"];
  invitationDict: Dictionary["invitation"];
  commonDict: Dictionary["common"];
  paymentDict: Dictionary["payment"]["upgrade"];
  locale: Locale;
};

/**
 * Trình chỉnh sửa hai trạng thái: điền form ⇄ xem thiệp toàn màn hình. Người
 * dùng chỉ sửa nội dung; bố cục, font và màu do template quyết định.
 */
export function InvitationEditor({
  initialContent,
  kind,
  cardId,
  cardSlug,
  paid = false,
  templates,
  templateSlug,
  dict: baseDict,
  invitationDict,
  commonDict,
  paymentDict,
  locale,
}: Props) {
  // Nhãn của mọi khối theo loại thiệp ("Tiệc cưới" → "Thời gian & địa điểm"…).
  // Các component trường chỉ đọc `dict.blocks`, nên trộn một lần ở đây là đủ.
  const dict = useMemo(
    () => editorDictForKind(baseDict, kind),
    [baseDict, kind],
  );
  const [mode, setMode] = useState<Mode>("edit");
  const [device, setDevice] = useState<Device>("desktop");
  const [pickerOpen, setPickerOpen] = useState(false);
  /** Lưu bị từ chối vì tên cô dâu chú rể đã khoá — xem `onSave`. */
  const [namesLockedOpen, setNamesLockedOpen] = useState(false);
  const [fillSampleOpen, setFillSampleOpen] = useState(false);
  /**
   * Thiệp vừa lưu nhưng chưa thanh toán — mở hộp thanh toán cho nó. `null` là
   * hộp đóng; đóng hộp thì người dùng ở lại editor với thiệp đã lưu.
   */
  const [checkoutCard, setCheckoutCard] = useState<{
    id: string;
    title: string;
  } | null>(null);
  /**
   * Tiến độ tải ảnh của lần lưu đang chạy — `null` là không có ảnh nào phải
   * gửi. Bước này chiếm gần hết thời gian chờ khi thiệp có album, nên nút phải
   * nói ra nó đang ở đâu thay vì đứng im ở chữ "Đang lưu…".
   */
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  /**
   * Hộp thoại tiến độ của lượt lưu có ảnh — xem `PhotoSaveProgressDialog`.
   * Chỉ bật lên một lần mỗi lượt lưu: người dùng đã đóng thì không bật lại
   * giữa chừng, nút lưu vẫn quay như cũ.
   */
  const [photoSave, setPhotoSave] = useState<PhotoSaveProgress | null>(null);
  const [photoSaveOpen, setPhotoSaveOpen] = useState(false);
  const previewRef = useRef<HTMLElement>(null);
  const editScrollYRef = useRef(0);
  const previousModeRef = useRef<Mode>(mode);
  const { setScroll } = useSmoothScroll();
  // Đổi mẫu không nạp lại trang: nội dung đang nhập vẫn còn nguyên trong form,
  // chỉ khung xem thử đổi mẫu. URL vẫn phải bám theo mẫu đang chọn để tải lại
  // trang là ra đúng mẫu đó.
  const initialTemplate =
    templates.find((item) => item.slug === templateSlug) ?? templates[0];
  const [template, setTemplate] = useState<EditorTemplate>(initialTemplate);
  const router = useRouter();
  /**
   * Nháp khoá theo mẫu **và** loại: mọi loại dùng chung mẫu dựng sẵn, khoá
   * theo mẫu thôi thì nháp thiệp sinh nhật bị đổ vào form tốt nghiệp. Thiệp
   * cưới giữ khoá cũ để nháp đang có của khách không mất.
   */
  const draftKeyFor = (slug: string) =>
    kind === "wedding" ? slug : `${slug}:${kind}`;
  const draftKey = draftKeyFor(template.slug);
  /**
   * Đường về editor của một mẫu. Thiệp mới trên mẫu dựng sẵn cần `?loai` —
   * thiếu nó trang editor quay về bước chọn loại (sau đăng nhập, sau khi tải
   * lại) và nháp không bao giờ được đọc.
   */
  const editorPath = (slug: string) =>
    kind === "wedding"
      ? `/${locale}/editor/${slug}`
      : `/${locale}/editor/${slug}?${INVITATION_KIND_QUERY_PARAM}=${INVITATION_KIND_SLUGS[kind]}`;
  /**
   * Form chỉnh sửa có thể rất dài. Nếu giữ nguyên vị trí cuộn khi chuyển mode,
   * màn mở thiệp `100svh` bắt đầu phía trên viewport và tấm bìa trông như bị
   * dồn lên trên. Neo đầu preview vào viewport, rồi trả người dùng về đúng chỗ
   * họ đang sửa khi quay lại form.
   */
  const onModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;

    if (nextMode === "preview") {
      editScrollYRef.current = window.scrollY;
    }

    setMode(nextMode);
  };

  useEffect(() => {
    if (previousModeRef.current === mode) return;
    previousModeRef.current = mode;

    if (mode === "preview") {
      const preview = previewRef.current;
      if (preview) {
        setScroll(preview.getBoundingClientRect().top + window.scrollY);
      }
      return;
    }

    setScroll(editScrollYRef.current);
  }, [mode, setScroll]);
  const schema = useMemo(
    () => invitationContentSchema(invitationDict.errors),
    [invitationDict.errors],
  );
  const form = useForm<InvitationContent>({
    resolver: zodResolver(schema),
    defaultValues: cardId
      ? stripLegacyKeys(initialContent)
      : {
          ...initialContent,
          sharePreview: initialContent.sharePreview ?? {
            mode: "brand",
            photoUrl: "",
            positionY: 50,
          },
        },
    mode: "onBlur",
  });
  // Preview cần nội dung mới nhất theo từng ký tự nên phải theo dõi cả form.
  const content = useWatch({ control: form.control });
  const visibility = content.visibility as InvitationContent["visibility"];
  /**
   * Bật link mời riêng thì xem thử chào đúng khách đầu tiên trong danh sách:
   * cặp đôi cần thấy tên nằm trên màn bìa trông ra sao — dài quá có xuống dòng
   * không — trước khi gửi cả trăm link đi.
   */
  const previewGuestName = content.guestInvite?.enabled
    ? (parseGuestNames(content.guestInvite.guestList ?? "")[0] ?? null)
    : null;

  const saveCard = useSaveCardMutation();

  /**
   * Ảnh lên vùng tạm ngay lúc chọn — kể cả khi chưa đăng nhập — thay vì dồn
   * vào lượt bấm lưu. Xem `lib/photo-staging.ts` cho toàn bộ lý do.
   */
  const uploader = usePhotoUploader();

  /**
   * Thiệp mới được tạo ở lượt lưu đầu tiên. Lượt đó hỏng sau bước tạo (mất mạng
   * lúc nhận ảnh) thì lần bấm sau ghi vào đúng thiệp ấy chứ không dựng thêm
   * một thiệp nháp nữa.
   */
  const [createdCard, setCreatedCard] = useState<{
    id: string;
    templateSlug: string;
  } | null>(null);

  /**
   * Cất bản nháp rồi mới sang trang đăng nhập. Nháp chỉ giữ id ảnh trong vùng
   * tạm, nên phải **đợi những tấm đang bay** lên xong trước — cất sớm là tấm
   * đó mất sau vòng đăng nhập. Đường quay về là chính editor của mẫu đang soạn.
   */
  const goToLogin = async (message?: string) => {
    // Tấm còn đang thu nhỏ chưa vào form: đợi nó vào (và bắt đầu gửi) trước,
    // rồi mới đợi mọi tấm gửi xong.
    await waitForPreparedPhotos();
    await waitForUploads(form.getValues());
    saveDraft(draftKey, form.getValues());
    if (message) toast.info(message);
    const next = encodeURIComponent(editorPath(template.slug));
    router.push(`/${locale}/dang-nhap?next=${next}`);
  };

  /**
   * Nháp đã được đọc xong (và ảnh của nó đã tải lại xong). Tự cất chỉ bật sau
   * mốc này: bật sớm hơn thì lượt cất đầu tiên ghi nội dung trống của form lên
   * đúng bản nháp đang chờ được đọc.
   */
  const draftLoadedRef = useRef(false);

  /**
   * Lưu & tạo link — **điểm duy nhất trong editor bắt buộc đăng nhập**.
   *
   * Soạn thử thì mở cho tất cả: người ta cần thấy thiệp của mình trước khi
   * quyết định mở tài khoản. Nhưng một cái link thì phải có chủ — nó gắn với
   * quyền duyệt lời chúc và quyền sửa thiệp, nên không tồn tại khái niệm thiệp
   * vô chủ.
   *
   * Trước khi đẩy đi đăng nhập thì **cất bản nháp**: bắt người ta gõ lại cả
   * form sau khi đăng nhập là cách chắc chắn nhất để họ bỏ đi.
   *
   * Lưu xong thì rời editor sang "Thiệp của tôi" kèm `?moi=<slug>` để danh sách
   * mở sẵn hộp link — thứ người ta vừa bấm nút để có chính là cái link đó, bắt
   * họ đi tìm nó trong danh sách là hỏng nhịp.
   */
  /**
   * Chữ trên nút lưu. Ba nút ở ba chỗ trong màn hình này phải nói cùng một
   * thứ, nên dựng ở một chỗ.
   */
  const saveLabel = form.formState.isSubmitting
    ? uploadProgress && uploadProgress.total > 0
      ? fill(dict.uploadingPhotos, {
          done: uploadProgress.done,
          total: uploadProgress.total,
        })
      : dict.saving
    : paid
      ? dict.saveOnly
      : dict.save;

  /**
   * Lưu bị chặn vì form còn lỗi: đưa người dùng tới **ô lỗi đầu tiên**.
   *
   * Không trông vào `shouldFocusError` của React Hook Form: nó chỉ focus được ô
   * đăng ký bằng `register()`, còn phần lớn ô trong editor (giờ, địa điểm, link
   * bản đồ, biểu tượng) đi qua `Controller` và không đưa ref lên — bấm lưu xong
   * màn hình đứng yên, lỗi nằm tít dưới. Thay vào đó tìm trong DOM phần tử
   * `aria-invalid` đầu tiên theo thứ tự hiển thị, là thứ mọi ô đều gắn khi lỗi.
   *
   * Callback lỗi chỉ bật cờ; việc tìm ô chạy trong effect **sau** khi React đã
   * vẽ dòng báo lỗi. Đang xem trước thì form không được render, nên effect
   * chuyển về chế độ sửa trước rồi lần render sau mới tìm.
   */
  const [errorFocusRequest, setErrorFocusRequest] = useState(0);
  /** Lượt yêu cầu đã xử lý — đổi chế độ về sau không được nhảy tới lỗi cũ. */
  const handledErrorFocusRef = useRef(0);
  const onInvalid = () => {
    toast.error(dict.fixErrors);
    setErrorFocusRequest((count) => count + 1);
  };

  useEffect(() => {
    if (errorFocusRequest === handledErrorFocusRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (mode === "preview") {
        onModeChange("edit");
        return;
      }
      const target = document.querySelector<HTMLElement>(
        '[data-editor-form] [aria-invalid="true"]',
      );
      handledErrorFocusRef.current = errorFocusRequest;
      if (!target) return;
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
    // `mode` nằm trong deps để lượt chuyển sang chế độ sửa chạy lại effect và
    // lần này tìm thấy form. `onModeChange` đổi danh tính mỗi lần render nên
    // cố ý không đưa vào.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorFocusRequest, mode]);

  const saveValues = async (values: InvitationContent): Promise<boolean> => {
    if (!hasSession()) {
      await goToLogin(dict.loginRequired);
      return false;
    }

    let photoSaveShown = false;
    const showPhotoSave = (next: PhotoSaveProgress) => {
      setPhotoSave(next);
      if (photoSaveShown) return;
      photoSaveShown = true;
      setPhotoSaveOpen(true);
    };
    /**
     * Thanh tiến độ gộp hai bước chờ ảnh thành một dải 0 → 100: gửi nốt tấm
     * đang bay (nếu có) chiếm nửa đầu, nhận ảnh về thiệp chiếm phần còn lại tới
     * 95%, và 5% cuối là ghi nội dung + xuất bản.
     */
    let claimStart = 0;

    try {
      // Đợi những tấm đang bay nốt. Bấm lưu giữa chừng mà không đợi thì lượt lưu
      // thấy ảnh vẫn còn `blob:` và gửi lại chính tệp đó — hai bản sao vĩnh viễn
      // trên đĩa cho một tấm ảnh.
      await waitForUploads(values, (fraction) => {
        claimStart = 50;
        showPhotoSave({
          stage: "uploading",
          percent: fraction * 50,
          done: 0,
          total: 0,
        });
      });

      // Thiệp đang sửa, hoặc thiệp mà lượt lưu hỏng trước đã kịp tạo.
      const existing =
        createdCard ?? (cardId ? { id: cardId, templateSlug } : null);
      const card = await saveCard.mutateAsync({
        onUploadProgress: (done, total) => {
          setUploadProgress({ done, total });
          if (total === 0) return;
          showPhotoSave({
            stage: done < total ? "processing" : "finishing",
            percent: claimStart + (done / total) * (95 - claimStart),
            done,
            total,
          });
        },
        onCardCreated: setCreatedCard,
        cardId: existing?.id,
        templateSlug: template.slug,
        templateChanged:
          existing !== null && template.slug !== existing.templateSlug,
        // Tên hiển thị trong danh sách suy từ nội dung, không bắt nhập thêm một
        // ô nữa: "Minh Tuấn & Ngọc Anh" đã là cách người ta gọi tấm thiệp này.
        title: invitationDisplayName(values),
        content: values,
      });

      // Từ giờ mọi ảnh đã thuộc thiệp, gỡ ảnh khỏi ô không được xoá trong vùng
      // tạm nữa — ảnh bị thay do backend dọn ở lượt lưu sau.
      forgetStagedPhotos();

      // Xoá trước khi rời trang: còn nháp thì lần sau mở editor của mẫu này để
      // làm thiệp mới, nội dung của thiệp vừa lưu sẽ bị đổ lại vào form. Tự cất
      // đã tắt từ lúc thiệp được tạo (`createdCard`), nên không có lượt cất nào
      // dựng lại nó sau dòng này.
      clearDraft(draftKey);
      // Hộp tiến độ (nếu đã bật) ở lại 100% cho tới khi trang chuyển đi.
      if (photoSaveShown) {
        setPhotoSave((current) =>
          current ? { ...current, stage: "done", percent: 100 } : current,
        );
      }
      if (card.status === "paid") {
        // Link đã sống từ lần trả tiền — lưu là xong, về danh sách.
        toast.success(dict.saved);
        router.push(`/${locale}/thiep-cua-toi`);
        return true;
      }

      // Bản nháp đã nằm ở backend nhưng chưa có link: link chỉ có sau khi trả
      // tiền. Đóng hộp tiến độ rồi mở hộp thanh toán — người dùng bấm "Lưu &
      // Tạo link" là để có link, nên bước kế tiếp là thanh toán chứ không phải
      // một danh sách.
      setPhotoSaveOpen(false);
      toast.success(dict.savedDraft);
      setCheckoutCard({ id: card.id, title: card.title });
      return true;
    } catch (error) {
      // Lỗi được báo bằng toast/hộp thoại riêng bên dưới — thanh tiến độ đứng
      // yên giữa chừng mà vẫn mở thì đọc ra như vẫn đang chạy.
      setPhotoSaveOpen(false);
      if (
        error instanceof ApiError &&
        error.code === API_ERROR_CODES.coupleNamesLocked
      ) {
        // Tên cô dâu chú rể bị khoá 15 ngày sau lần xuất bản đầu. Đây là chỗ
        // **duy nhất** trang khách nói về luật này ngoài Điều khoản — bằng hộp thoại
        // chứ không phải toast, xem `CoupleNamesLockedDialog`.
        setNamesLockedOpen(true);
        return false;
      }
      if (error instanceof PhotoStagingError) {
        toast.error(
          error.reason === "timeout"
            ? dict.photoUpload.processingTimeout
            : dict.photoUpload.photosFailed,
        );
        return false;
      }
      toast.error(error instanceof ApiError ? error.message : dict.saveFailed);
      return false;
    } finally {
      // Kể cả khi lưu hỏng: giữ lại con số của lần chạy trước thì lần bấm sau
      // sẽ mở đầu bằng tiến độ cũ.
      setUploadProgress(null);
    }
  };

  const onSave = form.handleSubmit(async (values) => {
    await saveValues(stripLegacyKeys(values));
  }, onInvalid);

  /**
   * Mở editor của một thiệp **mới** mà còn nháp (sau vòng đăng nhập, hoặc sau
   * khi trang bị trình duyệt giết rồi tải lại): trả nội dung vào form.
   *
   * Hai nhịp: chữ vào form ngay, ảnh tải lại từ vùng tạm rồi mới gắn vào. Ảnh
   * chỉ lấp ô **còn trống** và xếp trước album hiện có — người dùng có thể đã
   * chọn ảnh khác trong lúc chờ, và thứ họ vừa làm thắng thứ trong nháp.
   *
   * Thiệp đã lưu thì không đọc nháp: nội dung của nó nằm ở backend, và nháp
   * khoá theo mẫu nên có thể là của một thiệp mới khác cùng mẫu.
   */
  useEffect(() => {
    const draft = cardId ? null : readDraft(draftKey);
    if (!draft) {
      draftLoadedRef.current = true;
      return;
    }

    const controller = new AbortController();
    // Nháp cất từ trước khi có link mời riêng thiếu hẳn khoá này; để nguyên
    // thì schema chặn lượt lưu mà không ô nào báo lỗi cho người dùng thấy.
    // Cùng lý do cho `visibility.rsvp`: nháp cất trước khi có block này
    // thiếu khoá, và schema đòi đủ mọi block.
    form.reset({
      ...stripLegacyKeys(draft.content),
      guestInvite: draft.content.guestInvite ?? { ...DEFAULT_GUEST_INVITE },
      visibility: {
        ...draft.content.visibility,
        rsvp: draft.content.visibility?.rsvp ?? true,
      },
    });
    // Gắn **dần** từng tấm: server còn đang nén thì tấm cuối có thể về sau cả
    // phút (`PROCESSING_MAX_WAIT_MS`). Mỗi lượt nhận toàn bộ những gì đã về,
    // nên phép gộp phải chạy lại nhiều lần mà không nhân đôi hay gỡ nhầm.
    const released = new Set<string>();
    const release = (url: string) => {
      if (released.has(url)) return;
      released.add(url);
      releasePhoto(url);
    };
    const applyRestored = (restored: RestoredPhotos) => {
      const current = form.getValues();
      const photos = { ...current.photos };
      for (const [slot, url] of Object.entries(restored.photos)) {
        if (photos[slot] === url || released.has(url)) continue;
        // Người dùng đã chọn ảnh khác vào ô này trong lúc chờ: thứ họ vừa
        // làm thắng thứ trong nháp.
        if (photos[slot]) release(url);
        else photos[slot] = url;
      }
      const merged = [
        ...restored.album.filter((url) => !released.has(url)),
        ...current.album.photos.filter((url) => !restored.album.includes(url)),
      ];
      for (const url of merged.slice(ALBUM_PHOTO_CAP)) release(url);

      if (
        restored.sharePhotoUrl &&
        current.sharePreview?.mode === "photo" &&
        !current.sharePreview.photoUrl &&
        !released.has(restored.sharePhotoUrl)
      ) {
        form.setValue("sharePreview.photoUrl", restored.sharePhotoUrl, {
          shouldDirty: true,
        });
      }
      form.setValue("photos", photos, { shouldDirty: true });
      form.setValue("album.photos", merged.slice(0, ALBUM_PHOTO_CAP), {
        shouldDirty: true,
      });
    };

    // Không báo gì thì ô ảnh trống trơn cả phút, người dùng tưởng đã mất rồi
    // chọn lại — thành ảnh trùng khi bản nháp về tới.
    const total = draftPhotoCount(draft);
    const progressToast =
      total > 0
        ? toast.loading(
            fill(dict.draftPhotosRestoring, { done: 0, count: total }),
          )
        : undefined;
    // Mỗi tấm còn chờ có sẵn một ô đang tải ở đúng chỗ của nó (xem
    // `restoringPhotos`); toast ở trên nói nốt phần ô không nói được — cần đợi
    // bao lâu, và không cần chọn lại.
    const albumIds = draft.album.filter((entry) => "id" in entry).length;
    const markRestoring = (restored: RestoredPhotos) => {
      const albumUrls = draft.album.length - albumIds;
      setRestoringPhotos({
        slots: new Set(
          draft.slots
            .map(([slot]) => slot)
            .filter((slot) => !restored.photos[slot]),
        ),
        album: Math.max(0, albumIds - (restored.album.length - albumUrls)),
      });
    };
    if (total > 0) {
      setRestoringPhotos({
        slots: new Set(draft.slots.map(([slot]) => slot)),
        album: albumIds,
      });
    }

    const dismissProgress = () => {
      if (progressToast !== undefined) toast.dismiss(progressToast);
      setRestoringPhotos(null);
    };
    controller.signal.addEventListener("abort", dismissProgress);
    let done = 0;

    void restoreDraftPhotos(draft, controller.signal, (restored) => {
      if (controller.signal.aborted) return;
      done += 1;
      if (progressToast !== undefined) {
        toast.loading(fill(dict.draftPhotosRestoring, { done, count: total }), {
          id: progressToast,
        });
      }
      applyRestored(restored);
      markRestoring(restored);
    }).then((restored) => {
      dismissProgress();
      if (controller.signal.aborted) return;
      draftLoadedRef.current = true;
      applyRestored(restored);
      if (draft.photosLost || restored.lost) {
        toast.warning(dict.draftPhotosLost);
      }
    });

    return () => {
      controller.abort();
    };
    // Chỉ khôi phục một lần lúc mở editor; sau đó form là nguồn sự thật.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Tự cất nháp của thiệp **chưa lưu lần nào**, để trang bị tải lại — trình
   * duyệt trong app Facebook bị iOS giết khi người dùng sang app khác lấy link
   * bản đồ — không cuốn theo mọi thứ khách đã nhập. Xem `lib/editor-draft.ts`.
   *
   * Cất khi form đổi (debounce), khi một tấm ảnh vừa lên tới vùng tạm (nháp
   * chỉ giữ được tấm đã có id), và **ngay** khi trang bị ẩn: đó là khoảnh khắc
   * cuối cùng trước khi iOS có thể giết trang mà không báo gì thêm.
   *
   * Thiệp đã có id thì nội dung nằm ở backend, không cần nháp — kể cả thiệp
   * vừa được tạo giữa lượt Lưu đầu tiên (`createdCard`): tắt từ đó thì lượt
   * xoá nháp sau khi lưu xong không bị một nhịp debounce còn treo dựng lại.
   */
  const draftSlugRef = useRef(draftKey);
  const initialContentJson = useMemo(
    () => JSON.stringify(initialContent),
    [initialContent],
  );
  useEffect(() => {
    if (cardId || createdCard) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const flush = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (!draftLoadedRef.current) return;
      // Đổi mẫu thì nội dung đi theo mẫu mới; nháp dưới khoá mẫu cũ thành rác,
      // và mở lại mẫu cũ sẽ gặp một nội dung đã bị bỏ.
      if (draftSlugRef.current !== draftKey) {
        clearDraft(draftSlugRef.current);
        draftSlugRef.current = draftKey;
      }
      const values = form.getValues();
      // Form về đúng nội dung mở đầu (người dùng tự xoá hết những gì đã nhập)
      // thì không còn gì để giữ — cất nó là lần sau mở editor lại khôi phục
      // một form trống.
      if (JSON.stringify(values) === initialContentJson) {
        clearDraft(draftKey);
        return;
      }
      saveDraft(draftKey, values);
    };
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(flush, DRAFT_SAVE_DEBOUNCE_MS);
    };
    const flushPending = () => {
      if (timer) flush();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushPending();
    };

    // Vừa đổi mẫu: cất ngay dưới khoá mới, không đợi lần gõ tiếp theo.
    if (draftSlugRef.current !== draftKey) schedule();

    // `subscribe` chứ không `watch`: nghe thay đổi mà không kéo component render
    // lại theo từng phím.
    const unsubscribeForm = form.subscribe({
      formState: { values: true },
      callback: schedule,
    });
    const unsubscribePhotos = subscribePhotos(schedule);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushPending);
    return () => {
      unsubscribeForm();
      unsubscribePhotos();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushPending);
      flushPending();
    };
    // `form` giữ nguyên danh tính suốt vòng đời component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, createdCard, draftKey, initialContentJson]);

  /**
   * Đổi mẫu chỉ thay lớp trình bày: mẫu, URL và hết. **Không được xoá gì cả**
   * — mọi block là block dùng chung, và ảnh của ô mà mẫu mới không có vẫn nằm
   * nguyên trong form để đổi lại là thấy lại (`docs/business-model.md` mục 4:
   * "Nếu editor bắt khách nhập lại, mô hình gói này sụp").
   *
   * Album cũng không đụng tới: nó là của thiệp chứ không của mẫu.
   */
  const onSelectTemplate = (next: EditorTemplate) => {
    setTemplate(next);

    // `replaceState` được Next hỗ trợ và đồng bộ với router mà không nạp lại
    // trang — dùng `router.replace` sẽ dựng lại trang và xoá sạch form.
    window.history.replaceState(null, "", editorPath(next.slug));

    // Mẫu mới có thể cần nhiều ảnh hơn số ảnh đang có: nhắc để khách biết còn
    // ô trống, chứ không chặn và cũng không sửa dữ liệu.
    const filled = next.photoSlots.filter(
      (slot) => form.getValues("photos")[slot],
    ).length;
    if (filled < next.photoSlots.length) {
      toast.info(
        fill(dict.templatePicker.photoSlotsHint, {
          name: next.name,
          count: next.photoSlots.length,
          filled,
        }),
      );
    }
  };

  // Ảnh mẫu chỉ điền ở `next dev` — xem `onFillSample`.
  const isDev = process.env.NODE_ENV === "development";

  /**
   * Điền sẵn mọi ô chữ để cặp đôi thấy ngay thiệp đọc ra như bản demo, thay vì
   * một tấm thiệp trống rỗng chưa nói lên điều gì.
   *
   * **Ảnh chỉ điền khi chạy dev.** Ảnh mẫu là ảnh cưới của người mẫu trong ảnh
   * stock; một tấm thiệp thật gửi cho họ hàng mà mang mặt người lạ là chuyện
   * không sửa lại được sau khi link đã chia sẻ. Chữ thì ngược lại — gõ đè lên
   * là xong, nên điền sẵn chữ vẫn có ích ở production.
   *
   * Và ảnh **người dùng đã tải lên thì giữ nguyên**: `reset` thay cả object
   * nên không giữ hộ, phải chép lại tay. Xoá ảnh của họ vì họ bấm một nút tên
   * là "điền dữ liệu" là mất dữ liệu thật để đổi lấy dữ liệu giả.
   */
  const onFillSample = () => {
    const current = form.getValues();
    // Mẫu có nội dung trưng bày riêng mang ảnh của chính nó, không phải ảnh
    // stock — điền ra đúng tấm thiệp mẫu, kể cả ảnh.
    const withPhotos = isDev || sampleHasOwnPhotos(template.slug);
    const sample = sampleInvitationContent({
      kind,
      templateSlug: template.slug,
      photoSlots: template.photoSlots,
      includePhotos: withPhotos,
    });
    // `reset` thay cả mảng nghi lễ và timeline, thứ `setValue` từng field không
    // làm được vì số phần tử khác nhau.
    form.reset(
      {
        ...(withPhotos
          ? sample
          : {
              ...sample,
              photos: current.photos,
              album: { ...sample.album, photos: current.album.photos },
            }),
        // Điền ở đây chứ không trong `sampleInvitationContent`: bản mẫu đó còn
        // vẽ trang demo, nơi mỗi bố cục phải giữ lời dẫn mặc định của nó.
        // Lời dẫn mặc định là câu của thiệp cưới ("Lễ thành hôn được cử hành
        // tại"); loại khác giữ lời dẫn rỗng của bản mẫu để thiệp tự dùng chữ
        // trung tính của từ điển.
        reception:
          kind === "wedding"
            ? {
                ...sample.reception,
                venueLabel: dict.blocks.reception.venueLabelPlaceholder,
              }
            : sample.reception,
        // Danh sách khách là dữ liệu thật của cặp đôi, không có bản "mẫu" nào
        // thay được — cùng lý do với ảnh đã tải lên ở trên, và giữ ở cả dev.
        guestInvite: current.guestInvite,
        sharePreview: current.sharePreview,
      },
      { keepDefaultValues: true },
    );
    toast.success(dict.filledSample);
  };

  const editorBlocks = KIND_EDITOR_BLOCKS[kind];

  const blockRenderers: Record<
    (typeof INVITATION_BLOCKS)[number],
    { title: string; body: React.ReactNode }
  > = {
    envelope: {
      title: dict.blocks.envelope.title,
      body: <EnvelopeFields form={form} dict={dict} />,
    },
    couple: {
      title: dict.blocks.couple.title,
      body: <CoupleFields form={form} dict={dict} />,
    },
    families: {
      title: dict.blocks.families.title,
      body: <FamiliesFields form={form} dict={dict} />,
    },
    ceremonies: {
      title: dict.blocks.ceremonies.title,
      body: <CeremoniesFields form={form} dict={dict} />,
    },
    reception: {
      title: dict.blocks.reception.title,
      body: <ReceptionFields form={form} dict={dict} />,
    },
    dressCode: {
      title: dict.blocks.dressCode.title,
      body: <DressCodeFields form={form} dict={dict} />,
    },
    timeline: {
      title: dict.blocks.timeline.title,
      body: (
        <TimelineFields
          form={form}
          dict={dict}
          // Lễ gia tiên và đón dâu chỉ có nghĩa với thiệp cưới.
          hiddenKinds={kind === "wedding" ? [] : ["ancestral", "procession"]}
        />
      ),
    },
    countdown: {
      title: dict.blocks.countdown.title,
      body: <CountdownFields form={form} dict={dict} />,
    },
    story: {
      title: dict.blocks.story.title,
      body: <StoryFields form={form} dict={dict} />,
    },
    album: {
      title: dict.blocks.album.title,
      body: (
        <AlbumFields
          form={form}
          dict={dict}
          uploader={uploader}
        />
      ),
    },
    giftBox: {
      title: dict.blocks.giftBox.title,
      body: (
        <GiftBoxFields
          form={form}
          dict={dict}
          singleAccount={kind !== "wedding"}
        />
      ),
    },
    wishes: {
      title: dict.blocks.wishes.title,
      body: <WishesFields cardSlug={cardSlug} dict={dict} locale={locale} />,
    },
    rsvp: {
      title: dict.blocks.rsvp.title,
      body: <RsvpFields cardSlug={cardSlug} dict={dict} locale={locale} />,
    },
    music: {
      title: dict.blocks.music.title,
      body: <MusicFields form={form} dict={dict} />,
    },
    thankYou: {
      title: dict.blocks.thankYou.title,
      body: <ThankYouFields form={form} dict={dict} />,
    },
  };

  return (
    <div
      // Cờ này tắt chữ serif của khu marketing (xem `@layer base` trong
      // `globals.css`): editor là công cụ thao tác, chữ ở đây cần đọc nhanh
      // theo hàng chứ không cần có giọng.
      data-editor-surface
      className={cn(
        "flex min-h-svh flex-col",
        mode === "edit"
          ? // `bg-background` chứ không phải một màu pha tay: nền trang vốn đã
            // đứng dưới `bg-card` của thẻ block một bậc ở cả hai chế độ (Paper
            // dưới Ivory ở chế độ sáng, Forest Ink dưới Forest ở chế độ tối),
            // nên form không chìm vào nền mà cũng không phải ghim màu.
            "bg-background"
          : // Khi xem thiệp, cả trang là mặt bàn của công cụ: một mặt phẳng
            // trung tính để thiệp là thứ duy nhất có màu. Trắng ở chế độ sáng,
            // Forest Ink ở chế độ tối — vẫn là "mặt bàn", chỉ đổi bóng đèn.
            "bg-white dark:bg-forest-ink",
      )}
    >
      {/* Thanh công cụ nổi trên nội dung: kính mờ thay vì một dải đặc, để ở chế
          độ xem thiệp người dùng vẫn thấy thiệp chạy phía sau. */}
      <header className="sticky top-0 z-40 border-b border-foreground/8 bg-background/25 backdrop-blur-2xl backdrop-saturate-150">
        {/* Mọi con của thanh là phần tử phẳng xếp bằng `order`, để cùng một
            cây DOM ra hai bố cục. Màn hẹp: dòng 1 là Thoát · mẫu · điền mẫu ·
            Lưu (nút chính luôn nằm trong tầm ngón cái), dòng 2 là công tắc chế
            độ giãn hết bề ngang. Từ `sm`: một dòng như cũ. Để flex-wrap tự do
            như trước thì các nút rơi xuống dòng theo độ dài chữ, mỗi dòng lệch
            một kiểu. */}
        <div className="container-page flex min-h-18 flex-wrap items-center gap-x-2 gap-y-3 py-3 sm:gap-x-3">
          <div className="order-1 flex min-w-0 items-center gap-3 sm:gap-4">
            {mode === "edit" ? (
              <Link
                // Thiệp cưới quay về kho mẫu như trước; loại khác quay về bước
                // chọn loại — kho mẫu chưa có mẫu nào cho chúng.
                href={
                  kind === "wedding"
                    ? `/${locale}/mau-thiep`
                    : `/${locale}/tao-thiep`
                }
                className="inline-flex items-center gap-2 text-small text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft aria-hidden className="size-4" />
                {/* Chữ chỉ từ `lg`: ở tablet hẹp (~640px) nó là mấy chục px
                    cuối cùng đẩy nút Lưu xuống dòng hai. */}
                <span className="sr-only lg:not-sr-only">{dict.exit}</span>
              </Link>
            ) : (
              // `text-small`: size `sm` của Button vốn là 12px, còn cả thanh này
              // chạy ở 14px — không ép lại thì mỗi nút một cỡ chữ.
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-small font-normal"
                onClick={() => onModeChange("edit")}
              >
                <ArrowLeft />
                {/* Dưới `lg` đã có công tắc "Chỉnh sửa" ngay trên thanh; giữ chữ
                    ở tablet là nút Lưu rơi xuống dòng hai. */}
                <span className="sr-only lg:not-sr-only">
                  {dict.backToEdit}
                </span>
              </Button>
            )}
            {mode === "edit" ? (
              /* Chữ ký của mẫu: một mảnh preview cắt theo dáng vòm thiệp, đủ
                 để nhận ra mẫu đang sửa mà không cần đọc tên. Đây là công cụ
                 chỉnh sửa nên được ẩn khi chuyển sang xem thiệp. */
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                aria-haspopup="dialog"
                className="flex items-center gap-3 rounded-lg border-l border-foreground/10 py-1 pr-2 pl-4 transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded-t-full rounded-b-sm ring-1 ring-foreground/15">
                  {template.image.position ? (
                    <span
                      className="block"
                      style={atlasCell(template.image.position)}
                    >
                      <Image
                        src={template.image.src}
                        alt={fill(dict.templateLabel, { name: template.name })}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </span>
                  ) : (
                    <Image
                      src={template.image.src}
                      alt={fill(dict.templateLabel, { name: template.name })}
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  )}
                </span>
                {/* Một dòng, cùng cỡ chữ với mọi nhãn khác trên thanh: nhãn phụ
                    nhạt, tên mẫu đậm hơn. Hai dòng có chữ hoa giãn cách sẽ thành
                    kiểu chữ thứ ba trên một thanh vốn chỉ nên có một. */}
                {/* Trên màn hình hẹp chỉ còn miếng preview và mũi tên — đủ để
                    bấm vào, mà không đẩy các nút còn lại xuống dòng. */}
                {/* Tablet (`sm`–`lg`) bỏ nhãn phụ, chỉ giữ tên mẫu: thiếu ~75px
                    này là thanh không còn nằm trên một dòng. */}
                <span className="hidden text-small text-muted-foreground sm:inline">
                  <span className="hidden lg:inline">
                    {dict.templateKicker}{" "}
                  </span>
                  <span className="font-medium text-foreground">
                    {template.name}
                  </span>
                </span>
                <ChevronDown
                  aria-hidden
                  className="size-4 shrink-0 text-muted-foreground"
                />
              </button>
            ) : null}
          </div>

          {/* Đệm đẩy mọi nút còn lại sang phải, ở cả hai bố cục. */}
          <div aria-hidden className="order-2 flex-1" />

          {/* Điền dữ liệu mẫu chạy ở **mọi môi trường**: một thiệp trống chưa
              nói lên được điều gì, và cặp đôi cần thấy ngay nó đọc ra như bản
              demo trước khi ngồi gõ. Ảnh thì chỉ điền khi chạy dev — xem
              `onFillSample`. Vẫn để mức nhấn thấp nhất: đây là bước khởi động,
              không phải việc chính trên thanh này.

              Màn hẹp không đặt nó trên thanh: chữ đầy đủ không vừa cạnh nút Lưu,
              mà chỉ còn icon đũa phép thì không ai đoán ra nó làm gì. Bản màn
              hẹp nằm ở đầu form, xem ngay dưới `<form>`. */}
          {mode === "edit" ? (
            <Button
              variant="ghost"
              size="sm"
              className="order-3 hidden gap-2 text-small font-normal text-muted-foreground lg:inline-flex"
              onClick={() => setFillSampleOpen(true)}
            >
              <Wand2 aria-hidden />
              {dict.fillSample}
            </Button>
          ) : null}

          <div className="order-5 flex w-full items-center gap-2 sm:order-4 sm:w-auto sm:gap-3">
            {mode === "preview" ? (
              <SegmentedControl
                aria-label={dict.devices.label}
                value={device}
                onValueChange={setDevice}
                // Trên điện thoại khung xem thử đã rộng bằng màn hình, nên hai
                // chế độ trông y hệt nhau — nút chỉ chiếm chỗ của cặp "Chỉnh
                // sửa / Xem thiệp", cặp này tự giãn ra lấp phần trống.
                className="hidden sm:inline-flex"
                options={[
                  {
                    value: "desktop",
                    label: (
                      <span className="flex items-center gap-2">
                        <Monitor aria-hidden className="size-4" />
                        <span className="sr-only lg:not-sr-only">
                          {dict.devices.desktop}
                        </span>
                      </span>
                    ),
                  },
                  {
                    value: "mobile",
                    label: (
                      <span className="flex items-center gap-2">
                        <Smartphone aria-hidden className="size-4" />
                        <span className="sr-only lg:not-sr-only">
                          {dict.devices.mobile}
                        </span>
                      </span>
                    ),
                  },
                ]}
              />
            ) : null}
            <SegmentedControl
              aria-label={dict.modes.label}
              value={mode}
              onValueChange={onModeChange}
              className="flex-1 *:flex-1 *:justify-center sm:flex-none sm:*:flex-none"
              options={[
                { value: "edit", label: dict.modes.edit },
                { value: "preview", label: dict.modes.preview },
              ]}
            />
          </div>

          <Button
            size="sm"
            className="order-4 text-small font-normal sm:order-5"
            onClick={onSave}
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <Loader2 aria-hidden className="size-4 animate-spin" />
            ) : null}
            {saveLabel}
          </Button>
        </div>
      </header>

      {/* Chỉ dựng khi mở: bảng chọn nạp preview của cả kho mẫu, không nên tải
          những ảnh đó cho người chưa định đổi mẫu. */}
      {pickerOpen ? (
        <TemplatePickerDialog
          open
          onOpenChange={setPickerOpen}
          templates={templates}
          value={template.slug}
          onSelect={onSelectTemplate}
          dict={dict.templatePicker}
        />
      ) : null}

      {checkoutCard ? (
        <CheckoutDialog
          open
          onOpenChange={(open) => {
            if (!open) setCheckoutCard(null);
          }}
          card={checkoutCard}
          dict={paymentDict}
          commonDict={commonDict}
          locale={locale}
        />
      ) : null}

      <CoupleNamesLockedDialog
        open={namesLockedOpen}
        onOpenChange={setNamesLockedOpen}
        // Backend vẫn trả `COUPLE_NAMES_LOCKED` cho mọi loại; chữ "cô dâu chú
        // rể" chỉ đúng với thiệp cưới.
        dict={
          kind === "wedding"
            ? dict.coupleNamesLocked
            : { ...dict.coupleNamesLocked, ...dict.namesLockedOccasion }
        }
        locale={locale}
      />

      <FillSampleConfirmDialog
        open={fillSampleOpen}
        onOpenChange={setFillSampleOpen}
        onConfirm={onFillSample}
        dict={dict.fillSampleConfirm}
      />

      {photoSave ? (
        <PhotoSaveProgressDialog
          open={photoSaveOpen}
          onOpenChange={setPhotoSaveOpen}
          progress={photoSave}
          dict={dict.photoSaveProgress}
        />
      ) : null}

      {mode === "edit" ? (
        <main className="container-page w-full max-w-3xl pt-4 pb-12 sm:pt-12">
          <form
            data-editor-form
            className="flex flex-col gap-4"
            onSubmit={(event) => event.preventDefault()}
          >
            {/* Bản màn hẹp và tablet của "Điền dữ liệu mẫu" (bản trên thanh công
                cụ ẩn dưới `lg`, vì ở tablet nó đẩy nút Lưu xuống dòng). Đầu form
                chứ không phải một dòng thứ ba của thanh dính: đây là bước khởi
                động, cần thấy lúc mới vào chứ không cần bám theo suốt lúc cuộn. */}
            <Button
              type="button"
              variant="outline"
              className="gap-2 text-small font-normal lg:hidden"
              onClick={() => setFillSampleOpen(true)}
            >
              <Wand2 aria-hidden />
              {dict.fillSample}
            </Button>

            {/* Loại đã chốt lúc tạo và không đổi được, nên đây là nhãn chứ
                không phải ô chọn — cùng nhãn người dùng thấy ở Thiệp của tôi. */}
            <InvitationKindBadge
              kind={kind}
              label={commonDict.invitationKinds[kind]}
            />

            {/* Thông tin chính của các loại khác thiệp cưới — đứng đầu form vì
                thiệp mở đầu bằng nó. Không công tắc, cùng lý do với ô ảnh. */}
            {kind !== "wedding" ? (
              <EditorBlock
                title={dict.occasion[kind].title}
                toggleLabel={dict.toggleBlock}
              >
                <OccasionFields form={form} kind={kind} dict={dict.occasion} />
              </EditorBlock>
            ) : null}

            {/* Ô ảnh đứng trên cùng: đây là trục phân gói và là thứ khách nhìn
                thấy đầu tiên trên thiệp. Không có công tắc — bố cục mẫu dàn
                quanh những ô này nên tắt đi là thủng một mảng. */}
            {template.photoSlots.length > 0 ? (
              <EditorBlock
                title={dict.blocks.photos.title}
                toggleLabel={dict.toggleBlock}
              >
                <PhotoSlotFields
                  form={form}
                  dict={dict}
                  slots={template.photoSlots}
                  uploader={uploader}
                />
              </EditorBlock>
            ) : kind !== "wedding" ? null : (
              // Mẫu Free không có ô ảnh nào, và cách duy nhất đưa ảnh cưới thật
              // vào là đổi sang mẫu có ảnh. Một dòng nhắc ngay tại chỗ khách
              // nhận ra điều đó, đúng phễu ở `business-model.md` mục 4.
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-6 py-4">
                <p className="text-small text-muted-foreground">
                  {dict.notes.noPhotoSlots}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPickerOpen(true)}
                >
                  {dict.blocks.photos.browseTemplates}
                </Button>
              </div>
            )}

            {editorBlocks.map((block) => (
              <Fragment key={block}>
                <EditorBlock
                  title={blockRenderers[block].title}
                  visible={visibility[block]}
                  onVisibleChange={(visible) =>
                    form.setValue(`visibility.${block}`, visible, {
                      shouldDirty: true,
                    })
                  }
                  toggleLabel={dict.toggleBlock}
                >
                  {blockRenderers[block].body}
                </EditorBlock>
                {/* Ngay dưới Phong bì: link riêng đổi đúng lời chào trên màn
                    mở đầu mà thẻ đó soạn. */}
                {block === "envelope" && kindHasGuestInvite(kind) ? (
                  <GuestInviteBlock
                    form={form}
                    dict={dict}
                    locale={locale}
                    cardSlug={cardSlug}
                  />
                ) : null}
              </Fragment>
            ))}
            <SharePreviewFields
              form={form}
              dict={dict.sharePreview}
              invitationDict={invitationDict}
              slots={template.photoSlots}
              cardSlug={cardSlug}
              locale={locale}
            />
          </form>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={onSave} disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 aria-hidden className="size-4 animate-spin" />
              ) : null}
              {saveLabel}
            </Button>
            <Button variant="outline" onClick={() => onModeChange("preview")}>
              {dict.modes.preview}
            </Button>
          </div>
        </main>
      ) : (
        <main ref={previewRef} className="flex-1 py-10 max-sm:py-0">
          {/* Dưới `sm` tấm thiệp tràn sát mép như khách mời mở trên điện thoại:
              không đệm trên dưới, không bo góc. Khoảng nền tối quanh thiệp chỉ
              có nghĩa ở màn rộng, nơi nó cho thấy khổ thiệp đang xem; trên điện
              thoại nó là phần thừa và làm màn bìa không còn lấp đúng một khung
              hình. */}
          <div
            className={cn(
              "max-sm:rounded-none",
              // Khung xem thử không tô nền: thiệp Aurora cắt đỉnh thành vòm nên
              // một mảng nền đặc ở đây sẽ hiện thành hai vạt vuông hai bên cung.
              //
              // `isolate` là hàng rào: mỗi mẫu thiệp có thang z-index riêng và
              // không mẫu nào phải biết rằng nó đang bị lồng vào một app có
              // thanh công cụ dính. Khép nó vào một stacking context là mọi giá
              // trị bên trong, dù lớn tới đâu, cũng không leo lên được thanh
              // công cụ.
              "isolate mx-auto w-full overflow-hidden rounded-3xl",
              device === "mobile" ? "max-w-[420px]" : "max-w-[640px]",
            )}
          >
            <InvitationView
              content={content as InvitationContent}
              dict={invitationDict}
              ceremonyKindsDict={dict.ceremonyKinds}
              locale={locale}
              photoSlots={template.photoSlots}
              templateSlug={template.slug}
              guestName={previewGuestName}
              musicTogglePlacement={
                device === "mobile" ? "mobile-preview" : "viewport"
              }
            />
          </div>
          {/* Không có hàng nút dưới tấm thiệp: "Xem thiệp" là để nhìn tấm thiệp
              như khách mời sẽ thấy. "Lưu & Tạo link" đã nằm trên thanh công cụ
              dính, lặp lại ở đây chỉ chen một khối giao diện vào cuối thiệp. */}
        </main>
      )}
    </div>
  );
}
