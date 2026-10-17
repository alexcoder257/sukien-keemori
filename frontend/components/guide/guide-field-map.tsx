"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowDown, ArrowRight, Expand, Info } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Dictionary } from "@/i18n/dictionaries";
import fieldMap from "@/lib/data/guide-field-map.json";
import styles from "@/components/guide/guide-field-map.module.css";

type Shot = (typeof fieldMap)[number]["form"];
type Copy = Dictionary["guide"]["fieldMap"];

function AnnotatedImage({ shot, active, alt }: { shot: Shot; active: number; alt: string }) {
  return (
    <div className={styles.shot} style={{ maxWidth: shot.width }}>
      <Image src={shot.src} alt={alt} width={shot.width} height={shot.height} sizes="(max-width: 767px) 92vw, 45vw" unoptimized className="h-auto w-full" />
      <svg className={styles.annotations} viewBox={`0 0 ${shot.width} ${shot.height}`} aria-hidden="true">
        {shot.markers.map((mark) => {
          const cx = Math.min(shot.width - 19, mark.x + mark.width - 7);
          const cy = Math.max(19, mark.y - 5);
          return (
            <g key={mark.number} opacity={active === mark.number ? 1 : 0.72}>
              <rect x={mark.x - 3} y={mark.y - 3} width={mark.width + 6} height={mark.height + 6} rx="9" fill="none" stroke="var(--guide-annotation)" strokeWidth={active === mark.number ? 3.5 : 2} />
              <circle cx={cx} cy={cy} r="18" fill="var(--guide-annotation-paper)" stroke="var(--guide-annotation)" strokeWidth="3" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="var(--guide-annotation)" fontSize="19" fontWeight="700" fontFamily="Arial, sans-serif">{mark.number}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** All chapters are present in the initial HTML. Only selection and zoom need client state. */
export function GuideFieldMap({ dict }: { dict: Copy }) {
  const [groupKey, setGroupKey] = useState("envelope");
  const [active, setActive] = useState(4);
  const [zoom, setZoom] = useState<{ shot: Shot; title: string } | null>(null);
  const selectGroup = (key: string) => {
    const group = fieldMap.find((item) => item.key === key);
    if (!group) return;
    setGroupKey(key);
    setActive(group.form.markers[0].number);
  };
  const groups = dict.groups as Record<string, string>;
  const fields = dict.fields as Record<string, { label: string; body: string }>;

  return (
    <section id="field-map" className={`${styles.root} scroll-mt-24 border-t border-border py-12 lg:py-16`}>
      <div className="container-page">
        <div className="mb-8 max-w-3xl">
          <p className="text-eyebrow text-primary">{dict.eyebrow}</p>
          <h2 className="mt-3 text-h3 font-medium">{dict.title}</h2>
          <p className="mt-4 text-body-lg text-muted-foreground">{dict.subtitle}</p>
          <p className="mt-4 flex items-center gap-3 text-small"><span className={styles.number}>4</span>{dict.legend}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-8">
          <nav aria-label={dict.navigation}>
            <label htmlFor="guide-chapter" className="mb-2 block text-small font-medium lg:hidden">{dict.navigation}</label>
            <select id="guide-chapter" value={groupKey} onChange={(event) => selectGroup(event.target.value)} className="h-12 w-full rounded-lg border border-input bg-background px-3 text-body focus-visible:outline-ring lg:hidden">
              {fieldMap.map((group, index) => <option key={group.key} value={group.key}>{String(index + 1).padStart(2, "0")} · {groups[group.key]}</option>)}
            </select>
            <div className="hidden space-y-1 lg:block">
              {fieldMap.map((group, index) => (
                <button key={group.key} type="button" aria-pressed={groupKey === group.key} aria-controls={`guide-${group.key}`} onClick={() => selectGroup(group.key)} className={styles.chapter}>
                  <span className="text-caption tabular-nums text-primary">{String(index + 1).padStart(2, "0")}</span><span>{groups[group.key]}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="min-w-0">
            {fieldMap.map((group) => {
              const selected = group.form.markers.some((mark) => mark.number === active) ? active : group.form.markers[0].number;
              const preview = group.previews.find((shot) => shot.markers.some((mark) => mark.number === selected));
              const field = fields[String(selected)];
              const output = preview ?? group.previews[0];
              return (
                <article key={group.key} id={`guide-${group.key}`} hidden={group.key !== groupKey} aria-labelledby={`guide-title-${group.key}`}>
                  <h3 id={`guide-title-${group.key}`} className="text-h4 font-medium">{groups[group.key]}</h3>
                  <div className="mt-4 flex flex-wrap gap-2" aria-label={dict.chooseField}>
                    {group.form.markers.map((mark) => (
                      <button key={mark.number} type="button" onClick={() => setActive(mark.number)} aria-pressed={selected === mark.number} className={styles.field}>
                        <span className={styles.number}>{mark.number}</span>{fields[String(mark.number)].label}
                      </button>
                    ))}
                  </div>
                  <div className="my-6 flex gap-3 rounded-xl border border-border bg-card px-4 py-4" aria-live="polite" aria-atomic="true">
                    <Info aria-hidden className="mt-1 size-4 shrink-0 text-primary" />
                    <p className="text-small leading-relaxed"><strong className="font-medium">{field.label}. </strong><span className="text-muted-foreground">{field.body}</span></p>
                  </div>
                  <div className="grid min-w-0 items-start gap-5 md:grid-cols-2">
                    {[{ shot: group.form, title: dict.formLabel }, { shot: output, title: dict.cardLabel }].map(({ shot, title }, side) => (
                      <figure key={side} className="min-w-0">
                        <figcaption className="mb-3 flex items-center justify-between gap-3 text-small font-medium">
                          <span className="flex items-center gap-2">{side === 1 ? <><ArrowRight aria-hidden className="hidden size-4 text-primary md:block" /><ArrowDown aria-hidden className="size-4 text-primary md:hidden" /></> : null}{title}</span>
                          <button type="button" className={styles.zoom} onClick={() => setZoom({ shot, title: `${groups[group.key]} — ${title}` })} aria-label={`${dict.zoom}: ${groups[group.key]} — ${title}`}><Expand aria-hidden className="size-4" /><span>{dict.zoom}</span></button>
                        </figcaption>
                        {side === 1 && !preview ? <p className="mb-3 rounded-lg border border-dashed border-primary/40 p-3 text-small text-muted-foreground">{dict.noDirectPosition}</p> : null}
                        <AnnotatedImage shot={shot} active={selected} alt={`${groups[group.key]} — ${title}. ${dict.imageLanguage}`} />
                      </figure>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
        <p className="mt-8 text-caption leading-relaxed text-muted-foreground">{dict.exampleNote}</p>
      </div>
      <Dialog open={zoom !== null} onOpenChange={(open) => { if (!open) setZoom(null); }}>
        <DialogContent className={`${styles.root} w-[calc(100%-1rem)] max-w-5xl p-4 sm:p-6`}>
          <DialogTitle className="pr-10 text-body-lg">{zoom?.title}</DialogTitle>
          <p className="text-small text-muted-foreground">{dict.zoomHint}</p>
          <div className="mt-4 overflow-auto" tabIndex={0} role="region" aria-label={dict.zoom}>
            {zoom ? <div style={{ width: zoom.shot.width }} className="mx-auto"><AnnotatedImage shot={zoom.shot} active={active} alt={zoom.title} /></div> : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
