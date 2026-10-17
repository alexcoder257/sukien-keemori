"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { StagedPhotoKind } from "@/apis";
import {
  photoUpload,
  releasePhoto,
  restoringPhotos,
  subscribePhotos,
  type PhotoUpload,
  type RestoringPhotos,
} from "@/lib/album-uploads";
import { stagePhotos, unstagePhoto } from "@/lib/photo-staging";

/** Trạng thái tải lên của một ô ảnh, cập nhật theo từng lần báo tiến độ. */
export function usePhotoUpload(url?: string): PhotoUpload | undefined {
  return useSyncExternalStore(
    subscribePhotos,
    () => (url ? photoUpload(url) : undefined),
    () => undefined,
  );
}

const NOTHING_RESTORING: RestoringPhotos = { slots: new Set(), album: 0 };

/** Ảnh của bản nháp còn đang tải lại — xem `restoringPhotos`. */
export function useRestoringPhotos(): RestoringPhotos {
  return useSyncExternalStore(
    subscribePhotos,
    restoringPhotos,
    () => NOTHING_RESTORING,
  );
}

export type PhotoUploader = {
  /**
   * Gửi các ảnh vừa chọn lên vùng tạm — ngay lúc chọn, kể cả khi chưa đăng
   * nhập. Form giữ nguyên URL `blob:` cho tới lúc Lưu; xem `lib/photo-staging.ts`.
   */
  upload: (blobUrls: string[], kind: StagedPhotoKind) => void;
  /**
   * Gỡ một ảnh khỏi ô: huỷ lượt gửi dở và dọn nó khỏi vùng tạm. Ảnh đã nằm
   * trong thiệp đã lưu thì **không** bị xoá ở đây — thiệp đang chạy vẫn cần nó
   * nếu người dùng bỏ ngang; backend dọn ảnh bị thay lúc lưu.
   */
  remove: (url: string) => void;
};

export function usePhotoUploader(): PhotoUploader {
  return useMemo(
    () => ({
      upload: stagePhotos,
      remove: (url) => {
        unstagePhoto(url);
        releasePhoto(url);
      },
    }),
    [],
  );
}
