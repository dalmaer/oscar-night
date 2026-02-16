import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import OscarLogo from '@/components/OscarLogo'
import { useSession } from '@/hooks/useSession'
import { createRoom, joinRoom } from '@/lib/room'
import { nominations } from '@/lib/nominations'

function getDaysUntilCeremony() {
  const ceremonyDate = new Date(nominations.ceremonyDate + 'T00:00:00')
  const now = new Date()
  const diff = ceremonyDate.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function formatCeremonyDate() {
  const date = new Date(nominations.ceremonyDate + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function Home() {
  const daysUntil = getDaysUntilCeremony()
  const ceremonyDateDisplay = formatCeremonyDate()
  const navigate = useNavigate()
  const { session, saveSession, clearSession } = useSession()

  const [code, setCode] = useState(['', '', '', ''])
  const [displayName, setDisplayName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const [showHostModal, setShowHostModal] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [hostName, setHostName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0]
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    setJoinError(null)

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
    const newCode = ['', '', '', '']
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i]
    }
    setCode(newCode)
    if (pasted.length === 4) {
      inputRefs.current[3]?.focus()
    }
  }

  const roomCode = code.join('')
  const canJoin = roomCode.length === 4 && displayName.trim().length > 0

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canJoin) return

    setIsJoining(true)
    setJoinError(null)

    try {
      const result = await joinRoom(roomCode, displayName.trim())

      saveSession({
        participantId: result.participantId,
        roomCode: roomCode.toUpperCase(),
        roomId: result.roomId,
        isHost: false,
        name: displayName.trim()
      })

      navigate(`/room/${roomCode.toUpperCase()}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hostName.trim()) return

    setIsCreating(true)
    setCreateError(null)

    try {
      const result = await createRoom(hostName.trim())

      saveSession({
        participantId: result.participantId,
        roomCode: result.roomCode,
        roomId: result.roomId,
        isHost: true,
        name: hostName.trim()
      })

      navigate(`/room/${result.roomCode}`)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-primary text-white flex flex-col items-center justify-center relative overflow-hidden">
      {/* Gold leak effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] gold-leak pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] gold-leak pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50">
        <div className="flex items-center justify-between px-6 py-6 lg:px-20">
          <div className="flex items-center gap-3">
            <OscarLogo />
            <h2 className="text-white text-base font-semibold tracking-wide uppercase">Oscar Night</h2>
          </div>
          <button
            onClick={() => setShowHelp(true)}
            className="text-sm font-medium hover:text-gold transition-colors"
          >
            Help
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-[1200px] px-6 py-20 flex flex-col items-center">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-white tracking-tighter text-6xl lg:text-8xl font-extrabold leading-none pb-4 drop-shadow-2xl">
            OSCAR <span className="text-gold">NIGHT</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-gold/80">
            <div className="h-[1px] w-12 bg-gold/40" />
            <h2 className="text-lg lg:text-xl font-light uppercase tracking-[0.3em]">{nominations.ceremony}</h2>
            <div className="h-[1px] w-12 bg-gold/40" />
          </div>

          {/* Ceremony date & countdown */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-6 py-3">
            <span className="material-symbols-outlined text-gold text-lg">calendar_today</span>
            <span className="text-white/80 text-sm font-medium">{ceremonyDateDisplay}</span>
            <span className="text-white/20">|</span>
            {daysUntil > 0 ? (
              <span className="text-gold text-sm font-bold">{daysUntil} {daysUntil === 1 ? 'day' : 'days'} away</span>
            ) : daysUntil === 0 ? (
              <span className="text-gold text-sm font-bold animate-pulse">Tonight!</span>
            ) : (
              <span className="text-white/40 text-sm font-medium">Ceremony complete</span>
            )}
          </div>

          <p className="mt-6 text-white/60 text-lg font-medium max-w-lg mx-auto">
            Join the ultimate social voting experience and track the winners live with your friends.
          </p>
        </div>

        {/* Existing session banner */}
        {session && (
          <div className="w-full max-w-4xl mb-8 bg-gold/10 border border-gold/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-gold">meeting_room</span>
                </div>
                <div>
                  <p className="text-white/60 text-sm">You're in a room</p>
                  <p className="text-white font-bold text-lg">
                    Room <span className="text-gold font-mono">{session.roomCode}</span>
                    {session.isHost && <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-0.5 rounded uppercase">Host</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(`/room/${session.roomCode}`)}
                  className="px-6 py-3 bg-gold hover:bg-gold-light text-primary font-bold rounded-lg transition-colors"
                >
                  Return to Room
                </button>
                <button
                  onClick={clearSession}
                  className="px-6 py-3 border border-white/20 text-white/60 hover:text-white hover:border-white/40 font-medium rounded-lg transition-colors"
                >
                  Leave Room
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cards */}
        <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-6 max-w-4xl">
          {/* Join Card */}
          <div className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <span className="material-symbols-outlined text-gold">confirmation_number</span>
              <h3 className="text-xl font-bold text-white">Join a Party</h3>
            </div>
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/50 uppercase tracking-wider">Party Code</label>
                <div className="grid grid-cols-4 gap-3">
                  {code.map((char, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      maxLength={1}
                      value={char}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      onPaste={i === 0 ? handlePaste : undefined}
                      placeholder="•"
                      className="w-full h-16 text-center text-3xl font-bold bg-white/10 border border-white/20 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold text-white uppercase placeholder-white/20 outline-none transition-colors"
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/50 uppercase tracking-wider">Your Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="e.g. CinemaFan88"
                  className="w-full h-14 px-4 bg-white/10 border border-white/20 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold text-white text-lg font-medium placeholder:text-white/20 outline-none transition-colors"
                />
              </div>

              {joinError && (
                <p className="text-red-400 text-sm">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={!canJoin || isJoining}
                className="w-full h-16 bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-primary font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 group"
              >
                {isJoining ? 'Joining...' : 'Enter the Party'}
                {!isJoining && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
              </button>
            </form>
          </div>

          {/* Host Card */}
          <div className="lg:w-72 flex flex-col items-center justify-center p-8 bg-white/5 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl text-center group">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-white/40 text-3xl">celebration</span>
            </div>
            <h4 className="text-white font-bold mb-2">Hosting?</h4>
            <p className="text-white/40 text-sm mb-6">Create your own private room and invite your movie-loving friends.</p>
            <button
              onClick={() => setShowHostModal(true)}
              className="w-full py-4 px-6 border border-white/20 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all uppercase tracking-wider"
            >
              Host a Party
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-20 flex flex-col items-center gap-8">
          <p className="text-white/20 text-xs font-medium uppercase tracking-[0.2em]">{nominations.ceremony}</p>
        </div>
      </main>

      {/* Host Modal */}
      {showHostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isCreating && setShowHostModal(false)}
          />
          <div className="relative bg-primary border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <button
              onClick={() => !isCreating && setShowHostModal(false)}
              disabled={isCreating}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-gold">celebration</span>
              <h3 className="text-xl font-bold text-white">Host a Party</h3>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/50 uppercase tracking-wider">Your Display Name</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={e => { setHostName(e.target.value); setCreateError(null) }}
                  placeholder="e.g. CinemaFan88"
                  autoFocus
                  disabled={isCreating}
                  className="w-full h-14 px-4 bg-white/10 border border-white/20 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold text-white text-lg font-medium placeholder:text-white/20 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {createError && (
                <p className="text-red-400 text-sm">{createError}</p>
              )}

              <button
                type="submit"
                disabled={!hostName.trim() || isCreating}
                className="w-full h-14 bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-primary font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isCreating ? 'Creating Room...' : 'Create Room'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="relative bg-primary border border-white/10 rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-gold">help</span>
              <h3 className="text-xl font-bold text-white">How It Works</h3>
            </div>

            <div className="space-y-6 text-white/70 text-sm leading-relaxed">
              <div>
                <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <span className="size-6 rounded-full bg-gold/20 text-gold text-xs font-black flex items-center justify-center">1</span>
                  Join or Host
                </h4>
                <p>The <strong className="text-white">host</strong> creates a room and shares the 4-character code with friends. Everyone else enters the code and a display name to join.</p>
              </div>

              <div>
                <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <span className="size-6 rounded-full bg-gold/20 text-gold text-xs font-black flex items-center justify-center">2</span>
                  Cast Your Votes
                </h4>
                <p>Pick who you think will win in each of the 24 Oscar categories. Your predictions save automatically. Change your mind anytime before the ceremony starts.</p>
              </div>

              <div>
                <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <span className="size-6 rounded-full bg-gold/20 text-gold text-xs font-black flex items-center justify-center">3</span>
                  Watch Live
                </h4>
                <p>When the ceremony begins, the host starts <strong className="text-white">Live Mode</strong> and declares winners as they're announced on TV. The leaderboard updates in real time.</p>
              </div>

              <div>
                <h4 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                  <span className="size-6 rounded-full bg-gold/20 text-gold text-xs font-black flex items-center justify-center">4</span>
                  See Who Wins
                </h4>
                <p>Each correct prediction earns a point. When all awards are announced, the champion is crowned and you'll see which films swept the night.</p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-xs">
                  <strong className="text-white/60">Tip:</strong> The host doesn't vote — they focus on running the ceremony. Everyone else competes on the leaderboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
