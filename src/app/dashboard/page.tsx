import { Rocket, Sparkles } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
            <div className="max-w-lg space-y-8">
                {/* Icon */}
                <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-100 rounded-3xl rotate-6"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Rocket className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Coming Soon
                    </h1>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-md mx-auto">
                        We're building something great here. Your personalized dashboard with analytics and insights is on its way.
                    </p>
                </div>

                {/* Decorative pills */}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                    {['Analytics', 'Insights', 'Trends', 'Recommendations'].map((label) => (
                        <span
                            key={label}
                            className="px-4 py-1.5 bg-gray-100 text-gray-400 text-xs font-medium rounded-full border border-gray-200"
                        >
                            {label}
                        </span>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="pt-4">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 text-sm font-medium rounded-full">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        In Development
                    </div>
                </div>
            </div>
        </div>
    )
}
