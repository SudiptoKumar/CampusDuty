import { useState, useEffect, useMemo } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STUDY_QUOTES = [
  { quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { quote: "Education is the passport to the future.", author: "Malcolm X" },
  { quote: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
  { quote: "The beautiful thing about learning is nobody can take it from you.", author: "B.B. King" },
  { quote: "Don't let what you cannot do interfere with what you can do.", author: "John Wooden" },
  { quote: "The more you learn, the more places you'll go.", author: "Dr. Seuss" },
  { quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { quote: "Your limitation—it's only your imagination.", author: "Unknown" },
  { quote: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { quote: "Great things never come from comfort zones.", author: "Unknown" },
  { quote: "Dream it. Wish it. Do it.", author: "Unknown" },
  { quote: "Stay focused and never give up on your dreams.", author: "Unknown" },
  { quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { quote: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { quote: "The expert in anything was once a beginner.", author: "Helen Hayes" },
];

const STUDY_TIPS = [
  "🎯 Break your study sessions into 25-minute focused blocks",
  "📝 Review your notes within 24 hours to boost retention",
  "💤 Get 7-8 hours of sleep for better memory consolidation",
  "🚶 Take short walks between study sessions to refresh your mind",
  "📚 Teach concepts to others to deepen your understanding",
  "🎧 Try ambient sounds or lo-fi music for better focus",
  "💧 Stay hydrated – your brain needs water to function well",
  "🍎 Eat brain-boosting foods like nuts, berries, and fish",
  "📱 Put your phone in another room while studying",
  "✍️ Write by hand to improve memory retention",
];

export function MotivationalQuoteWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTip, setShowTip] = useState(false);
  
  // Get a consistent daily quote based on date
  const dailyQuote = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return STUDY_QUOTES[dayOfYear % STUDY_QUOTES.length];
  }, []);
  
  const dailyTip = useMemo(() => {
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    return STUDY_TIPS[dayOfYear % STUDY_TIPS.length];
  }, []);
  
  const handleRefresh = () => {
    setShowTip(!showTip);
  };

  return (
    <section className="surface-card p-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <span className="font-semibold text-sm">{showTip ? 'Study Tip' : 'Daily Quote'}</span>
          </div>
          <button 
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        
        <AnimatePresence mode="wait">
          {showTip ? (
            <motion.div
              key="tip"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-[60px]"
            >
              <p className="text-sm leading-relaxed">{dailyTip}</p>
            </motion.div>
          ) : (
            <motion.div
              key="quote"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="min-h-[60px]"
            >
              <p className="text-sm leading-relaxed italic">"{dailyQuote.quote}"</p>
              <p className="text-xs text-muted-foreground mt-2">— {dailyQuote.author}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Toggle indicator */}
        <div className="flex justify-center gap-1.5 mt-4">
          <button
            onClick={() => setShowTip(false)}
            className={`w-2 h-2 rounded-full transition-colors ${!showTip ? 'bg-primary' : 'bg-muted'}`}
          />
          <button
            onClick={() => setShowTip(true)}
            className={`w-2 h-2 rounded-full transition-colors ${showTip ? 'bg-primary' : 'bg-muted'}`}
          />
        </div>
      </div>
    </section>
  );
}
