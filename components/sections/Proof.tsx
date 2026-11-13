import Image from "next/image";
import { Icon } from "@/components/Icon";
import { Placeholder } from "@/components/Placeholder";
import { audience, caseStudies, host } from "@/lib/content";

export function CaseStudies() {
  return (
    <section className="section section--paper" aria-labelledby="cases-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="kicker">Case studies</p>
          <h2 id="cases-title" className="display h2">
            {caseStudies.headline}
          </h2>
          <p className="section-head__lead">{caseStudies.intro}</p>
        </div>

        <article className="case-card reveal">
          <Placeholder label="[TEAM: CLIENT PHOTO]" icon="user" ratio="4 / 5" className="case-card__photo" />
          <div className="case-card__body">
            <p className="kicker">Featured case study</p>
            <p className="case-card__claim display">{caseStudies.claim}</p>
            <p className="team-note">{caseStudies.claimNote}</p>
            <dl className="case-meta">
              <div>
                <dt>Client</dt>
                <dd className="slot">[TEAM: CLIENT NAME]</dd>
              </div>
              <div>
                <dt>Business background</dt>
                <dd className="slot">[TEAM: BUSINESS BACKGROUND]</dd>
              </div>
              <div>
                <dt>Results</dt>
                <dd className="slot">[TEAM: VERIFIED RESULTS]</dd>
              </div>
            </dl>
            <blockquote className="slot slot--quote">[TEAM: SUPPORTING TESTIMONIAL FROM THE CLIENT]</blockquote>
          </div>
        </article>

        <div className="proof-grid reveal">
          <Placeholder label="[TEAM: PROOF SCREENSHOT 1]" ratio="4 / 5" />
          <Placeholder label="[TEAM: PROOF SCREENSHOT 2]" ratio="4 / 5" />
          <Placeholder label="[TEAM: PROOF SCREENSHOT 3]" ratio="4 / 5" />
        </div>

        <p className="team-note team-note--block">{caseStudies.teamNote}</p>
      </div>
    </section>
  );
}

export function Host() {
  return (
    <section className="section section--ivory" aria-labelledby="host-title">
      <div className="container host">
        <div className="host__media reveal">
          {host.photo ? (
            <Image
              src={host.photo}
              alt="Melroy, host of The High-Ticket Numerology Blueprint"
              width={800}
              height={1000}
              sizes="(min-width: 960px) 420px, 100vw"
              className="host__photo"
            />
          ) : (
            <Placeholder label={host.photoNote} icon="user" ratio="4 / 5" />
          )}
        </div>

        <div className="host__body reveal">
          <p className="kicker">Meet your host</p>
          <h2 id="host-title" className="display h2">
            {host.headline}
          </h2>
          <p className="host__role">{host.designation}</p>
          {host.bio.map((p) => (
            <p key={p} className="host__bio">
              {p}
            </p>
          ))}
          <div className="host__focus">
            <p className="host__focus-lead">{host.focusLead}</p>
            <p className="display">{host.focus}</p>
          </div>

          <ul className="highlights">
            {host.highlights.map((h) => (
              <li key={h.value}>
                <strong>{h.value}</strong>
                <span>{h.label}</span>
              </li>
            ))}
          </ul>
          <p className="team-note">{host.achievementsNote}</p>
        </div>
      </div>
    </section>
  );
}

export function Audience() {
  return (
    <section className="section section--paper" aria-labelledby="audience-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="kicker">Audience</p>
          <h2 id="audience-title" className="display h2">
            Who should attend?
          </h2>
        </div>
        <div className="audience">
          <div className="audience__card audience__card--yes reveal">
            <h3>{audience.forYou.title}</h3>
            <ul>
              {audience.forYou.points.map((p) => (
                <li key={p}>
                  <span className="audience__mark">
                    <Icon name="check" size={16} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="audience__card audience__card--no reveal">
            <h3>{audience.notForYou.title}</h3>
            <ul>
              {audience.notForYou.points.map((p) => (
                <li key={p}>
                  <span className="audience__mark">
                    <Icon name="x" size={16} />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
