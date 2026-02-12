'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { loginAdmin } from './actions'
import { Loader2, Lock } from 'lucide-react'

// Initial state for the form
const initialState = {
    error: '',
}

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 flex justify-center items-center"
        >
            {pending ? <Loader2 className="animate-spin w-5 h-5" /> : 'Enter Control Panel'}
        </button>
    )
}

export default function ControlPanelPage() {
    const [state, formAction] = useActionState(loginAdmin, initialState) // Using the new hook for actions

    return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-sm space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 backdrop-blur-xl">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-red-900/30 text-red-500 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">Admin Only</h1>
                    <p className="text-zinc-500 text-sm">Restricted Access</p>
                </div>

                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                        <input
                            name="username"
                            type="text"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:outline-none"
                            required
                        />
                    </div>

                    {state?.error && <p className="text-red-400 text-sm text-center">{state.error}</p>}

                    <SubmitButton />
                </form>
            </div>
        </div>
    )
}
