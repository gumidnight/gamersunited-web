'use client'

import { useState } from 'react';
import { RefreshCcw, Check, AlertCircle } from 'lucide-react';
import { syncPrintfulProducts } from '@/lib/shop-actions';

export default function SyncButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSync = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const result = await syncPrintfulProducts();
            setStatus('success');
            setMessage(`Synced ${result.productCount} products (${result.variantCount} variants) — ${result.createdCount} new, ${result.updatedCount} updated, ${result.deletedCount} removed.`);
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to sync products.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <button
                onClick={handleSync}
                disabled={loading}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${loading
                    ? 'bg-surface-raised cursor-not-allowed opacity-50'
                    : 'bg-gradient-brand hover-glow-purple shadow-neon-purple text-white'
                    }`}
            >
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Syncing with Printful...' : 'Sync Products Now'}
            </button>

            {status === 'success' && (
                <div className="flex items-center gap-2 text-neon-green bg-neon-green/10 p-4 rounded-xl border border-neon-green/20">
                    <Check size={18} />
                    <p className="text-sm font-bold">{message}</p>
                </div>
            )}

            {status === 'error' && (
                <div className="flex items-center gap-2 text-neon-pink bg-neon-pink/10 p-4 rounded-xl border border-neon-pink/20">
                    <AlertCircle size={18} />
                    <p className="text-sm font-bold">{message}</p>
                </div>
            )}
        </div>
    );
}
