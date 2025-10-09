import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Pause, Play } from 'lucide-react';
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
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auto-advance to next story
  useEffect(() => {
    if (highlights.length === 0 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % highlights.length);
    }, 5000); // 5 seconds per story

    return () => clearInterval(timer);
  }, [highlights.length, isPaused]);
  
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

  const handlePauseToggle = () => {
    setIsPaused(prev => !prev);
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
                      transitionDuration: index === currentIndex ? (isPaused ? '0ms' : '5000ms') : '300ms'
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Pause/Play button */}
            <button
              onClick={handlePauseToggle}
              className="absolute top-3 right-3 z-30 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 transition-all ring-1 ring-white/20 shadow-lg"
              aria-label={isPaused ? 'Play stories' : 'Pause stories'}
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-white" />
              ) : (
                <Pause className="w-4 h-4 text-white" />
              )}
            </button>
        
        {/* Story content */}
        <div 
          className={`relative transition-transform duration-300 ${isDragging ? 'transition-none' : ''}`}
          style={{ transform: `translateX(${translateX}px)` }}
        >
        <div
          className={`relative h-[800px] md:h-[900px] bg-gradient-to-br from-[#1e2129] via-[#1e2129]/95 to-[#1a1d24] p-6 md:p-8 pb-20 md:pb-8 rounded-2xl`}
          >
            
            {/* Content */}
            <div className="relative z-10">
              {/* Player name and context header */}
              <div className="mb-4">
                <p className="text-white font-bold text-xl md:text-2xl">{playerName}</p>
                <p className="text-gray-400 text-sm">{currentHighlight.context || 'Player Highlight'}</p>
              </div>
              
              {/* Main highlight box with integrated player image */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 mb-3">
                <div className="flex gap-6 items-center">
                  {/* Player image inside the highlight box */}
                  <div className="flex-shrink-0">
                    {playerImage ? (
                      <img
                        src={playerImage}
                        alt={playerName}
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/20 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl md:text-3xl">{playerName[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Content next to player image */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                      <span className="text-[#78BE20]">{playerName}</span> {currentHighlight.title.replace(playerName, '').trim()}
                    </h2>
                    <p className="text-white/90 text-lg mb-4">
                      {currentHighlight.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="text-4xl md:text-5xl font-black text-[#78BE20]">
                        {currentHighlight.value}
                      </span>
                      {typeof currentHighlight.rank === 'number' && currentHighlight.rank > 0 && (
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-[#78BE20]/20 text-[#78BE20] border border-[#78BE20]/30">#{currentHighlight.rank}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top 10 Players Context */}
              {currentHighlight.top10Players && currentHighlight.top10Players.length > 0 && (
                <div className="relative z-10 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-white/60 text-sm mb-3 font-medium">Top 10 in this stat:</p>
                  <div className="grid grid-cols-1 gap-1 text-sm max-h-80 overflow-y-auto">
                    {currentHighlight.top10Players.slice(0, 10).map((player, index) => (
                      <div key={index} className={`flex justify-between items-center px-3 py-1.5 rounded-lg ${
                        player.name === playerName ? 'bg-[#78BE20]/20 text-[#78BE20] border border-[#78BE20]/30' : 'bg-white/5 text-white/80'
                      }`}>
                        <span className="truncate font-medium text-xs">{player.name}</span>
                        <span className="ml-2 font-bold text-xs">{player.value}</span>
                      </div>
                    ))}
                    {currentHighlight.top10Players.length > 10 && (
                      <div className="text-center text-white/50 text-xs py-1">
                        +{currentHighlight.top10Players.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
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

