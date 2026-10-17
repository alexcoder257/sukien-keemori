"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Pause, Play, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MUSIC_TRACKS, normalizeForSearch } from "@/constants/invitation";
import { Input } from "@/components/ui/input";
import type { Dictionary } from "@/i18n/dictionaries";
import { fill, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import styles from "./music-picker-dialog.module.css";

type MusicDict = Dictionary["editor"]["blocks"]["music"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Id bài đang chọn; chuỗi rỗng nghĩa là không dùng nhạc nền. */
  value: string;
  onSelect: (trackId: string) => void;
  dict: MusicDict;
  cancelLabel: string;
};

/**
 * Modal chọn nhạc nền: nghe thử từng bài rồi mới chốt. Lựa chọn chỉ ghi vào
 * form khi bấm xác nhận, nên nghe thử không làm bẩn nội dung thiệp.
 */
export function MusicPickerDialog({ open, onOpenChange, ...props }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Dưới 440px mở toàn màn hình, cùng bộ class với các dialog toàn màn
          khác của editor. `overflow-hidden` để chỉ danh sách bài cuộn: header,
          ô tìm kiếm và hai nút đứng yên, nút xác nhận luôn trong tầm ngón cái. */}
      <DialogContent className="max-w-xl max-mobile:inset-0 max-mobile:h-dvh max-mobile:max-h-none max-mobile:w-full max-mobile:max-w-none max-mobile:translate-none max-mobile:overflow-hidden max-mobile:rounded-none max-mobile:bg-background max-mobile:px-6">
        {/* Nội dung chỉ tồn tại khi modal mở, nhờ vậy lựa chọn nháp và audio
            nghe thử tự reset mỗi lần mở lại. */}
        <MusicPickerBody onOpenChange={onOpenChange} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function MusicPickerBody({
  onOpenChange,
  value,
  onSelect,
  dict,
  cancelLabel,
}: Omit<Props, "open">) {
  // Chưa có bài nào thì đánh dấu sẵn bài đầu tiên, để bỏ tick "Không dùng
  // nhạc" là có ngay một bài được chọn thay vì một danh sách trống lựa chọn.
  const [draft, setDraft] = useState(value || MUSIC_TRACKS[0].id);
  /**
   * "Không dùng nhạc" là một ô tick chứ không phải nút: nó là trạng thái của
   * lựa chọn (bật/tắt nhạc), chỉ ghi vào form khi bấm xác nhận như mọi thứ
   * khác trong hộp này. Chọn hay nghe thử một bài thì tự bỏ tick.
   */
  const [noMusic, setNoMusic] = useState(value === "");

  const pick = (id: string) => {
    setDraft(id);
    setNoMusic(false);
  };
  const [query, setQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  /** Tiến độ của bài đang nghe thử, tính bằng giây. */
  const [progress, setProgress] = useState({ current: 0, duration: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /**
   * Tìm theo **cả tên bài lẫn tên ca sĩ**: khách nhớ "bài của Đức Phúc" thường
   * xuyên hơn nhớ đúng tên bài. Lọc ở client vì cả thư viện chỉ vài chục bài và
   * đã nằm sẵn trong bundle — gọi API cho ngần này dữ liệu là thêm một trạng
   * thái chờ mà không đổi được gì.
   */
  const tracks = useMemo(() => {
    const keyword = normalizeForSearch(query);
    if (!keyword) return MUSIC_TRACKS;
    return MUSIC_TRACKS.filter((track) =>
      normalizeForSearch(`${track.title} ${track.artist}`).includes(keyword),
    );
  }, [query]);

  const stop = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
    setProgress({ current: 0, duration: 0 });
  };

  // Đóng modal bằng Esc hoặc click nền cũng phải tắt nhạc nghe thử.
  useEffect(() => () => audioRef.current?.pause(), []);

  const togglePreview = (id: string, src: string) => {
    if (playingId === id) {
      stop();
      return;
    }
    stop();
    const audio = new Audio(src);
    // Độ dài chỉ biết được sau khi trình duyệt đọc xong metadata của file.
    audio.addEventListener("loadedmetadata", () =>
      setProgress({ current: 0, duration: audio.duration }),
    );
    audio.addEventListener("timeupdate", () =>
      setProgress((prev) => ({ ...prev, current: audio.currentTime })),
    );
    audio.addEventListener("ended", () => stop());
    audioRef.current = audio;
    setPlayingId(id);
    // Nghe thử một bài cũng có nghĩa là đang chọn bài đó; bấm phát rồi bấm
    // xác nhận luôn là luồng tự nhiên nhất.
    pick(id);
    void audio.play().catch(() => stop());
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setProgress((prev) => ({ ...prev, current: seconds }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{dict.dialogTitle}</DialogTitle>
        <DialogDescription>{dict.dialogDescription}</DialogDescription>
      </DialogHeader>

      {/* `DialogContent` là flex-col không gap — khoảng cách giữa các khối do
          chính chúng khai (header `mb-6`, footer `mt-8`), nên ô tìm kiếm phải
          tự chừa lề dưới, không thì nó dính sát dòng nhạc đầu tiên. */}
      <div className="relative mb-4">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={dict.searchPlaceholder}
          aria-label={dict.searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* Danh sách cuộn trong khung cố định: thư viện đã vài chục bài, để nó
          đẩy dài modal thì nút xác nhận rơi khỏi màn hình trên laptop nhỏ. */}
      <ul className="flex max-h-[min(52svh,26rem)] flex-col gap-2 overflow-y-auto pr-2 max-mobile:max-h-none max-mobile:pr-0 max-mobile:min-h-0 max-mobile:flex-1">
        {tracks.map((track) => {
          const selected = !noMusic && draft === track.id;
          const playing = playingId === track.id;
          return (
            <li key={track.id}>
              <div
                className={cn(
                  "flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors",
                  selected || playing
                    ? "border-primary bg-primary/8"
                    : "border-foreground/15 hover:bg-foreground/3",
                )}
              >
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="shrink-0 rounded-full"
                  aria-label={fill(playing ? dict.pause : dict.play, {
                    name: track.title,
                  })}
                  onClick={() => togglePreview(track.id, track.src)}
                >
                  {playing ? <Pause /> : <Play />}
                </Button>
                {/* `min-w-0`: thiếu nó thì flex item không co nhỏ hơn dòng chữ
                    dài nhất, tên ca sĩ dài tràn khỏi thẻ và đẩy dấu chọn ra
                    ngoài. Tên bài xuống dòng chứ không cắt "…": trong hộp
                    chọn nhạc, tên bài chính là thông tin cần đọc. */}
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    className="w-full text-left outline-none"
                    aria-pressed={selected}
                    onClick={() => pick(track.id)}
                  >
                    <span className="block text-body break-words">
                      {track.title}
                    </span>
                    <span className="block text-small break-words text-muted-foreground">
                      {track.artist}
                    </span>
                  </button>
                  {playing ? (
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={progress.duration || 0}
                        step={0.1}
                        value={progress.current}
                        disabled={!progress.duration}
                        className={styles.seek}
                        style={
                          {
                            "--seek-progress": `${
                              progress.duration
                                ? (progress.current / progress.duration) * 100
                                : 0
                            }%`,
                          } as CSSProperties
                        }
                        aria-label={fill(dict.seek, { name: track.title })}
                        aria-valuetext={formatDuration(progress.current)}
                        onChange={(event) => seek(Number(event.target.value))}
                      />
                      <span className="shrink-0 text-caption tabular-nums text-muted-foreground">
                        {formatDuration(progress.current)} /{" "}
                        {formatDuration(progress.duration)}
                      </span>
                    </div>
                  ) : null}
                </div>
                {/* Luôn giữ chỗ cho dấu chọn, để bấm chọn một bài không làm
                    cột chữ hẹp lại và tên bài nhảy dòng. */}
                <Check
                  aria-hidden
                  className={cn(
                    "size-4 shrink-0 text-primary",
                    !selected && "invisible",
                  )}
                />
              </div>
            </li>
          );
        })}
        {tracks.length === 0 ? (
          <li className="rounded-xl border border-dashed border-foreground/15 px-4 py-8 text-center text-small text-muted-foreground">
            {fill(dict.searchEmpty, { query })}
          </li>
        ) : null}
      </ul>

      <DialogFooter className="max-mobile:mt-auto max-mobile:pt-6 max-mobile:[&>*]:flex-1">
        <label className="flex cursor-pointer items-center gap-2 text-small sm:mr-auto max-mobile:min-w-full">
          <Checkbox
            checked={noMusic}
            onCheckedChange={(checked) => {
              setNoMusic(checked === true);
              if (checked) stop();
            }}
          />
          {dict.none}
        </label>
        <DialogClose render={<Button variant="outline" size="sm" />}>
          {cancelLabel}
        </DialogClose>
        <Button
          size="sm"
          onClick={() => {
            stop();
            onSelect(noMusic ? "" : draft);
            onOpenChange(false);
          }}
        >
          {noMusic ? dict.confirmNone : dict.confirm}
        </Button>
      </DialogFooter>
    </>
  );
}
