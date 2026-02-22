interface PageHeroProps {
  badge: string
  children: React.ReactNode
}

export default function PageHero({ badge, children }: PageHeroProps) {
  return (
    <section className="relative pt-36 pb-20 md:pt-44 md:pb-28 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ contain: 'strict' }}>
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[60px] opacity-25"
          style={{
            top: '-5%',
            right: '5%',
            background: 'radial-gradient(circle,#bfdbfe,transparent 70%)',
            animation: 'ss-float 20s ease-in-out infinite',
            backfaceVisibility: 'hidden',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[50px] opacity-20"
          style={{
            bottom: '0%',
            left: '10%',
            background: 'radial-gradient(circle,#93c5fd,transparent 70%)',
            animation: 'ss-float-rev 25s ease-in-out infinite',
            backfaceVisibility: 'hidden',
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[50px] opacity-20"
          style={{
            bottom: '-5%',
            left: '35%',
            background: 'radial-gradient(circle,#bae6fd,transparent 70%)',
            animation: 'ss-float-slow 30s ease-in-out infinite',
            backfaceVisibility: 'hidden',
          }}
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(29,78,216,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(29,78,216,.08) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <div className="container mx-auto px-4 md:px-6 text-center relative z-10 max-w-4xl">
        <div className="fade-up">
          <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-widest uppercase mb-6">
            {badge}
          </span>
        </div>
        {children}
      </div>
    </section>
  )
}
