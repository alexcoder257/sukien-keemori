"use client";

import { useState } from "react";
import {
  OPENING_FONTS,
  OPENING_FONT_COMBOS,
  OPENING_TEXT_REGIONS,
} from "@/components/invitation/shared/opening-typography";
import type {
  OpeningFontCombo,
  OpeningTypography,
} from "@/components/invitation/shared/opening-typography";
import { Check, Copy, RotateCcw } from "lucide-react";
import { WeddingOpening } from "@/components/invitation/shared/wedding-opening";
import { OpeningCover } from "@/components/invitation/shared/wedding-opening/opening-cover";
import {
  OPENING_DECOR,
  OPENING_MOTIFS,
  OPENING_PALETTES,
  OPENING_VARIANTS,
} from "@/components/invitation/shared/opening-presets";
import type {
  OpeningConcept,
  OpeningDecor,
  OpeningMotif,
  OpeningPalette,
  OpeningVariant,
} from "@/components/invitation/shared/opening-presets";
import type { Dictionary } from "@/i18n/dictionaries";
import styles from "@/components/invitation/opening-playground.module.css";

export function OpeningPlayground({ dict }: { dict: Dictionary["openingLab"] }) {
  const [variant, setVariant] = useState<OpeningVariant>("ceremony-classic");
  const [colors, setColors] = useState<OpeningPalette>({
    ...OPENING_PALETTES.ceremony,
  });
  const [decorByConcept, setDecorByConcept] =
    useState<Record<OpeningConcept, OpeningDecor>>(OPENING_DECOR);
  const [typography, setTypography] = useState<OpeningTypography>({});
  const [coupleNames, setCoupleNames] = useState<[string, string]>([
    dict.sample.firstName,
    dict.sample.secondName,
  ]);
  const [dateLabel, setDateLabel] = useState("25.10.2026");
  const [replay, setReplay] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "success" | "error">("idle");
  const [mobile, setMobile] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const selected = OPENING_VARIANTS.find((item) => item.id === variant)!;
  const code = JSON.stringify(
    {
      variant,
      data: { coupleNames, dateLabel, labels: dict.labels },
      colors,
      typography,
      decor: decorByConcept[selected.concept],
    },
    null,
    2,
  );

  function selectVariant(next: OpeningVariant) {
    const nextConcept = OPENING_VARIANTS.find((item) => item.id === next)!.concept;
    setVariant(next);
    if (selected.concept !== nextConcept) setColors({ ...OPENING_PALETTES[nextConcept] });
    setReplay((value) => value + 1);
    setCopyState("idle");
  }

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <p className={styles.kicker}>{dict.kicker}</p>
        <h1>{dict.title}</h1>
        <p>{dict.description}</p>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.controls} aria-label={dict.settings}>
          <section>
            <h2 className={styles.sectionTitle}>
              01 <span>{dict.variantsTitle}</span>
            </h2>
            {(["ceremony", "envelope", "linen"] as const).map((concept) => (
              <fieldset className={styles.group} key={concept}>
                <legend>{dict.concepts[concept]}</legend>
                <div className={styles.variants}>
                  {OPENING_VARIANTS.filter((item) => item.concept === concept).map((item) => (
                    <div key={item.id} className={styles.variant}>
                      <span className={styles.thumbnail} aria-hidden="true" inert>
                        <span className={styles.miniature}>
                          <OpeningCover
                            variant={item.id}
                            data={{ coupleNames, dateLabel, labels: dict.labels }}
                            colors={OPENING_PALETTES[concept]}
                            typography={typography}
                            decor={decorByConcept[concept]}
                            isOpening={false}
                            onOpen={() => {}}
                          />
                        </span>
                      </span>
                      <button
                        type="button"
                        className={styles.variantLabel}
                        aria-pressed={variant === item.id}
                        onClick={() => selectVariant(item.id)}
                      >
                        {dict.variants[item.id]}
                        {variant === item.id && <Check size={14} aria-hidden="true" />}
                      </button>
                    </div>
                  ))}
                </div>
              </fieldset>
            ))}
          </section>
          <section>
            <div className={styles.sectionHeading}>
              <h2 className={styles.sectionTitle}>
                02 <span>{dict.colorsTitle}</span>
              </h2>
              <button
                className={styles.reset}
                type="button"
                onClick={() => setColors({ ...OPENING_PALETTES[selected.concept] })}
              >
                {dict.reset}
              </button>
            </div>
            <div className={styles.colors}>
              {(Object.keys(colors) as (keyof OpeningPalette)[]).map((role) => (
                <label className={styles.color} key={role}>
                  <input
                    type="color"
                    value={colors[role]}
                    onChange={(event) => {
                      setColors({ ...colors, [role]: event.target.value });
                      setCopyState("idle");
                    }}
                  />
                  <span>
                    {dict.colors[role]}
                    <small>{colors[role]}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
          <section>
            <h2 className={styles.sectionTitle}>
              03 <span>{dict.decorTitle}</span>
            </h2>
            <div className={styles.fields}>
              {(["corner", "divider", "ambient"] as const).map((slot) => (
                <label key={slot}>
                  {dict.decorSlots[slot]}
                  <select
                    aria-label={dict.decorSlots[slot]}
                    value={decorByConcept[selected.concept][slot]}
                    onChange={(event) => {
                      setDecorByConcept({
                        ...decorByConcept,
                        [selected.concept]: {
                          ...decorByConcept[selected.concept],
                          [slot]: event.target.value as OpeningMotif,
                        },
                      });
                      setCopyState("idle");
                    }}
                  >
                    {OPENING_MOTIFS.map((motif) => (
                      <option value={motif} key={motif}>
                        {dict.motifs[motif]}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </section>
          <section>
            <h2 className={styles.sectionTitle}>
              04 <span>{dict.typographyTitle}</span>
            </h2>
            <div className={styles.fields}>
              <label className={styles.fullField}>
                {dict.fontCombo}
                <select
                  aria-label={dict.fontCombo}
                  value={typography.combo ?? ""}
                  onChange={(event) => {
                    setTypography({
                      ...typography,
                      combo: (event.target.value || undefined) as OpeningFontCombo | undefined,
                    });
                    setCopyState("idle");
                  }}
                >
                  <option value="">{dict.inheritFonts}</option>
                  {(Object.keys(OPENING_FONT_COMBOS) as OpeningFontCombo[]).map((combo) => (
                    <option key={combo} value={combo}>
                      {dict.fontCombos[combo]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <details className={styles.fontDetails}>
              <summary>{dict.regionFonts}</summary>
              <p>{dict.regionFontsHint}</p>
              <button
                type="button"
                className={styles.reset}
                onClick={() => {
                  setTypography({ combo: typography.combo });
                  setCopyState("idle");
                }}
              >
                {dict.clearRegionFonts}
              </button>
              <datalist id="opening-font-options">
                {Object.entries(OPENING_FONTS).map(([id, font]) => (
                  <option key={id} value={id}>
                    {font.label}
                  </option>
                ))}
              </datalist>
              <div className={styles.fields}>
                {OPENING_TEXT_REGIONS.map((region) => (
                  <label key={region}>
                    {dict.textRegions[region]}
                    <input
                      list="opening-font-options"
                      value={typography.regions?.[region] ?? ""}
                      placeholder={dict.inheritRegionFont}
                      onChange={(event) => {
                        const regions = { ...typography.regions };
                        if (event.target.value) regions[region] = event.target.value;
                        else delete regions[region];
                        setTypography({ ...typography, regions });
                        setCopyState("idle");
                      }}
                    />
                  </label>
                ))}
              </div>
            </details>
          </section>
          <section>
            <h2 className={styles.sectionTitle}>
              05 <span>{dict.contentTitle}</span>
            </h2>
            <div className={styles.fields}>
              <label>
                {dict.firstName}
                <input
                  value={coupleNames[0]}
                  onChange={(event) => setCoupleNames([event.target.value, coupleNames[1]])}
                />
              </label>
              <label>
                {dict.secondName}
                <input
                  value={coupleNames[1]}
                  onChange={(event) => setCoupleNames([coupleNames[0], event.target.value])}
                />
              </label>
              <label>
                {dict.date}
                <input value={dateLabel} onChange={(event) => setDateLabel(event.target.value)} />
              </label>
            </div>
          </section>
        </aside>
        <section className={styles.previewPanel} aria-label={dict.preview}>
          <div className={styles.toolbar}>
            <span>{dict.variants[variant]}</span>
            <div>
              <button type="button" aria-pressed={mobile} onClick={() => setMobile(!mobile)}>
                {mobile ? dict.mobile : dict.desktop}
              </button>
              <button type="button" onClick={() => setReplay((value) => value + 1)}>
                <RotateCcw size={16} aria-hidden="true" />
                {dict.replay}
              </button>
            </div>
          </div>
          <div className={styles.previewBackdrop}>
            <div className={`${styles.preview} ${mobile ? styles.mobile : ""}`}>
              <WeddingOpening
                key={`${variant}-${replay}-${enabled}`}
                enabled={enabled}
                durationMs={1100}
                motion={selected.motion}
                contained
                coverClassName={styles.cover}
                variant={variant}
                data={{ coupleNames, dateLabel, labels: dict.labels }}
                colors={colors}
                typography={typography}
                decor={decorByConcept[selected.concept]}
              >
                <div className={styles.revealed} tabIndex={-1} data-opening-focus>
                  <p>{dict.labels.invitation}</p>
                  <h2>{coupleNames.join(" & ")}</h2>
                  <p>{dateLabel}</p>
                  <p>{dict.revealed}</p>
                  <button type="button" onClick={() => setReplay((value) => value + 1)}>
                    {dict.replay}
                  </button>
                </div>
              </WeddingOpening>
            </div>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {dict.enabled}
          </label>
          <details className={styles.export}>
            <summary>{dict.exportTitle}</summary>
            <p>{dict.exportDescription}</p>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopyState("success");
                } catch {
                  setCopyState("error");
                }
              }}
            >
              <Copy size={16} aria-hidden="true" />
              {dict.copy}
            </button>
            <span role="status">
              {copyState === "success" ? dict.copied : copyState === "error" ? dict.copyError : ""}
            </span>
            <pre tabIndex={0}>{code}</pre>
          </details>
        </section>
      </div>
    </main>
  );
}
