import { useEffect, useRef, useState } from 'react'

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
        // Reset to start when we've scrolled through the first set
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
      onMouseLeave={() => setPaused(false)}
    >
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-hidden py-4"
      >
        {allPosters.map((poster, i) => (
          <div
            key={i}
            className="shrink-0 w-32 md:w-40 rounded-xl overflow-hidden shadow-lg border border-white/10 transition-transform duration-300 hover:scale-105"
          >
            <img
              src={poster.src}
              alt={poster.title}
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
