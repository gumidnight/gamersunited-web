export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import Link from "next/link";
import ProductReviewSection from "@/components/ProductReviewSection";
import ProductInteractiveViewer from "@/components/ProductInteractiveViewer";
import { auth } from "@/auth";
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
    const { id } = await params;
    const product = await prisma.product.findUnique({
        where: { id },
        include: { variants: true }
    });

    if (!product) {
        return { title: 'Product Not Found' };
    }

    const defaultVariant = product.variants?.[0];
    const imageUrl = defaultVariant?.image || defaultVariant?.images?.[0] || product.image || '/og-image.jpg';
    const plainDescription = product.description ? product.description.replace(/<[^>]*>?/gm, '').substring(0, 160) : "";

    return {
        title: `${product.title} | Gamers United`,
        description: plainDescription,
        openGraph: {
            title: product.title,
            description: plainDescription,
            url: `https://gamersunited.cy/shop/${id}`,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: product.title,
                }
            ],
            type: 'website',
        },
        other: {
            "og:type": "product"
        }
    };
}

export default async function ProductPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const session = await auth();

    const product = await prisma.product.findUnique({
        where: { id },
        include: {
            variants: {
                orderBy: {
                    price: 'asc'
                }
            },
            reviews: {
                include: {
                    user: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });

    if (!product) {
        notFound();
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 pt-32">
            <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-text-muted hover:text-neon-cyan transition-colors mb-8 group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Shop
            </Link>

            <ProductInteractiveViewer
                product={{
                    id: product.id,
                    title: product.title,
                    description: product.description,
                    image: product.image,
                    price: product.price,
                    customImages: product.customImages
                }}
                variants={product.variants.map(v => ({
                    id: v.id,
                    title: v.title,
                    price: v.price,
                    stock: v.stock,
                    color: v.color,
                    size: v.size,
                    image: v.image,
                    images: v.images
                }))}
            />

            {/* Reviews Section */}
            <ProductReviewSection
                productId={product.id}
                reviews={product.reviews}
                userSession={session}
            />
        </div>
    );
}

