import { useEffect, useState } from "react";

/** Banner slides from backend/uploads — order and filenames as specified. */
const BANNER_SLIDES = [
  "/uploads/g1.png",
  "/uploads/g2.png",
  "/uploads/g3.png",
];

const INTERVAL_MS = 3000;

export default function LandingHeroBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % BANNER_SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const src = BANNER_SLIDES[index];

  return (
    <section className="landing-hero-banner" aria-label="City cleanliness highlights">
      <img
        src={src}
        alt=""
        className="landing-hero-banner__img"
        decoding="async"
        fetchPriority="high"
      />
    </section>
  );
}
