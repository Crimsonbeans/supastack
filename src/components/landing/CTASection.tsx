import Link from 'next/link'

interface CTASectionProps {
  title: string
  description?: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

export default function CTASection({
  title,
  description,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CTASectionProps) {
  return (
    <section className="py-24 md:py-36 bg-[#f8f8fa]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="fade-up">
          <div
            className="relative rounded-[3rem] p-12 md:p-24 text-center text-white overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(135deg,#1e3a8a,#1e40af,#0369a1)',
            }}
          >
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-[50px] -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-400/20 rounded-full blur-[60px] translate-x-1/3 translate-y-1/3" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">{title}</h2>
              {description && (
                <p className="text-xl text-white/80 mb-10 leading-relaxed">{description}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
                <Link
                  href={primaryHref}
                  className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white text-blue-800 font-bold text-lg shadow-xl shadow-black/10 hover:shadow-2xl transition-shadow duration-300"
                >
                  {primaryLabel}
                </Link>
                {secondaryLabel && secondaryHref && (
                  <Link
                    href={secondaryHref}
                    className="inline-flex items-center justify-center h-16 px-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all duration-300"
                  >
                    {secondaryLabel}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
