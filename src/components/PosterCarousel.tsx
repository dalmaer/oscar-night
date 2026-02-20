import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Animation & drag refs (no re-renders needed)
  const offsetRef = useRef(0)
  const isPausedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const dragStartX = useRef(0)
  const dragStartOffset = useRef(0)
  const hasDragged = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Measure half-width of the track (one full set of posters)
  const getHalfWidth = useCallback(() => {
    const track = trackRef.current
    if (!track) return 0
    return track.scrollWidth / 2
  }, [])

  // Wrap offset to keep it within one poster set width
  const wrapOffset = useCallback(() => {
    const halfWidth = getHalfWidth()
    if (halfWidth === 0) return
    while (offsetRef.current > 0) offsetRef.current -= halfWidth
    while (offsetRef.current < -halfWidth) offsetRef.current += halfWidth
  }, [getHalfWidth])

  useEffect(() => {
    const container = containerRef.current
    const track = trackRef.current
    if (!container || !track) return

    const speed = 0.5
    let animId: number

    const animate = () => {
      if (!isPausedRef.current && !isDraggingRef.current) {
        offsetRef.current -= speed
        wrapOffset()
      }
      track.style.transform = `translateX(${offsetRef.current}px)`
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)

    // Resume auto-scroll after 2s of no interaction
    const scheduleResume = () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      isPausedRef.current = true
      resumeTimerRef.current = setTimeout(() => {
        isPausedRef.current = false
      }, 2000)
    }

    // --- Touch handlers ---
    const onTouchStart = (e: TouchEvent) => {
      isDraggingRef.current = true
      hasDragged.current = false
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      dragStartX.current = e.touches[0].clientX
      dragStartOffset.current = offsetRef.current
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.touches[0].clientX - dragStartX.current
      if (Math.abs(dx) > 5) hasDragged.current = true
      offsetRef.current = dragStartOffset.current + dx
      wrapOffset()
    }

    const onTouchEnd = () => {
      isDraggingRef.current = false
      scheduleResume()
    }

    // --- Mouse handlers ---
    const onMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      hasDragged.current = false
      dragStartX.current = e.clientX
      dragStartOffset.current = offsetRef.current
      e.preventDefault() // prevent text selection
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - dragStartX.current
      if (Math.abs(dx) > 5) hasDragged.current = true
      offsetRef.current = dragStartOffset.current + dx
      wrapOffset()
    }

    const onMouseUp = () => {
      isDraggingRef.current = false
    }

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      cancelAnimationFrame(animId)
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [wrapOffset])

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto overflow-hidden select-none"
      onMouseEnter={() => { isPausedRef.current = true }}
      onMouseLeave={() => { isPausedRef.current = false; isDraggingRef.current = false; setHoveredIndex(null) }}
    >
      {/* Left fade + blur */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none backdrop-blur-sm" style={{ maskImage: 'linear-gradient(to right, black 40%, transparent)' }} />
      {/* Right fade + blur */}
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none backdrop-blur-sm" style={{ maskImage: 'linear-gradient(to left, black 40%, transparent)' }} />
      {/* Subtle overlay across all posters */}
      <div className="absolute inset-0 bg-primary/30 z-[5] pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-4 py-4"
        style={{ willChange: 'transform' }}
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
                draggable={false}
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
