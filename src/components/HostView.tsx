interface Participant {
  id: string
  name: string
  predictionsCount: number
}

interface HostViewProps {
  roomCode: string
  participants: Participant[]
  onStartCeremony?: () => void
}

export default function HostView({ roomCode, participants, onStartCeremony }: HostViewProps) {
  const totalBallots = participants.filter(p => p.predictionsCount === 24).length
  const percentSubmitted = participants.length > 0
    ? Math.round((totalBallots / participants.length) * 100)
    : 0

  return (
    <div className="flex flex-col xl:flex-row gap-8">
      {/* Left: Room Code & Participants */}
      <div className="flex-1 flex flex-col gap-10">
        {/* Room Code Hero */}
        <div className="bg-primary border gold-border p-12 rounded-xl text-center flex flex-col items-center gap-4 shadow-2xl">
          <h2 className="text-white/60 text-sm font-black tracking-[0.4em] uppercase">Room Code</h2>
          <div className="flex gap-4">
            {roomCode.split('').map((char, i) => (
              <span
                key={i}
                className={`text-7xl md:text-8xl font-black tracking-tighter ${
                  /[0-9]/.test(char) ? 'text-gold' : 'text-white'
                }`}
              >
                {char}
              </span>
            ))}
          </div>
          <p className="text-white/40 text-lg mt-4 font-medium italic">
            Share this code with friends to join the party
          </p>
        </div>

        {/* Participants */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Guest List <span className="text-gold ml-2 font-light">{participants.length}/24</span>
            </h2>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <span className="material-symbols-outlined text-sm">group</span>
              <span>Capacity: 24 Players</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {participants.map((participant) => (
              <div key={participant.id} className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition duration-500 blur-md" />
                  <div className="relative size-20 md:size-24 rounded-full border-2 border-white/10 bg-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white/60">
                      {participant.name[0].toUpperCase()}
                    </span>
                  </div>
                  {participant.predictionsCount === 24 && (
                    <div className="absolute -bottom-1 -right-1 size-6 bg-gold rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">check</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-sm uppercase tracking-wide">{participant.name}</p>
                  <p className="text-white/40 text-xs">{participant.predictionsCount}/24</p>
                </div>
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: Math.min(6 - participants.length, 3) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center gap-3 opacity-20">
                <div className="size-20 md:size-24 rounded-full border-2 border-dashed border-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                </div>
                <p className="text-white font-bold text-xs uppercase">Waiting...</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Stats & Controls */}
      <div className="w-full xl:w-[400px] flex flex-col gap-6">
        {/* Ballot Status */}
        <div className="bg-primary/40 border border-white/10 p-8 rounded-xl flex flex-col gap-6 backdrop-blur-md">
          <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-gold">Ballot Status</h3>

          {/* Circular Progress */}
          <div className="flex justify-center py-4">
            <div className="relative size-48 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-white/5"
                  cx="50" cy="50" r="42"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-gold"
                  cx="50" cy="50" r="42"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="263.89"
                  strokeDashoffset={263.89 - (263.89 * percentSubmitted / 100)}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-black text-white">{percentSubmitted}%</span>
                <span className="text-xs uppercase text-white/40 tracking-widest font-bold">Submitted</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm font-medium border-b border-white/5 pb-2">
              <span className="text-white/60">Total Ballots Cast</span>
              <span className="text-white font-bold">{totalBallots} / {participants.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium border-b border-white/5 pb-2">
              <span className="text-white/60">Pending Votes</span>
              <span className="text-gold font-bold">{participants.length - totalBallots} Remaining</span>
            </div>
          </div>
        </div>

        {/* Live Activity */}
        <div className="bg-primary/20 border border-white/10 p-6 rounded-xl flex-1 flex flex-col gap-4">
          <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Live Activity</h4>
          <div className="flex flex-col gap-4">
            {participants.slice(0, 3).map((p) => (
              <div key={p.id} className="flex gap-3 items-start">
                <div className={`size-2 rounded-full mt-1.5 shrink-0 ${p.predictionsCount === 24 ? 'bg-gold' : 'bg-white/10'}`} />
                <p className="text-sm text-white/80 leading-relaxed">
                  <span className="font-bold text-white">{p.name}</span>
                  {p.predictionsCount === 24
                    ? ' has completed their ballot.'
                    : ` is voting... (${p.predictionsCount}/24)`
                  }
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Host Controls */}
        <div className="space-y-4">
          <button
            onClick={onStartCeremony}
            className="w-full py-4 bg-gold hover:bg-gold-light text-primary font-black uppercase tracking-wider rounded-xl transition-colors"
          >
            Start Ceremony
          </button>
        </div>
      </div>
    </div>
  )
}
