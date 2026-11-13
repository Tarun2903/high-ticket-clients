import { Fragment } from "react";
import { Icon } from "@/components/Icon";
import { bigPicture, modules, problem, shift } from "@/lib/content";

export function Problem() {
  return (
    <section className="section section--paper" aria-labelledby="problem-title">
      <div className="container">
        <div className="section-head reveal">
          <p className="kicker">The real problem</p>
          <h2 id="problem-title" className="display h2">
            {problem.headline}
          </h2>
          {problem.intro.map((p) => (
            <p key={p} className="section-head__lead">
              {p}
            </p>
          ))}
        </div>

        <ul className="challenge-grid">
          {problem.challenges.map((c) => (
            <li key={c.text} className="challenge reveal">
              <span className="challenge__icon">
                <Icon name={c.icon} size={20} />
              </span>
              <p>{c.text}</p>
            </li>
          ))}
        </ul>

        <p className="callout reveal">{problem.closing}</p>
      </div>
    </section>
  );
}

export function Shift() {
  return (
    <section className="section section--ivory" aria-labelledby="shift-title">
      <div className="container split">
        <div className="split__lead reveal">
          <p className="kicker">The big shift</p>
          <h2 id="shift-title" className="display h2">
            {shift.headline}
          </h2>
          <div className="emphasis">
            <p className="emphasis__lead">{shift.emphasisLead}</p>
            <p className="emphasis__body">
              You need{" "}
              {shift.emphasis.map((item, i) => (
                <Fragment key={item}>
                  <mark>{item}</mark>
                  {i < shift.emphasis.length - 2 ? ", " : i === shift.emphasis.length - 2 ? " and " : "."}
                </Fragment>
              ))}
            </p>
          </div>
        </div>

        <div className="imagine reveal">
          <p className="imagine__intro">{shift.intro}</p>
          <ul className="check-list">
            {shift.points.map((p) => (
              <li key={p}>
                <span className="check-list__mark">
                  <Icon name="check" size={16} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function Modules() {
  return (
    <section className="section section--paper" aria-labelledby="modules-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="kicker">What you&apos;ll learn</p>
          <h2 id="modules-title" className="display h2">
            {modules.headline}
          </h2>
          <p className="section-head__lead">{modules.intro}</p>
        </div>

        <ol className="module-grid">
          {modules.items.map((m) => (
            <li key={m.number} className="module reveal">
              <div className="module__top">
                <span className="module__label">MODULE {m.number}</span>
                <span className="module__icon">
                  <Icon name={m.icon} size={22} />
                </span>
              </div>
              <h3 className="module__title">{m.title}</h3>
              <p className="module__body">{m.body}</p>
              <ul className="module__points">
                {m.points.map((p) => (
                  <li key={p}>
                    <Icon name="check" size={16} />
                    {p}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function BigPicture() {
  return (
    <section className="section section--dark big-picture" aria-labelledby="bp-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <p className="kicker kicker--gold">The big picture</p>
          <h2 id="bp-title" className="display h2">
            {bigPicture.headline}
          </h2>
          <p className="section-head__lead">{bigPicture.body[0]}</p>
        </div>

        <div className="compare reveal">
          <div className="compare__side compare__side--from">
            <span className="compare__tag">Today</span>
            <p>{bigPicture.comparison.from}</p>
          </div>
          <span className="compare__arrow" aria-hidden="true">
            <Icon name="arrowRight" size={22} />
          </span>
          <div className="compare__side compare__side--to">
            <span className="compare__tag">The opportunity</span>
            <p>{bigPicture.comparison.to}</p>
          </div>
        </div>

        <div className="bp-text reveal">
          <p>{bigPicture.body[1]}</p>
          <p className="bp-text__punch display">{bigPicture.punchline}</p>
        </div>

        <ol className="sequence" aria-label="The premium business model">
          {bigPicture.sequence.map((step, i) => (
            <li key={step} className="sequence__step reveal">
              <span className="sequence__num">{String(i + 1).padStart(2, "0")}</span>
              <span className="sequence__label">{step}</span>
              {i < bigPicture.sequence.length - 1 && (
                <span className="sequence__arrow" aria-hidden="true">
                  <Icon name="arrowRight" size={18} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
