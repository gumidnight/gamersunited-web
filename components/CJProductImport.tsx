'use client'

import { useState } from 'react';
import { Download, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CJProductImport() {
    const [pid, setPid] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const router = useRouter();

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pid.trim()) return;

        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const res = await fetch('/api/admin/products/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pid: pid.trim(), supplier: 'cj' }),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Failed to import product');

            setStatus('success');
            setMessage(`Successfully imported product from CJ!`);
            setPid('');
            router.refresh();
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Error occurred during import.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass rounded-2xl p-6 border border-surface-border space-y-4 mb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-neon-cyan/10 rounded-lg">
                    <Download className="text-neon-cyan" size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white leading-none">CJ Express Import</h3>
                    <p className="text-xs text-text-muted mt-1">Paste a CJ Product ID (PID) to instantly add it to your shop.</p>
                </div>
            </div>

            <form onSubmit={handleImport} className="flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    value={pid}
                    onChange={(e) => setPid(e.target.value)}
                    placeholder="e.g. 41C07701-32E5-49D6-A679-C891893D5C0B"
                    disabled={loading}
                    className="flex-1 bg-surface-raised border border-surface-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-cyan transition-all placeholder:text-text-muted/50"
                />
                <button
                    type="submit"
                    disabled={loading || !pid.trim()}
                    className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 min-w-[140px] ${loading || !pid.trim()
                            ? 'bg-surface-raised text-text-muted cursor-not-allowed border border-surface-border'
                            : 'bg-white text-black hover:bg-neon-cyan hover:text-black shadow-glow-white hover:shadow-neon-cyan'
                        }`}
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Importing...
                        </>
                    ) : (
                        'Import Product'
                    )}
                </button>
            </form>

            {status === 'success' && (
                <div className="flex items-center gap-2 text-neon-green bg-neon-green/10 p-3 rounded-xl border border-neon-green/20 animate-in fade-in slide-in-from-top-1">
                    <Check size={16} />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex items-center gap-2 text-neon-pink bg-neon-pink/10 p-3 rounded-xl border border-neon-pink/20 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle size={16} />
                    <p className="text-sm font-medium">{message}</p>
                </div>
            )}
        </div>
    );
}
