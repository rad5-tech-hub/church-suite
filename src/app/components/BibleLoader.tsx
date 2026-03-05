/**
 * Animated flipping bible loading indicator.
 * Uses pure CSS keyframe animations for the page-turning effect.
 */
export function BibleLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative w-16 h-20 mb-4">
        {/* Book base */}
        <div className="absolute inset-0 bg-amber-800 rounded-sm shadow-lg" />
        {/* Spine */}
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-amber-900 rounded-l-sm" />
        {/* Pages */}
        <div className="absolute top-1 right-1 bottom-1 left-3 bg-amber-50 rounded-r-sm overflow-hidden">
          {/* Page lines */}
          <div className="mt-3 mx-2 space-y-1.5">
            <div className="h-0.5 bg-amber-200/60 rounded" />
            <div className="h-0.5 bg-amber-200/60 rounded w-4/5" />
            <div className="h-0.5 bg-amber-200/60 rounded" />
            <div className="h-0.5 bg-amber-200/60 rounded w-3/5" />
            <div className="h-0.5 bg-amber-200/60 rounded w-4/5" />
            <div className="h-0.5 bg-amber-200/60 rounded" />
          </div>
        </div>
        {/* Flipping page 1 */}
        <div
          className="absolute top-1 right-1 bottom-1 left-3 bg-amber-50 rounded-r-sm origin-left"
          style={{
            animation: 'bibleFlip 2s ease-in-out infinite',
            animationDelay: '0s',
          }}
        >
          <div className="mt-3 mx-2 space-y-1.5">
            <div className="h-0.5 bg-amber-200/40 rounded" />
            <div className="h-0.5 bg-amber-200/40 rounded w-3/4" />
            <div className="h-0.5 bg-amber-200/40 rounded w-5/6" />
          </div>
        </div>
        {/* Flipping page 2 */}
        <div
          className="absolute top-1 right-1 bottom-1 left-3 bg-amber-100 rounded-r-sm origin-left"
          style={{
            animation: 'bibleFlip 2s ease-in-out infinite',
            animationDelay: '0.3s',
          }}
        >
          <div className="mt-3 mx-2 space-y-1.5">
            <div className="h-0.5 bg-amber-200/30 rounded w-4/5" />
            <div className="h-0.5 bg-amber-200/30 rounded" />
          </div>
        </div>
        {/* Cross on cover */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-amber-400 rounded-full opacity-80" style={{ marginLeft: '1px' }} />
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-2.5 h-0.5 bg-amber-400 rounded-full opacity-80" style={{ marginLeft: '1px' }} />
      </div>
      <p className="text-sm text-gray-500 animate-pulse">{message}</p>

      <style>{`
        @keyframes bibleFlip {
          0% { transform: rotateY(0deg); }
          30% { transform: rotateY(-180deg); }
          50% { transform: rotateY(-180deg); }
          80% { transform: rotateY(0deg); }
          100% { transform: rotateY(0deg); }
        }
      `}</style>
    </div>
  );
}
