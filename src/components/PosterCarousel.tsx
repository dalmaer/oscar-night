import { useEffect, useRef, useState, useMemo } from 'react'
import { nominations } from '@/lib/nominations'

const POSTERS = [
  { src: '/movie-images/marty-supreme.jpg', title: 'Marty Supreme' },
  { src: '/movie-images/sinners.jpg', title: 'Sinners' },
  { src: '/movie-images/frankenstein.jpg', title: 'Frankenstein' },
  { src: '/movie-images/sentimental-value.jpg', title: 'Sentimental Value' },
  { src: '/movie-images/one-battle.jpg', title: 'One Battle after Another' },
  { src: '/movie-images/bugonia.jpg', title: 'Bugonia' },
  { src: '/movie-images/ugly-stepsister.jpg', title: 'The Ugly Stepsister' },
  { src: '/movie-images/blue-moon.jpg', title: 'Blue Moon' },
  { src: '/movie-images/hamnet.jpg', title: 'Hamnet' },
  { src: '/movie-images/smashing-machine.jpg', title: 'The Smashing Machine' },
  { src: '/movie-images/f1.jpg', title: 'F1' },
  { src: '/movie-images/avatar.jpg', title: 'Avatar: Fire and Ash' },
  { src: '/movie-images/elio.jpg', title: 'Elio' },
  { src: '/movie-images/zootopia-2.jpg', title: 'Zootopia 2' },
  { src: '/movie-images/song-sung-blue.jpg', title: 'Song Sung Blue' },
  { src: '/movie-images/train-dreams.jpg', title: 'Train Dreams' },
  { src: '/movie-images/secret-agent.jpg', title: 'The Secret Agent' },
  { src: '/movie-images/kick-you.jpg', title: 'If I Had Legs I\'d Kick You' },
]

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
              className="relative shrink-0 w-32 md:w-40 rounded-xl overflow-visible z-[6]"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className={`rounded-xl overflow-hidden shadow-lg border border-white/10 transition-all duration-300 ${hoveredIndex === i ? 'scale-105 brightness-110' : ''}`}>
                <img
                  src={poster.src}
                  alt={poster.title}
                  className="w-full h-auto brightness-75"
                  loading="lazy"
                />
              </div>

              {/* Nomination tooltip */}
              {hoveredIndex === i && cats.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-dark-darker/95 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl z-20 pointer-events-none">
                  <p className="text-gold text-xs font-black uppercase tracking-wider mb-2">{poster.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cats.map(cat => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-medium text-white/70"
                      >
                        <span className="material-symbols-outlined text-gold" style={{ fontSize: '10px' }}>emoji_events</span>
                        {cat}
                      </span>
                    ))}
                  </div>
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-dark-darker/95" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
