import Image from "next/image";
import { videoSection, videoTestimonials } from "@/lib/videos";

/** "Student Success Stories" – three YouTube Shorts as thumbnail cards. Each opens its Short in a new tab. */
export function VideoTestimonials() {
  return (
    <section className="section section--paper videos" aria-labelledby="videos-title">
      <div className="container">
        <div className="section-head section-head--center reveal">
          <h2 id="videos-title" className="display h2">
            {videoSection.headline}
          </h2>
          <p className="section-head__lead">{videoSection.description}</p>
        </div>

        <ul className="videos__list reveal">
          {videoTestimonials.map((v, i) => (
            <li key={v.id} className="videos__item">
              <a
                className="video-card"
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Watch student video testimonial ${i + 1} on YouTube (opens in a new tab)`}
              >
                <span className="video-card__thumb">
                  <Image
                    src={v.thumbnail}
                    alt=""
                    width={478}
                    height={850}
                    sizes="(min-width: 760px) 360px, 72vw"
                    className="video-card__img"
                  />
                  <span className="video-card__play" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5Z" />
                    </svg>
                  </span>
                </span>
                <span className="video-card__label">{videoSection.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
