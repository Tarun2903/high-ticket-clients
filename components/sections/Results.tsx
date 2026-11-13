import { ResultsGallery } from "@/components/results/ResultsGallery";
import { resultsSection } from "@/lib/results";

/** "Real clients. Real results." – case-study gallery with lightbox and a closing CTA. */
export function Results() {
  return (
    <section className="section section--ivory results" aria-labelledby="results-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="kicker">{resultsSection.kicker}</p>
          <h2 id="results-title" className="display h2 results__title">
            {resultsSection.headline}
          </h2>
          <p className="results__sub">{resultsSection.subheadline}</p>
          <p className="section-head__lead">{resultsSection.description}</p>
        </div>
        <ResultsGallery />
      </div>
    </section>
  );
}
