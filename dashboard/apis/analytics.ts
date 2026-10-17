"use client";

import type { CardStatus } from "@/constants/template";
import { request } from "./http";

/* --------------------------------------------------------------- phân tích */

export interface AnalyticsReport {
  traffic: {
    totalPageViews: number;
    totalVisitors: number;
    daily: { day: string; pageViews: number; visitors: number }[];
  };
  cardsByTemplate: {
    templateSlug: string;
    templateName: string;
    count: number;
  }[];
  cardsByStatus: Record<CardStatus, number>;
  /** Lượt xem thiệp — khác lượt truy cập website ở `traffic`. */
  totalCardViews: number;
}

/** `super_admin` only; backend trả 403 cho admin thường. */
export function getAnalytics(days = 30): Promise<AnalyticsReport> {
  return request<AnalyticsReport>(`/admin/analytics?days=${days}`);
}

/* ---------------------------------------------------- google analytics */

export interface GoogleAnalyticsRow {
  /** Giá trị thô của GA — nhãn người đọc do dashboard dịch. */
  key: string;
  value: number;
}

export interface GoogleAnalyticsReport {
  /** `false` = chưa khai service account ở backend, không phải "chưa có ai vào". */
  configured: boolean;
  days: number;
  sessions: number;
  /** 0–1. */
  engagementRate: number;
  /** Giây. */
  averageSessionDuration: number;
  /** 0–1. */
  newUserRate: number;
  channels: GoogleAnalyticsRow[];
  devices: GoogleAnalyticsRow[];
  topPages: GoogleAnalyticsRow[];
}

/** `super_admin` only, cùng mức quyền với `getAnalytics`. */
export function getGoogleAnalytics(days = 30): Promise<GoogleAnalyticsReport> {
  return request<GoogleAnalyticsReport>(`/admin/analytics/google?days=${days}`);
}
