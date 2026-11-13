import Link from "next/link";
import { Icon } from "@/components/Icon";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { details, faqs, finalCta } from "@/lib/content";
import { workshop } from "@/lib/workshop";

export function WorkshopDetails() {
  return (
    <section className="section section--ivory" aria-labelledby="details-title">
      <div className="container details">
        <div className="details__lead reveal">
          <p className="kicker">Workshop details</p>
          <h2 id="details-title" className="display h2">
            {details.headline}
          </h2>
          <p className="section-head__lead">{details.note}</p>
        </div>

        <div className="ticket reveal">
          <div className="ticket__head">
            <span className="ticket__badge">
              <span className="live-dot" aria-hidden="true" /> Live
            </span>
            <p className="ticket__name">{details.workshopLabel}</p>
            <p className="ticket__host">with {workshop.host}</p>
          </div>
          <dl className="ticket__rows">
            {details.rows.map((r) => (
              <div key={r.label} className={r.label === "Workshop access" ? "ticket__row ticket__row--price" : "ticket__row"}>
                <dt>
                  <Icon name={r.icon} size={18} />
                  {r.label}
                </dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <div className="ticket__foot">
            <RegisterButton size="lg" block />
            <p className="ticket__note">
              <Icon name="message" size={14} /> Live workshop access + WhatsApp group for session updates
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="section section--paper" aria-labelledby="faq-title">
      <div className="container container--narrow">
        <div className="section-head section-head--center reveal">
          <p className="kicker">FAQ</p>
          <h2 id="faq-title" className="display h2">
            Frequently asked questions
          </h2>
        </div>
        <div className="faq">
          {faqs.map((f, i) => (
            <details key={f.q} name="faq" className="faq__item" open={i === 0}>
              <summary>
                <span>{f.q}</span>
                <span className="faq__icon" aria-hidden="true">
                  <Icon name="plus" size={18} />
                </span>
              </summary>
              <div className="faq__answer">
                <p>{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section section--dark final" aria-labelledby="final-title">
      <div className="final__glow" aria-hidden="true" />
      <div className="container container--narrow final__inner reveal">
        <h2 id="final-title" className="display h2 final__title">
          {finalCta.headline}
        </h2>
        {finalCta.body.map((p) => (
          <p key={p} className="final__body">
            {p}
          </p>
        ))}
        <ul className="final__badges">
          {finalCta.badges.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <RegisterButton size="lg" />
        <p className="final__closing display">{finalCta.closing}</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {new Date().getFullYear()} {workshop.name}
        </p>
        <nav aria-label="Legal" className="footer__links">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Refunds</Link>
          <Link href="/contact">Contact</Link>
        </nav>
      </div>
      <p className="container footer__disclaimer">
        This site is not a part of the Facebook website or Meta Platforms, Inc. Additionally, this site is not endorsed
        by Facebook in any way. FACEBOOK is a trademark of Meta Platforms, Inc. Results vary; no specific client or
        revenue outcome is guaranteed.
      </p>
    </footer>
  );
}
