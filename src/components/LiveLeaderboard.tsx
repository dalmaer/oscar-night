import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'
import { nominations, getNomineeId, getNomineeDisplayName } from '@/lib/nominations'

interface Participant {
  id: string
  name: string
  predictionsCount: number
  score?: number
}

interface Prediction {
  participant_id: string
  category_id: string
  nominee_id: string
}

interface LiveLeaderboardProps {
  participants: Participant[]
  allPredictions: Prediction[]
  myPredictions: Record<string, string>
  myParticipantId?: string
  winners?: Record<string, string>
  currentCategory?: string
  isHost?: boolean
  onDeclareWinner?: (categoryId: string, nomineeId: string) => void
  onSetCurrentCategory?: (categoryId: string) => void
  onEndCeremony?: () => void
}

export default function LiveLeaderboard({
  participants,
  allPredictions,
  myPredictions,
  myParticipantId,
  winners = {},
  currentCategory,
  isHost,
  onDeclareWinner,
  onSetCurrentCategory,
  onEndCeremony
}: LiveLeaderboardProps) {
  const announcedCount = Object.keys(winners).length
  const totalCategories = nominations.categories.length
  const allComplete = announcedCount >= totalCategories
  const prevAnnouncedRef = useRef(announcedCount)

  // Sort participants by score
  const sortedParticipants = [...participants].sort((a, b) =>
    (b.score || 0) - (a.score || 0)
  )

  // Find current user's rank and stats
  const myRank = sortedParticipants.findIndex(p => p.id === myParticipantId) + 1
  const myStats = participants.find(p => p.id === myParticipantId)
  const myCorrectCount = myStats?.score || 0

  // Get current category data
  const currentCategoryData = currentCategory
    ? nominations.categories.find(c => c.name === currentCategory)
    : nominations.categories[announcedCount] // Default to next unannounced

  const currentCategoryIndex = currentCategoryData
    ? nominations.categories.indexOf(currentCategoryData)
    : announcedCount

  const canGoPrev = currentCategoryIndex > 0
  const canGoNext = currentCategoryIndex < totalCategories - 1

  const handlePrevCategory = () => {
    if (!canGoPrev) return
    onSetCurrentCategory?.(nominations.categories[currentCategoryIndex - 1].name)
  }

  const handleNextCategory = () => {
    if (!canGoNext) return
    onSetCurrentCategory?.(nominations.categories[currentCategoryIndex + 1].name)
  }

  // Get predictions for current category
  const currentCategoryName = currentCategoryData?.name || ''
  const categoryPredictions = allPredictions.filter(p => p.category_id === currentCategoryName)

  // Get my prediction for current category
  const myCurrentPrediction = myPredictions[currentCategoryName]
  const myCurrentNominee = currentCategoryData?.nominees.find(n =>
    getNomineeId(currentCategoryName, n) === myCurrentPrediction
  )
  const currentWinner = winners[currentCategoryName]
  const didIGetItRight = currentWinner && myCurrentPrediction === currentWinner

  // Count votes per nominee and get voter names
  const getVoteInfo = (nomineeId: string) => {
    const votes = categoryPredictions.filter(p => p.nominee_id === nomineeId)
    const voters = votes.map(v => {
      const participant = participants.find(p => p.id === v.participant_id)
      return participant?.name || 'Unknown'
    })
    return { count: votes.length, voters }
  }

  // Confetti when all awards are announced
  useEffect(() => {
    const prev = prevAnnouncedRef.current
    prevAnnouncedRef.current = announcedCount

    if (announcedCount >= totalCategories && prev < totalCategories) {
      const duration = 4000
      const end = Date.now() + duration

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF', '#B8860B']
      })

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF']
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#C5A059', '#FFD700', '#FFA500', '#FFFFFF']
        })
        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [announcedCount, totalCategories])

  // Aggregate winners by film
  const filmAwards = allComplete ? (() => {
    const filmMap: Record<string, { film: string, categories: string[] }> = {}

    for (const [categoryName, nomineeId] of Object.entries(winners)) {
      const category = nominations.categories.find(c => c.name === categoryName)
      if (!category) continue

      const nominee = category.nominees.find(n => getNomineeId(categoryName, n) === nomineeId)
      if (!nominee) continue

      // Use film name as the grouping key; fall back to primary display name for non-film categories
      const filmKey = nominee.film || nominee.name || nominee.song || 'Unknown'

      if (!filmMap[filmKey]) {
        filmMap[filmKey] = { film: filmKey, categories: [] }
      }
      filmMap[filmKey].categories.push(categoryName)
    }

    return Object.values(filmMap).sort((a, b) => b.categories.length - a.categories.length)
  })() : []

  const champion = sortedParticipants[0]

  return (
    <div className="space-y-8">
      {/* Your Stats Banner (for non-hosts) */}
      {!isHost && myStats && (
        <div className="bg-gradient-to-r from-gold/20 to-gold/5 border border-gold/30 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-gold/20 border-2 border-gold flex items-center justify-center">
                <span className="text-2xl font-black text-gold">{myStats.name[0]}</span>
              </div>
              <div>
                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Your Status</p>
                <p className="text-white text-xl font-bold">{myStats.name}</p>
              </div>
            </div>
            <div className="flex gap-6 md:gap-10">
              <div className="text-center">
                <p className="text-3xl font-black text-gold">{myRank > 0 ? `#${myRank}` : '-'}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Rank</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white">{myCorrectCount}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-white/60">{announcedCount - myCorrectCount}</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Missed</p>
              </div>
            </div>
          </div>

          {/* Your pick for current category */}
          {currentCategoryData && myCurrentNominee && (
            <div className="mt-4 pt-4 border-t border-gold/20">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Your pick for {currentCategoryName}:</span>
                  <span className={`font-bold ${currentWinner ? (didIGetItRight ? 'text-green-400' : 'text-red-400') : 'text-white'}`}>
                    {getNomineeDisplayName(myCurrentNominee)}
                  </span>
                </div>
                {currentWinner && (
                  <span className={`flex items-center gap-1.5 text-sm font-bold ${didIGetItRight ? 'text-green-400' : 'text-red-400'}`}>
                    <span className="material-symbols-outlined text-lg">
                      {didIGetItRight ? 'check_circle' : 'cancel'}
                    </span>
                    {didIGetItRight ? 'Correct!' : 'Wrong'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-light flex flex-col gap-1 rounded-xl p-6 border border-zinc-800">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Categories Awarded</p>
          <p className="text-white tracking-tighter text-3xl font-black italic">
            {announcedCount} <span className="text-zinc-700 font-normal">/ {totalCategories}</span>
          </p>
          <div className="w-full bg-dark-darker h-1.5 mt-3 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full transition-all"
              style={{ width: `${(announcedCount / totalCategories) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-dark-light flex flex-col gap-1 rounded-xl p-6 border border-zinc-800">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Leading Score</p>
          <p className="text-white tracking-tighter text-3xl font-black italic">
            {sortedParticipants[0]?.score || 0}
            <span className="text-xs font-normal text-gold ml-2">pts</span>
          </p>
          <p className="text-xs text-white/40 mt-2">Held by {sortedParticipants[0]?.name || 'No one'}</p>
        </div>

        <div className="bg-dark-light flex flex-col gap-1 rounded-xl p-6 border border-zinc-800">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Total Players</p>
          <p className="text-white tracking-tighter text-3xl font-black italic">{participants.length}</p>
          <div className="flex -space-x-2 mt-2">
            {participants.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="size-6 rounded-full border border-dark-darker bg-primary flex items-center justify-center text-[10px] font-bold"
              >
                {p.name[0]}
              </div>
            ))}
            {participants.length > 4 && (
              <div className="size-6 flex items-center justify-center rounded-full border border-dark-darker bg-zinc-800 text-[8px] font-bold text-white/40">
                +{participants.length - 4}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* === ALL COMPLETE: Celebration View === */}
          {allComplete ? (
            <>
              <div className="flex items-center justify-between border-b border-dark-light pb-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
                  All Awards Announced
                </h2>
                <span className="px-3 py-1 bg-gold text-primary text-[10px] font-black uppercase tracking-widest rounded">
                  COMPLETE
                </span>
              </div>

              {/* Champion Banner */}
              {champion && (
                <div className="relative bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-gold/30 rounded-2xl p-8 overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 gold-leak opacity-40 pointer-events-none" />
                  <div className="relative flex flex-col sm:flex-row items-center gap-6">
                    <div className="size-24 rounded-full bg-gold/20 border-4 border-gold flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-gold text-5xl">workspace_premium</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-gold text-xs font-black uppercase tracking-[0.3em] mb-1">Oscar Night Champion</p>
                      <p className="text-4xl font-black text-white tracking-tight">{champion.name}</p>
                      <p className="text-white/50 font-medium mt-1">
                        {champion.score || 0} correct out of {totalCategories} categories
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Awards Sweep — films grouped by award count */}
              <div className="space-y-4">
                <h3 className="text-lg font-black text-white uppercase tracking-tight italic">Awards Sweep</h3>
                {filmAwards.map((entry, idx) => (
                  <div
                    key={entry.film}
                    className={`rounded-2xl border overflow-hidden ${
                      idx === 0
                        ? 'bg-gradient-to-r from-gold/10 to-transparent border-gold/30'
                        : 'bg-dark-light border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 p-5">
                      <div className={`size-14 rounded-xl flex items-center justify-center shrink-0 ${
                        idx === 0 ? 'bg-gold text-primary' : 'bg-zinc-800 text-white/60'
                      }`}>
                        <span className="text-2xl font-black">{entry.categories.length}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xl font-black tracking-tight ${idx === 0 ? 'text-gold' : 'text-white'}`}>
                          {entry.film}
                        </p>
                        <p className="text-white/40 text-sm font-medium">
                          {entry.categories.length} {entry.categories.length === 1 ? 'award' : 'awards'}
                        </p>
                      </div>
                      {idx === 0 && (
                        <span className="material-symbols-outlined text-gold text-3xl shrink-0">workspace_premium</span>
                      )}
                    </div>
                    <div className="px-5 pb-4 flex flex-wrap gap-2">
                      {entry.categories.map(cat => (
                        <span
                          key={cat}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                            idx === 0
                              ? 'bg-gold/15 text-gold border border-gold/20'
                              : 'bg-white/5 text-white/60 border border-white/5'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">emoji_events</span>
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* === IN PROGRESS: Normal category announcing view === */
            <>
              <div className="flex items-center justify-between border-b border-dark-light pb-3">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
                  Now Announcing
                </h2>
                <div className="flex items-center gap-3">
                  {isHost && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handlePrevCategory}
                        disabled={!canGoPrev}
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous category"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>
                      <button
                        onClick={handleNextCategory}
                        disabled={!canGoNext}
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next category"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>
                  )}
                  <span className="px-3 py-1 bg-gold text-primary text-[10px] font-black uppercase tracking-widest rounded">
                    LIVE
                  </span>
                </div>
              </div>

              {currentCategoryData && (
                <div className="bg-dark-light rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
                  <div className="bg-zinc-900 p-8 border-b border-zinc-800">
                    <h3 className="text-3xl font-black tracking-tighter uppercase italic text-gold">
                      {currentCategoryData.name}
                    </h3>
                    <p className="text-white/40 font-medium mt-1">
                      2026 Academy Awards • Category #{currentCategoryIndex + 1} of {totalCategories}
                    </p>
                  </div>

                  <div className="p-6 space-y-3">
                    {currentCategoryData.nominees.map((nominee, idx) => {
                      const nomineeKey = getNomineeId(currentCategoryData.name, nominee)
                      const isWinner = winners[currentCategoryData.name] === nomineeKey
                      const voteInfo = getVoteInfo(nomineeKey)
                      const hasVotes = voteInfo.count > 0

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border transition-all ${
                            isWinner
                              ? 'bg-gold/10 border-gold/40'
                              : 'bg-zinc-900/50 border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <div className={`size-12 rounded-lg flex items-center justify-center shrink-0 ${
                                isWinner ? 'bg-gold text-primary' : 'bg-zinc-800 text-white/40'
                              }`}>
                                {isWinner ? (
                                  <span className="material-symbols-outlined">workspace_premium</span>
                                ) : (
                                  <span className="font-bold">{idx + 1}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <p className={`font-bold text-lg truncate ${isWinner ? 'text-gold' : 'text-white'}`}>
                                    {nominee.name || nominee.film || nominee.song}
                                  </p>
                                  {hasVotes && (
                                    <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                                      isWinner ? 'bg-gold text-primary' : 'bg-white/10 text-white'
                                    }`}>
                                      {voteInfo.count} {voteInfo.count === 1 ? 'vote' : 'votes'}
                                    </span>
                                  )}
                                </div>
                                {nominee.film && nominee.name && (
                                  <p className="text-white/40 text-sm truncate">{nominee.film}</p>
                                )}
                                {isWinner && (
                                  <div className="flex items-center gap-1.5 text-gold mt-1">
                                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">WINNER</span>
                                  </div>
                                )}
                                {hasVotes && (
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    {voteInfo.voters.map((voter, i) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                          isWinner
                                            ? 'bg-gold/20 text-gold'
                                            : 'bg-white/5 text-white/60'
                                        }`}
                                      >
                                        <span className="size-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                          {voter[0]}
                                        </span>
                                        {voter}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {isHost && !winners[currentCategoryData.name] && (
                              <button
                                onClick={() => onDeclareWinner?.(currentCategoryData.name, nomineeKey)}
                                className="shrink-0 px-4 py-2 bg-gold hover:bg-gold-light text-primary text-xs font-black uppercase rounded-lg transition-colors"
                              >
                                Declare Winner
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Leaderboard Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-dark-light pb-3">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight italic">
              {allComplete ? 'Final Rankings' : 'Leaderboard'}
            </h2>
          </div>

          <div className="bg-dark-light rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-900/50 border-b border-zinc-800">
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Rank</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white/40">Player</th>
                  <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedParticipants.map((participant, idx) => (
                  <tr
                    key={participant.id}
                    className={idx === 0 ? 'bg-gold/5 hover:bg-gold/10' : 'hover:bg-zinc-900'}
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-black italic ${idx === 0 ? 'text-gold' : 'text-white'}`}>
                          {idx + 1}
                        </span>
                        {idx === 0 && (
                          <span className="material-symbols-outlined text-gold text-sm">stars</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-lg flex items-center justify-center ${
                          idx === 0 ? 'border border-gold bg-gold/10' : 'bg-zinc-800 border border-zinc-700'
                        }`}>
                          <span className="text-sm font-bold">{participant.name[0]}</span>
                        </div>
                        <p className="text-sm font-bold text-white">{participant.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <p className="text-lg font-black text-white tracking-tighter">{participant.score || 0}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        {participant.predictionsCount}/24
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* End Ceremony Button (host only) */}
      {isHost && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onEndCeremony}
            className="px-8 py-3 bg-zinc-800 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/40 text-white/60 hover:text-red-400 font-bold text-sm uppercase tracking-widest rounded-xl transition-all"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">stop_circle</span>
              End Ceremony
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
