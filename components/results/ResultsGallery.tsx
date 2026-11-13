"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { useRegistration } from "@/components/registration/RegistrationProvider";
import { caseStudies, metricRows, resultsSection, type CaseStudy } from "@/lib/results";

/** Three case-study cards, a lightbox for the original screenshots, and the closing CTA. */
export function ResultsGallery() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<CaseStudy | null>(null);
  const { openRegistration } = useRegistration();

  function openLightbox(study: CaseStudy) {
    setActive(study);
    dialogRef.current?.showModal(); // native modal: Escape closes it, focus is trapped, page stays underneath
  }

  return (
    <>
      <div className="results__grid">
        {caseStudies.map((study, i) => (
          <article key={study.id} className="result-card reveal">
            <p className="result-card__tag">{study.category}</p>

            <button
              type="button"
              className="result-card__shot"
              onClick={() => openLightbox(study)}
              aria-haspopup="dialog"
              aria-label={`View the full ${study.category.toLowerCase()} results screenshot`}
            >
              {/* Plain <img>: the files are served as-is from /public so every figure stays pixel-exact and readable. */}
              <img
                src={study.image}
                alt={study.alt}
                width={study.width}
                height={study.height}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              <span className="result-card__zoom" aria-hidden="true">
                View full image
              </span>
            </button>

            <table className="result-table">
              <caption className="results__sr">{study.category} results</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="results__sr">Metric</span>
                  </th>
                  {study.stages.map((s) => (
                    <th key={s.label} scope="col">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricRows.map((row) => (
                  <tr key={row.key} className={row.highlight ? "is-highlight" : undefined}>
                    <th scope="row">{row.label}</th>
                    {study.stages.map((s) => (
                      <td key={s.label}>{s[row.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        ))}
      </div>

      <div className="results__cta reveal">
        <h3 className="display results__cta-title">{resultsSection.closing.headline}</h3>
        <p className="results__cta-body">{resultsSection.closing.body}</p>
        {/* Same registration/payment flow as every other CTA – no separate checkout. */}
        <button type="button" className="btn-cta btn-cta--lg" onClick={openRegistration} aria-haspopup="dialog">
          <span>{resultsSection.closing.cta}</span>
          <Icon name="arrowRight" size={20} className="btn-cta__icon" />
        </button>
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={active ? `${active.category} results – full image` : "Results image"}
        onClose={() => setActive(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close(); // click on the dark backdrop
        }}
      >
        <form method="dialog">
          <button className="lightbox__close" aria-label="Close image">
            <Icon name="x" size={22} />
          </button>
        </form>
        {active && (
          <div className="lightbox__scroll" onClick={(e) => e.target === e.currentTarget && dialogRef.current?.close()}>
            <img className="lightbox__img" src={active.image} alt={active.alt} decoding="async" />
          </div>
        )}
      </dialog>
    </>
  );
}
