import { Icon } from "@/components/Icon";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { hero } from "@/lib/content";
import { workshop } from "@/lib/workshop";

export function TopBar() {
  return (
    <header className="topbar">
      <div className="container topbar__inner">
        <span className="wordmark">
          The High-Ticket <em>Numerology</em> Blueprint
        </span>
        <span className="topbar__host">with {workshop.host}</span>
      </div>
    </header>
  );
}

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <GrowthBackdrop />
      <div className="container hero__grid">
        <div className="hero__copy">
          <p className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            {hero.eyebrow[0]}
            <span className="eyebrow__sep" aria-hidden="true">
              |
            </span>
            {hero.eyebrow[1]}
          </p>
          <h1 id="hero-title" className="display hero__title">
            {hero.headlineLead} <span className="accent">{hero.headlineAccent}</span>
          </h1>
          <p className="hero__lead">{hero.lead}</p>

          <div className="hero__offer">
            <p className="price-pill">
              <span className="price-pill__kicker">{hero.priceKicker}</span>
              <span className="price-pill__value">{hero.priceText}</span>
            </p>
            <RegisterButton size="lg" block />
            <p className="hero__reassure">
              <Icon name="check" size={16} />
              {hero.reassurance}
            </p>
          </div>
        </div>

        <div className="hero__panel">
          <div className="pass">
            <div className="pass__head">
              <span>Workshop pass</span>
              <span className="pass__live">
                <span className="live-dot" aria-hidden="true" /> Live · {workshop.durationMinutes} min
              </span>
            </div>
            <p className="pass__statement">{hero.secondary[0]}</p>
            <p className="pass__sub">{hero.secondary[1]}</p>
            <ul className="benefit-list">
              {hero.benefits.map((b) => (
                <li key={b.text}>
                  <span className="benefit-list__icon">
                    <Icon name={b.icon} size={18} />
                  </span>
                  {b.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Decorative rising-growth lines. Pure SVG, no image request. */
function GrowthBackdrop() {
  return (
    <svg className="hero__backdrop" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="hb-line" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#d6b46a" stopOpacity="0" />
          <stop offset="1" stopColor="#d6b46a" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#hb-line)" strokeWidth="1.5">
        <path d="M0 520 C 220 500, 330 470, 480 420 S 760 300, 900 230 S 1100 110, 1200 60" />
        <path d="M0 560 C 260 540, 380 520, 540 470 S 800 360, 960 290 S 1120 190, 1200 150" opacity="0.6" />
      </g>
      <g fill="#d6b46a" opacity="0.08">
        <rect x="760" y="380" width="44" height="220" rx="4" />
        <rect x="830" y="320" width="44" height="280" rx="4" />
        <rect x="900" y="250" width="44" height="350" rx="4" />
        <rect x="970" y="180" width="44" height="420" rx="4" />
        <rect x="1040" y="110" width="44" height="490" rx="4" />
      </g>
    </svg>
  );
}
