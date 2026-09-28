import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, PlusCircle, Vote, BarChart3 } from 'lucide-react';
import MyPollsView from './MyPollsView';
import CreatePollView from './CreatePollView';
import PollLiveView from './PollLiveView';
import VotingView from './VotingView';
import ResultsView from './ResultsView';

type Tab = 'my-polls' | 'create' | 'vote' | 'results';

interface Poll {
  id: string;
  question: string;
  options: { label: string }[];
  share_code: string | null;
  created_at: string;
  user_id: string;
}

const TABS: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'my-polls', label: 'My Polls', icon: LayoutDashboard },
  { id: 'create', label: 'Create', icon: PlusCircle },
  { id: 'vote', label: 'Vote', icon: Vote },
  { id: 'results', label: 'Results', icon: BarChart3 },
];

export default function QuickPollApp() {
  const [activeTab, setActiveTab] = useState<Tab>('my-polls');
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [livePoll, setLivePoll] = useState<Poll | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handlePollCreated = (poll: Poll) => {
    setLivePoll(poll);
    setActiveTab('vote'); // show live/share temporarily
    setRefreshKey(k => k + 1);
  };

  const handleViewResults = (poll: Poll) => {
    setSelectedPoll(poll);
    setActiveTab('results');
  };

  const handleVote = (poll: Poll) => {
    setSelectedPoll(poll);
    setActiveTab('vote');
  };

  const handleShare = (poll: Poll) => {
    setLivePoll(poll);
    // We'll show live view inline in vote tab
  };

  const renderView = () => {
    if (activeTab === 'vote' && livePoll) {
      return <PollLiveView poll={livePoll} onDone={() => { setLivePoll(null); setActiveTab('my-polls'); }} />;
    }
    switch (activeTab) {
      case 'my-polls':
        return <MyPollsView refreshKey={refreshKey} onViewResults={handleViewResults} onVote={handleVote} onShare={handleShare} />;
      case 'create':
        return <CreatePollView onCreated={handlePollCreated} />;
      case 'vote':
        return selectedPoll
          ? <VotingView poll={selectedPoll} onViewResults={() => handleViewResults(selectedPoll)} onBack={() => { setSelectedPoll(null); setActiveTab('my-polls'); }} />
          : <MyPollsView refreshKey={refreshKey} onViewResults={handleViewResults} onVote={handleVote} onShare={handleShare} />;
      case 'results':
        return selectedPoll
          ? <ResultsView poll={selectedPoll} onBack={() => { setSelectedPoll(null); setActiveTab('my-polls'); }} />
          : <MyPollsView refreshKey={refreshKey} onViewResults={handleViewResults} onVote={handleVote} onShare={handleShare} />;
    }
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col">
      <div className="flex-1 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedPoll?.id || '') + (livePoll?.id || '')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around py-1.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== 'results') setSelectedPoll(null);
                  if (tab.id !== 'vote') setLivePoll(null);
                }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
