"use client";

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/CartContext';

export default function CartIcon() {
    const { itemsCount } = useCart();

    return (
        <Link
            href="/shop/cart"
            className="relative p-2 text-text-muted hover:text-white transition-colors group"
            aria-label="View Shopping Cart"
        >
            <ShoppingCart size={24} className="group-hover:scale-110 transition-transform" />

            {itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-neon-cyan text-black text-[10px] font-black min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-background animate-in fade-in zoom-in duration-300">
                    {itemsCount > 99 ? '99+' : itemsCount}
                </span>
            )}
        </Link>
    );
}
