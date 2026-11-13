import { priceLabel, workshop } from "@/lib/workshop";
import { RegisterButton } from "./RegisterButton";

/** Always-visible registration bar. Page bottom padding (--cta-bar-h) keeps content clear of it. */
export function FloatingCta() {
  return (
    <div className="cta-bar" role="region" aria-label="Register for the workshop">
      <div className="cta-bar__inner">
        <p className="cta-bar__info">
          <span className="live-dot" aria-hidden="true" />
          <span>
            <strong>Live workshop</strong> · {workshop.durationMinutes} min · {workshop.day} {workshop.time}
          </span>
          <span className="cta-bar__price">
            Only <strong>{priceLabel}</strong>
          </span>
        </p>
        <RegisterButton block className="cta-bar__btn" />
      </div>
    </div>
  );
}
