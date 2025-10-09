import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PlayerHighlight } from '../hooks/usePlayerHighlights';

interface PlayerStoriesProps {
  highlights: PlayerHighlight[];
  playerName: string;
  playerImage?: string | null;
}

export function PlayerStories({ highlights, playerName, playerImage }: PlayerStoriesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-advance to next story
  useEffect(() => {
    if (highlights.length === 0) return;
    
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % highlights.length);
    }, 5000); // 5 seconds per story
    
    return () => clearInterval(timer);
  }, [highlights.length]);
  
  if (highlights.length === 0) {
    return null;
  }
  
  const currentHighlight = highlights[currentIndex];
  
  const handlePrevious = () => {
    setCurrentIndex(prev => prev === 0 ? highlights.length - 1 : prev - 1);
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % highlights.length);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const diff = e.clientX - startX;
    setTranslateX(diff);
  };
  
  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // If dragged more than 50px, change story
    if (translateX > 50) {
      handlePrevious();
    } else if (translateX < -50) {
      handleNext();
    }
    
    setTranslateX(0);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientX - startX;
    setTranslateX(diff);
  };
  
  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (translateX > 50) {
      handlePrevious();
    } else if (translateX < -50) {
      handleNext();
    }
    
    setTranslateX(0);
  };
  
  return (
    <div className="mb-6">
      {/* Header with sparkles icon */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Sparkles className="w-5 h-5 text-[#78BE20]" />
        <h3 className="text-lg font-bold text-white">Player Highlights</h3>
        <span className="text-sm text-gray-400">({highlights.length} stories)</span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-3">
          {highlights.map((_, index) => (
            <div 
              key={index} 
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"
            >
              <div 
                className={`h-full bg-white transition-all duration-300 ${
                  index === currentIndex ? 'w-full' : index < currentIndex ? 'w-full' : 'w-0'
                }`}
                style={{
                  transitionDuration: index === currentIndex ? '5000ms' : '300ms'
                }}
              />
            </div>
          ))}
        </div>
        
        {/* Story content */}
        <div 
          className={`relative transition-transform duration-300 ${isDragging ? 'transition-none' : ''}`}
          style={{ transform: `translateX(${translateX}px)` }}
        >
          <div 
            className={`relative h-[460px] md:h-[500px] bg-gradient-to-br from-[#141923] via-[#141923]/95 to-[#0f1119] p-6 md:p-8 pb-20 md:pb-8 flex flex-col justify-between rounded-2xl ring-1 ring-white/10`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with player info */}
              <div className="flex items-center gap-3 mb-6">
                {playerImage ? (
                  <img
                    src={playerImage}
                    alt={playerName}
                    className="w-12 h-12 rounded-full border-2 border-white object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold">{playerName[0]}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg leading-tight truncate">{playerName}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white/70 text-xs">{currentHighlight.context || 'Player Highlight'}</p>
                    {typeof currentHighlight.rank === 'number' && currentHighlight.rank > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 border border-white/10 text-white/90">#{currentHighlight.rank}</span>
                    )}
                  </div>
                </div>
                {currentHighlight.badge && (
                  <div className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-bold">{currentHighlight.badge}</span>
                  </div>
                )}
              </div>
              
              {/* Main content */}
              <div className="text-center mb-10 md:mb-8 px-8 md:px-0">
                {/* Title */}
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-2 tracking-tight">
                  {currentHighlight.title}
                </h2>
                
                {/* Description */}
                <p className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/90 text-sm md:text-base font-medium mb-5">
                  {currentHighlight.description}
                </p>
                
                {/* Value */}
                <div className="bg-white/8 backdrop-blur-sm rounded-2xl p-4 md:p-5 inline-block border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                  <p className="text-4xl md:text-6xl font-extrabold text-white">
                    {currentHighlight.value}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Context at bottom */}
            {currentHighlight.context && (
              <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                <p className="text-white/80 text-xs md:text-sm font-medium">{currentHighlight.context}</p>
              </div>
            )}
            
            {/* Navigation buttons */}
            <button
              key={`left-${currentIndex}`}
              onClick={handlePrevious}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full p-2 md:p-3 transition-all ring-1 ring-white/20 shadow-lg"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
            
            <button
              key={`right-${currentIndex}`}
              onClick={handleNext}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-full p-2 md:p-3 transition-all ring-1 ring-white/20 shadow-lg"
              aria-label="Next story"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>
        </div>
        
        {/* Counter */}
        <div className="absolute right-3 top-3 md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:right-auto md:top-auto z-20 bg-black/50 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full">
          <p className="text-white text-xs md:text-sm font-medium">
            {currentIndex + 1} / {highlights.length}
          </p>
        </div>
      </div>
      
      {/* Quick navigation dots */}
      <div className="flex justify-center gap-2 mt-4">
        {highlights.slice(0, Math.min(10, highlights.length)).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex 
                ? 'bg-[#78BE20] w-6' 
                : 'bg-gray-600 hover:bg-gray-500'
            }`}
            aria-label={`Go to story ${index + 1}`}
          />
        ))}
        {highlights.length > 10 && (
          <span className="text-gray-400 text-xs">+{highlights.length - 10}</span>
        )}
      </div>
      
      {/* Swipe hint */}
      <p className="text-center text-gray-400 text-xs mt-2">
        Swipe or click arrows to navigate • Auto-advances every 5s
      </p>
    </div>
  );
}

