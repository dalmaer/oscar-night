import { useEffect, useRef, useState, useMemo } from 'react'
import { nominations } from '@/lib/nominations'
import { getPosterForFilm } from '@/lib/posters'

// Build poster list from all films that have poster images
const POSTERS = (() => {
  const seen = new Set<string>()
  const posters: { src: string; title: string }[] = []
  for (const cat of nominations.categories) {
    for (const nom of cat.nominees) {
      const film = nom.film
      if (!film || seen.has(film)) continue
      const src = getPosterForFilm(film)
      if (src) {
        seen.add(film)
        posters.push({ src, title: film })
      }
    }
  }
  return posters
})()

export default function PosterCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Build a map of film title → nominated categories
  const filmCategories = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const cat of nominations.categories) {
      for (const nom of cat.nominees) {
        const film = nom.film
        if (!film) continue
        if (!map[film]) map[film] = []
        if (!map[film].includes(cat.name)) {
          map[film].push(cat.name)
        }
      }
    }
    return map
  }, [])

  // Duplicate posters for seamless looping
  const allPosters = [...POSTERS, ...POSTERS]

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let animationId: number
    const speed = 0.5 // pixels per frame

    const scroll = () => {
      if (!paused) {
        el.scrollLeft += speed
        const halfWidth = el.scrollWidth / 2
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth
        }
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationId)
  }, [paused])

  return (
    <div
      className="relative w-full max-w-5xl mx-auto overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { setPaused(false); setHoveredIndex(null) }}
    >
      {/* Left fade + blur */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none backdrop-blur-sm" style={{ maskImage: 'linear-gradient(to right, black 40%, transparent)' }} />
      {/* Right fade + blur */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none backdrop-blur-sm" style={{ maskImage: 'linear-gradient(to left, black 40%, transparent)' }} />
      {/* Subtle overlay across all posters */}
      <div className="absolute inset-0 bg-primary/30 z-[5] pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-hidden py-4"
      >
        {allPosters.map((poster, i) => {
          const cats = filmCategories[poster.title] || []
          return (
            <div
              key={i}
              className="relative shrink-0 w-32 md:w-40 rounded-xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 z-[6] hover:scale-105"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <img
                src={poster.src}
                alt={poster.title}
                className={`w-full h-auto transition-all duration-300 ${hoveredIndex === i ? 'brightness-[0.3] scale-105' : 'brightness-75'}`}
                loading="lazy"
              />

              {/* Nomination overlay */}
              {hoveredIndex === i && cats.length > 0 && (
                <div className="absolute inset-0 flex flex-col justify-end p-3 pointer-events-none">
                  <p className="text-gold text-[11px] font-black uppercase tracking-wider mb-1.5 drop-shadow-lg">{poster.title}</p>
                  <div className="flex flex-wrap gap-1">
                    {cats.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] font-medium text-white/90"
                      >
                        <span className="material-symbols-outlined text-gold" style={{ fontSize: '9px' }}>emoji_events</span>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
