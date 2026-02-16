import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSession } from '@/hooks/useSession'
import { useRoom } from '@/hooks/useRoom'
import { joinRoom } from '@/lib/room'
import VotingBallot from '@/components/VotingBallot'
import HostView from '@/components/HostView'
import LiveLeaderboard from '@/components/LiveLeaderboard'


export default function Room() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { session, clearSession, saveSession } = useSession()

  const {
    room,
    phase,
    participants,
    predictions,
    allPredictions,
    winners,
    currentCategory,
    isHost,
    isLoading,
    error,
    savePrediction,
    startCeremony,
    declareWinner,
    setCurrentCategory,
  } = useRoom(code)

  // Quick join form state (when user arrives via direct URL without session)
  const [displayName, setDisplayName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleQuickJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!displayName.trim() || !code) return

    setIsJoining(true)
    setJoinError(null)

    try {
      const result = await joinRoom(code, displayName.trim())

      saveSession({
        participantId: result.participantId,
        roomCode: code.toUpperCase(),
        roomId: result.roomId,
        isHost: false,
        name: displayName.trim()
      })

      // Force reload to pick up the new session
      window.location.reload()
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeaveRoom = () => {
    clearSession()
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading room...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <span className="material-symbols-outlined text-red-400 text-5xl mb-4">error</span>
          <h2 className="text-xl font-bold text-white mb-2">Room Error</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <button
            onClick={handleLeaveRoom}
            className="px-6 py-3 bg-gold text-primary font-bold rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-dark-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60">Room not found</p>
          <button
            onClick={handleLeaveRoom}
            className="mt-4 px-6 py-3 bg-gold text-primary font-bold rounded-lg"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  // Show quick join form if user has no session but room exists
  if (!session) {
    return (
      <div className="min-h-screen bg-primary text-white flex flex-col items-center justify-center relative overflow-hidden">
        {/* Gold leak effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] gold-leak pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] gold-leak pointer-events-none" />

        <div className="relative z-10 w-full max-w-md px-6">
          {/* Room code display */}
          <div className="text-center mb-8">
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest mb-2">Joining Room</p>
            <div className="flex justify-center gap-3">
              {code?.split('').map((char, i) => (
                <span
                  key={i}
                  className={`text-5xl font-black tracking-tighter ${
                    /[0-9]/.test(char) ? 'text-gold' : 'text-white'
                  }`}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Quick join form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-gold">person_add</span>
              <h3 className="text-xl font-bold text-white">Enter Your Name</h3>
            </div>

            <form onSubmit={handleQuickJoin} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white/50 uppercase tracking-wider">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setJoinError(null) }}
                  placeholder="e.g. CinemaFan88"
                  autoFocus
                  disabled={isJoining}
                  className="w-full h-14 px-4 bg-white/10 border border-white/20 rounded-xl focus:border-gold focus:ring-1 focus:ring-gold text-white text-lg font-medium placeholder:text-white/20 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              {joinError && (
                <p className="text-red-400 text-sm">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={!displayName.trim() || isJoining}
                className="w-full h-14 bg-gold hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-primary font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isJoining ? 'Joining...' : 'Join Party'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link to="/" className="text-white/40 hover:text-white text-sm transition-colors">
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-darker flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-darker/80 backdrop-blur-md border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 gold-gradient rounded-lg flex items-center justify-center text-primary shadow-lg">
              <span className="material-symbols-outlined font-bold">award_star</span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight uppercase">
                Oscar Night <span className="text-gold">2026</span>
              </h1>
              <p className="text-[10px] text-gold/60 tracking-[0.2em] uppercase font-bold">
                {phase === 'VOTING' ? 'Voting Open' : phase === 'LIVE' ? 'Live Ceremony' : 'Complete'}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Phase indicator */}
            <div className="hidden md:flex items-center gap-2">
              {phase === 'VOTING' && (
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <span className="size-2 bg-green-400 rounded-full animate-pulse" />
                  Voting Open
                </span>
              )}
              {phase === 'LIVE' && (
                <span className="flex items-center gap-2 text-sm text-red-400">
                  <span className="size-2 bg-red-400 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>

            {/* Room code */}
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <span className="text-xs text-white/40 uppercase tracking-wider">Room:</span>
              <span className="font-mono font-bold text-lg">{code}</span>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">{session?.name}</span>
              {isHost && (
                <span className="text-[10px] bg-gold/20 text-gold px-2 py-1 rounded uppercase font-bold">Host</span>
              )}
            </div>

            <button
              onClick={handleLeaveRoom}
              className="text-white/40 hover:text-white transition-colors"
              title="Leave room"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {phase === 'VOTING' && !isHost && (
          <VotingBallot
            predictions={predictions}
            onVote={savePrediction}
            disabled={false}
          />
        )}

        {phase === 'VOTING' && isHost && (
          <HostView
            roomCode={code || ''}
            participants={participants}
            onStartCeremony={startCeremony}
          />
        )}

        {(phase === 'LIVE' || phase === 'CLOSED') && (
          <LiveLeaderboard
            participants={participants}
            allPredictions={allPredictions}
            myPredictions={predictions}
            myParticipantId={session?.participantId}
            winners={winners}
            currentCategory={currentCategory ?? undefined}
            isHost={isHost}
            onDeclareWinner={declareWinner}
            onSetCurrentCategory={setCurrentCategory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-primary/20 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
              {phase === 'VOTING' ? 'Syncing votes automatically' : 'Connected'}
            </p>
          </div>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">
            98th Academy Awards
          </p>
        </div>
      </footer>
    </div>
  )
}
