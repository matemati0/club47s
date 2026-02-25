"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type ShowcaseSlide = {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  alt: string;
};

const slides: ShowcaseSlide[] = [
  {
    id: "viagra",
    title: "ויאגרה",
    subtitle: "פתרון קלאסי מהיר",
    src: "/landing/viagra-tablette.jpg",
    alt: "תמונת מוצר ויאגרה"
  },
  {
    id: "kamagra",
    title: "קאמגרה",
    subtitle: "ג׳לי ומדבקות",
    src: "/landing/kamagra-front100mg.jpg",
    alt: "תמונת מוצר קאמגרה"
  },
  {
    id: "cialis",
    title: "סיאליס",
    subtitle: "טווח פעולה ארוך",
    src: "/landing/cialis-5mg-uk.jpg",
    alt: "תמונת מוצר סיאליס"
  }
];

const ROTATION_INTERVAL_MS = 3600;
const ROTATION_STEP = 360 / slides.length;

export function Landing3DShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const refresh = () => {
      const reducedByWidget = document.documentElement.dataset.a11yReduceMotion === "true";
      setAutoRotate(!(media.matches || reducedByWidget));
    };

    refresh();

    const listener = () => refresh();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    } else if (typeof media.addListener === "function") {
      media.addListener(listener);
    }

    const observer = new MutationObserver(refresh);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-a11y-reduce-motion"]
    });

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(listener);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!autoRotate) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % slides.length);
    }, ROTATION_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRotate]);

  const trackTransform = useMemo(
    () =>
      `translateZ(calc(var(--landing-3d-depth) * -1)) rotateY(${activeIndex * -ROTATION_STEP}deg)`,
    [activeIndex]
  );

  return (
    <section className="club-card mt-8 p-4 sm:p-5">
      <p className="text-xs tracking-[0.16em] text-club-lightGray">גלריית מוצרים בתלת-ממד</p>

      <div className="landing-3d-stage mt-3" aria-live="polite">
        <div className="landing-3d-track" style={{ transform: trackTransform }}>
          {slides.map((slide, index) => (
            <figure
              key={slide.id}
              className="landing-3d-panel"
              style={{
                transform: `rotateY(${index * ROTATION_STEP}deg) translateZ(var(--landing-3d-depth))`
              }}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(max-width: 640px) 100vw, 60vw"
                className="object-cover"
              />
              <figcaption className="landing-3d-caption">
                <strong>{slide.title}</strong>
                <span>{slide.subtitle}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`הצגת תמונת ${slide.title}`}
            aria-pressed={activeIndex === index}
            className={`h-2.5 w-2.5 rounded-full border border-club-darkGray transition-all ${
              activeIndex === index ? "bg-club-white" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

