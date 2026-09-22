'use client';
import { motion, useMotionValue, useAnimationFrame, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Star, MessageSquarePlus, X, Check, Trash2, Sparkles, ShieldCheck } from 'lucide-react';
import { RevealText } from '../ui/RevealText';

const SPEED = 45; // px per second

export interface ReviewItem {
  id?: string;
  img: string;
  name: string;
  note: string;
  rating?: number;
  product?: string;
  isUserReview?: boolean;
  date?: string;
}

const DEFAULT_REVIEWS: ReviewItem[] = [
  { img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop', name: 'Aria M.', note: 'Impeccable fit and wonderful linen texture.', rating: 5, product: 'Summer Tunic' },
  { img: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=600&auto=format&fit=crop', name: 'Devin K.', note: 'Buttery soft organic cotton — my kid loves it.', rating: 5, product: 'Ribbed Romper' },
  { img: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=600&auto=format&fit=crop', name: 'Noor S.', note: 'Worth every penny. The stitching is top notch.', rating: 5, product: 'Knit Cardigan' },
  { img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=600&auto=format&fit=crop', name: 'Priya R.', note: 'Our new family staple for holiday photos!', rating: 5, product: 'Play-Ready Set' },
  { img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop', name: 'Leo T.', note: 'Elevated basics that survive weekly laundry perfectly.', rating: 5, product: 'Organic Tee' },
  { img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop', name: 'Maya J.', note: 'So well made, beautiful earthy color palette.', rating: 5, product: 'Linen Shorts' },
];

const RATING_LABELS: Record<number, string> = {
  5: 'Loved it! Outstanding quality',
  4: 'Great piece! Very satisfied',
  3: 'Good quality & comfortable fit',
  2: 'Fair — expected a bit more',
  1: 'Not satisfied with item',
};

export const LovedByThousands = () => {
  const [userReviews, setUserReviews] = useState<ReviewItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [note, setNote] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);

  // Marquee state
  const x = useMotionValue(0);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const halfWidthRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  // Load reviews from client localStorage cache
  useEffect(() => {
    try {
      const cached = localStorage.getItem('shalistone_user_reviews');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setUserReviews(parsed);
        }
      }
    } catch (err) {
      console.warn('Error reading cached reviews:', err);
    }
  }, []);

  // Recalculate marquee width whenever reviews change
  useEffect(() => {
    if (trackRef.current) {
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    }
  }, [userReviews]);

  // Combined list with user reviews pinned first
  const allReviews = [...userReviews, ...DEFAULT_REVIEWS];
  const marquee = [...allReviews, ...allReviews];

  // Calculate dynamic stats
  const totalCount = 2000 + userReviews.length;
  const avgRating = (
    (DEFAULT_REVIEWS.reduce((acc, r) => acc + (r.rating || 5), 0) +
      userReviews.reduce((acc, r) => acc + (r.rating || 5), 0)) /
    (DEFAULT_REVIEWS.length + userReviews.length)
  ).toFixed(1);

  // Intersection observer for animation performance
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useAnimationFrame((_, delta) => {
    if (paused || !inView || !trackRef.current) return;
    if (!halfWidthRef.current) halfWidthRef.current = trackRef.current.scrollWidth / 2;
    let next = x.get() - (SPEED * delta) / 1000;
    if (next <= -halfWidthRef.current) next += halfWidthRef.current;
    x.set(next);
  });

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    const newReview: ReviewItem = {
      id: 'rev_' + Date.now(),
      img: '/looks/look_3.jpg', // stylish default photo
      name: name.trim() || 'Valued Client',
      note: note.trim(),
      rating,
      product: product.trim() || 'Verified Purchase',
      isUserReview: true,
      date: 'Saved in your cache',
    };

    const updated = [newReview, ...userReviews];
    setUserReviews(updated);
    try {
      localStorage.setItem('shalistone_user_reviews', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to cache review:', err);
    }

    // Reset form
    setName('');
    setProduct('');
    setNote('');
    setRating(5);
    setIsModalOpen(false);

    // Toast
    setToastMessage('Your review has been saved in your browser cache and added to the showcase!');
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDeleteReview = (id?: string) => {
    if (!id) return;
    const updated = userReviews.filter((r) => r.id !== id);
    setUserReviews(updated);
    try {
      localStorage.setItem('shalistone_user_reviews', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to update cache:', err);
    }
    setToastMessage('Review removed from your local cache.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-b from-[#efe7d9] to-[#f5f2eb] py-24 text-center">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-neutral-900/95 px-6 py-3 text-xs font-medium text-white shadow-2xl backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="px-6">
        <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">Our Community</span>
        <RevealText as="h2" text="Loved by Thousands" className="mb-6 text-4xl font-bold uppercase leading-[0.85] tracking-tighter md:text-6xl" />

        {/* Rating & Write a Review Actions */}
        <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-black/5 bg-white px-5 py-2.5 shadow-sm">
            <span className="text-sm tracking-tight text-amber-500">★★★★★</span>
            <span className="text-xs font-bold tracking-wide text-neutral-800">{avgRating} / 5</span>
            <span className="hidden text-[11px] font-medium uppercase tracking-widest text-neutral-500 sm:inline">
              from {totalCount.toLocaleString()}+ happy customers
            </span>
          </div>

          <button
            onClick={handleOpenModal}
            className="group inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-black hover:shadow-lg active:scale-95"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-amber-400 transition-transform group-hover:scale-110" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Active Cached Reviews Banner (if user has added any) */}
        {userReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto mb-10 max-w-2xl rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-left shadow-sm backdrop-blur-sm"
          >
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900">
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                Your Cached Reviews ({userReviews.length}) — Visible to you in this session
              </span>
              <span className="text-[10px] text-amber-700/80">Stored locally in cache</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {userReviews.map((ur) => (
                <div key={ur.id} className="flex items-center justify-between rounded-xl bg-white/90 p-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-neutral-800">{ur.name}</span>
                      <span className="text-[10px] text-amber-500">{'★'.repeat(ur.rating || 5)}</span>
                      {ur.product && <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] text-neutral-600">{ur.product}</span>}
                    </div>
                    <p className="mt-1 text-xs text-neutral-600 italic">“{ur.note}”</p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(ur.id)}
                    title="Delete review from cache"
                    className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Marquee Track */}
      <div
        className="relative flex w-full overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Edge fades keep the marquee feeling seamless */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#efe7d9] to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#f5f2eb] to-transparent md:w-28" />

        <motion.div ref={trackRef} style={{ x }} className="flex w-max gap-4 px-4 md:gap-5">
          {marquee.map((r, i) => (
            <div
              key={`${r.name}-${i}`}
              className={`group relative aspect-[4/5] w-[210px] flex-shrink-0 overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-xl md:w-[280px] ${
                r.isUserReview
                  ? 'ring-2 ring-amber-400 shadow-amber-200/50 bg-amber-950'
                  : 'bg-neutral-200 ring-1 ring-black/5'
              }`}
            >
              <img
                src={r.img}
                alt={`${r.name} review`}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${
                  r.isUserReview
                    ? 'from-black/85 via-black/35 to-amber-950/20'
                    : 'from-black/70 via-black/15 to-transparent'
                }`}
              />

              {/* Badges on Top */}
              <div className="absolute left-3 top-3 right-3 flex items-center justify-between">
                <div className="flex gap-0.5 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-xs">
                  {Array.from({ length: r.rating || 5 }).map((_, s) => (
                    <Star key={s} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {r.isUserReview ? (
                  <span className="flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-widest text-amber-950 shadow-sm">
                    <Sparkles className="h-2.5 w-2.5" />
                    Your Review
                  </span>
                ) : (
                  r.product && (
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[8px] font-semibold text-white/90 backdrop-blur-xs">
                      {r.product}
                    </span>
                  )
                )}
              </div>

              {/* Review Text on Bottom */}
              <div className="absolute inset-x-4 bottom-4 text-left text-white">
                <p className="font-serif text-base italic leading-snug line-clamp-3">“{r.note}”</p>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/95">
                      {r.name}
                    </p>
                    <p className="text-[9px] text-white/60">
                      {r.isUserReview ? 'Stored in your cache' : 'Verified Purchase'}
                    </p>
                  </div>
                  {r.isUserReview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteReview(r.id);
                      }}
                      title="Delete review"
                      className="rounded-full bg-white/20 p-1 text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Write Review Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-black/10 bg-[#FAF7F2] p-6 text-left shadow-2xl md:p-8"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute right-5 top-5 rounded-full bg-neutral-200/80 p-2 text-neutral-600 transition-colors hover:bg-neutral-300 hover:text-black"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Modal Header */}
              <div className="mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500">
                  Client Feedback
                </span>
                <h3 className="font-serif text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">
                  Share Your Experience
                </h3>
                <p className="mt-1.5 text-xs text-neutral-600">
                  Your review will be stored locally in your browser cache and showcased in the community feed for your session.
                </p>
              </div>

              {/* Review Form */}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Rating Selector */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 transition-colors ${
                              (hoverRating || rating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-neutral-600 ml-2">
                      {RATING_LABELS[hoverRating || rating]}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya R. or Alex K."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Item / Outfit Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Item Purchased (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Organic Cotton Romper, Linen Set"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Review Message */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Your Review
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe the fabric quality, comfort, fit, and how much you liked it..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                {/* Privacy / Cache Disclaimer */}
                <div className="flex items-center gap-2 rounded-xl bg-amber-500/10 p-3 text-[11px] text-amber-900">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600" />
                  <span>
                    Saved in your local browser cache. It remains private to your device and displays instantly in your community stream.
                  </span>
                </div>

                {/* Form Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="rounded-full px-5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-black transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-neutral-800 hover:shadow-lg active:scale-95"
                  >
                    <Check className="h-4 w-4" />
                    <span>Publish Review</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
