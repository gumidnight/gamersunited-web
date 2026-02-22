"use client"

import { useState } from "react"
import { postComment } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface CommentFormProps {
    postId: string
    user: {
        name?: string | null
        image?: string | null
    }
}

export default function CommentForm({ postId, user }: CommentFormProps) {
    const [content, setContent] = useState("")
    const [isPending, setIsPending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsPending(true)
        setMessage(null)

        try {
            const result = await postComment(postId, content)
            if (result.success) {
                setContent("")
                setMessage({ type: 'success', text: 'Comment posted successfully!' })
                router.refresh()
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to post comment.' })
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'An unexpected error occurred.' })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="glass rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                {user.image && (
                    <img src={user.image} alt="" className="w-8 h-8 rounded-full border border-neon-cyan" />
                )}
                <span className="text-sm font-semibold">{user.name}</span>
            </div>
            <textarea
                className="w-full bg-surface-base border border-surface-border rounded-lg p-3 text-text-primary focus:border-neon-purple outline-none transition-colors"
                placeholder="Leave a comment..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isPending}
            />
            {message && (
                <p className={`mt-2 text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {message.text}
                </p>
            )}
            <button
                type="submit"
                disabled={isPending || !content.trim()}
                className="mt-4 bg-gradient-brand text-white px-6 py-2 rounded-lg font-bold hover-glow-purple transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isPending ? 'Posting...' : 'Post Comment'}
            </button>
        </form>
    )
}
