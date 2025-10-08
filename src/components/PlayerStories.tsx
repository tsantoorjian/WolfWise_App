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
            className={`relative h-[460px] md:h-[500px] bg-gradient-to-br ${currentHighlight.gradient} p-6 md:p-8 pb-20 md:pb-8 flex flex-col justify-between`}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:40px_40px]" />
            </div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header with player info */}
              <div className="flex items-center gap-3 mb-8">
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
                <div>
                  <p className="text-white font-bold text-lg">{playerName}</p>
                  <p className="text-white/80 text-sm">{currentHighlight.context || 'Player Highlight'}</p>
                </div>
                {currentHighlight.badge && (
                  <div className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                    <span className="text-white text-sm font-bold">{currentHighlight.badge}</span>
                  </div>
                )}
              </div>
              
              {/* Main content */}
              <div className="text-center mb-10 md:mb-8">
                {/* Icon */}
                <div className="text-5xl md:text-6xl mb-4">
                  {currentHighlight.icon}
                </div>
                
                {/* Title */}
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3 drop-shadow-lg">
                  {currentHighlight.title}
                </h2>
                
                {/* Description */}
                <p className="text-lg md:text-2xl text-white/90 font-semibold mb-4">
                  {currentHighlight.description}
                </p>
                
                {/* Value */}
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 inline-block">
                  <p className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">
                    {currentHighlight.value}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Context at bottom */}
            {currentHighlight.context && (
              <div className="relative z-10 bg-black/30 backdrop-blur-sm rounded-xl p-4 text-center">
                <p className="text-white/90 text-sm font-medium">{currentHighlight.context}</p>
              </div>
            )}
            
            {/* Navigation buttons */}
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all"
              aria-label="Previous story"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full p-3 transition-all"
              aria-label="Next story"
            >
              <ChevronRight className="w-6 h-6 text-white" />
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

