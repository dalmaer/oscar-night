import { useState, useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { nominations, getNomineeId, getNomineeDisplayName, getNomineeSecondaryInfo } from '@/lib/nominations'
import { getPosterForFilm } from '@/lib/posters'

interface VotingBallotProps {
  predictions: Record<string, string>
  onVote: (categoryId: string, nomineeId: string) => void
  disabled?: boolean
}

export default function VotingBallot({ predictions, onVote, disabled }: VotingBallotProps) {
  const completedCount = Object.keys(predictions).length
  const totalCategories = nominations.categories.length
  const percentComplete = Math.round((completedCount / totalCategories) * 100)
  const prevCountRef = useRef(completedCount)

  // Trigger confetti when ballot is completed
  useEffect(() => {
    const prevCount = prevCountRef.current
    prevCountRef.current = completedCount

    // Only fire when transitioning to complete (not on initial load if already complete)
    if (completedCount === totalCategories && prevCount === totalCategories - 1) {
      // Fire confetti from multiple angles for a big celebration
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        // Gold confetti from the left
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF']
        })

        // Gold confetti from the right
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      // Initial burst from center
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF', '#B8860B']
      })

      frame()
    }
  }, [completedCount, totalCategories])

  return (
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="sticky top-0 z-40 bg-dark-darker/80 backdrop-blur-md border-b border-white/10 -mx-6 px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest">Voting Status</h2>
            <p className="text-xl font-bold">{completedCount} / {totalCategories} <span className="text-sm font-medium text-white/40">Complete</span></p>
          </div>
          <span className="text-gold font-bold text-sm">{percentComplete}%</span>
        </div>
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full gold-gradient transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        {disabled && (
          <p className="mt-2 text-xs text-gold italic">Voting is closed. Predictions are locked.</p>
        )}
        {!disabled && completedCount === totalCategories && (
          <div className="mt-3 flex items-center gap-2 text-gold">
            <span className="material-symbols-outlined text-lg">celebration</span>
            <p className="text-sm font-bold">Ballot complete! You're ready for Oscar night.</p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="space-y-10">
        {nominations.categories.map((category) => {
          const categoryId = category.name
          const selectedNominee = predictions[categoryId]

          return (
            <CategorySection
              key={categoryId}
              category={category}
              selectedNominee={selectedNominee}
              onSelect={(nomineeId) => onVote(categoryId, nomineeId)}
              disabled={disabled}
            />
          )
        })}
      </div>
    </div>
  )
}

interface CategorySectionProps {
  category: { name: string; nominees: Record<string, string | undefined>[] }
  selectedNominee?: string
  onSelect: (nomineeId: string) => void
  disabled?: boolean
}

function CategorySection({ category, selectedNominee, onSelect, disabled }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(true)
  const [hoveredNominee, setHoveredNominee] = useState<string | null>(null)
  const isActingCategory = category.name.includes('Actor') || category.name.includes('Actress')
  const isBestPicture = category.name === 'Best Picture'

  return (
    <div id={category.name.toLowerCase().replace(/\s+/g, '-')}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between mb-4 group"
      >
        <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
          <span className="w-8 h-[2px] bg-gold" />
          {category.name}
          {selectedNominee && (
            <span className="material-symbols-outlined text-gold text-lg">check_circle</span>
          )}
        </h2>
        <span className={`material-symbols-outlined text-white/40 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {expanded && (
        <div className={`grid gap-3 ${
          isBestPicture || isActingCategory
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1 md:grid-cols-2'
        }`}>
          {category.nominees.map((nominee) => {
            const nomineeId = getNomineeId(category.name, nominee)
            const isSelected = selectedNominee === nomineeId
            const isHovered = hoveredNominee === nomineeId
            const displayName = getNomineeDisplayName(nominee)
            const secondaryInfo = getNomineeSecondaryInfo(nominee)
            const posterSrc = nominee.film ? getPosterForFilm(nominee.film) : undefined

            return (
              <button
                key={nomineeId}
                onClick={() => !disabled && onSelect(nomineeId)}
                onMouseEnter={() => setHoveredNominee(nomineeId)}
                onMouseLeave={() => setHoveredNominee(null)}
                disabled={disabled}
                className={`
                  relative text-left p-4 rounded-xl border transition-all overflow-hidden
                  ${isSelected
                    ? 'bg-gold/10 border-gold gold-glow'
                    : 'bg-primary/40 border-white/10 hover:border-gold/30'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
                `}
              >
                {/* Poster background on hover */}
                {posterSrc && isHovered && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ clipPath: 'polygon(40% 0, 100% 0, 100% 100%, 25% 100%)' }}
                  >
                    <img
                      src={posterSrc}
                      alt=""
                      className="absolute right-0 top-0 h-full w-auto object-cover brightness-[0.5]"
                    />
                  </div>
                )}

                <div className="relative flex items-center gap-4">
                  {/* Selection indicator */}
                  <div className={`
                    size-6 rounded-full border-2 flex items-center justify-center shrink-0
                    ${isSelected ? 'bg-gold border-gold' : 'border-white/20'}
                  `}>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-sm font-bold">check</span>
                    )}
                  </div>

                  {/* Nominee info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isSelected ? 'text-gold' : 'text-white'}`}>
                      {displayName}
                    </p>
                    {secondaryInfo && (
                      <p className="text-white/50 text-sm truncate">{secondaryInfo}</p>
                    )}
                  </div>

                  {/* Selected badge */}
                  {isSelected && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-gold bg-gold/20 px-2 py-1 rounded">
                      Your Pick
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
