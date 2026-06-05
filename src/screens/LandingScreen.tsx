interface Props {
  onStart:    () => void
  onExplore:  () => void
  onLogin:    () => void
  onRegister: () => void
}

const STATS = [
  { num: '2.4k', label: 'Propiedades' },
  { num: '94%',  label: 'Satisfacción' },
  { num: '320+', label: 'Asesores' },
]

export default function LandingScreen({ onStart, onExplore, onLogin, onRegister }: Props) {
  return (
    <div className="relative flex-1 text-white" style={{ background: '#1A1A1A' }}>
      {/* Radial gradient background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(194,113,79,.45) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 50% at 10% 80%, rgba(107,124,92,.30) 0%, transparent 70%)',
            '#1A1A1A',
          ].join(', '),
        }}
      />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col min-h-svh px-7 pt-[60px] pb-12 justify-between">

        {/* Logo */}
        <div className="font-display text-[28px] font-bold tracking-[-0.5px]">
          Casa<span style={{ color: '#E8A98A' }}>Match</span>
        </div>

        {/* Hero block */}
        <div className="flex-1 flex flex-col justify-center gap-5 py-8">
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium w-fit"
            style={{
              background: 'rgba(255,255,255,.10)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#E8A98A',
              backdropFilter: 'blur(8px)',
            }}
          >
            ✦ Nueva forma de buscar casa
          </div>

          <h1 className="font-display text-[44px] leading-[1.1] font-bold tracking-[-1px]">
            Tu próxima<br />casa, en un<br />
            <em style={{ color: '#E8A98A', fontStyle: 'italic' }}>swipe.</em>
          </h1>

          <p className="text-[16px] leading-[1.6] font-light" style={{ color: 'rgba(255,255,255,.65)' }}>
            Encuentra propiedades compatibles con tu estilo de vida,
            presupuesto y lo que realmente buscas.
          </p>

          {/* Stats row */}
          <div
            className="flex rounded-[18px] p-5"
            style={{
              background: 'rgba(255,255,255,.07)',
              border: '1px solid rgba(255,255,255,.10)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {STATS.map((stat, i) => (
              <div
                key={stat.label}
                className="flex-1 text-center"
                style={i > 0 ? { borderLeft: '1px solid rgba(255,255,255,.12)' } : {}}
              >
                <span className="font-display text-[24px] font-bold block">{stat.num}</span>
                <span
                  className="text-[11px] mt-0.5 block"
                  style={{ color: 'rgba(255,255,255,.50)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onStart}
            className="w-full rounded-full py-[15px] text-[15px] font-semibold font-body border-none text-white cursor-pointer tracking-[0.2px] transition-all active:scale-[.97]"
            style={{ background: '#C2714F' }}
          >
            Encontrar mi casa ideal
          </button>
          <button
            onClick={onExplore}
            className="w-full rounded-full py-[14px] text-[15px] font-medium font-body bg-transparent cursor-pointer transition-all"
            style={{ border: '1.5px solid rgba(255,255,255,.20)', color: 'rgba(255,255,255,.70)' }}
          >
            Solo explorar →
          </button>

          {/* Auth row */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onLogin}
              className="flex-1 rounded-full py-[12px] text-[14px] font-semibold font-body border-none cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgba(255,255,255,.12)', color: 'white', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.18)' }}
            >
              Iniciar sesión
            </button>
            <button
              onClick={onRegister}
              className="flex-1 rounded-full py-[12px] text-[14px] font-semibold font-body border-none cursor-pointer transition-all active:scale-[.97]"
              style={{ background: 'rgba(232,169,138,.18)', color: '#E8A98A', backdropFilter: 'blur(8px)', border: '1px solid rgba(232,169,138,.30)' }}
            >
              Crear cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
