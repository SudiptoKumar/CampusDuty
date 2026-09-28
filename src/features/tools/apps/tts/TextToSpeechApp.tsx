import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Upload, Settings2, Library } from 'lucide-react';
import ReaderView from './ReaderView';
import UploadView from './UploadView';
import VoiceSettingsView from './VoiceSettingsView';
import LibraryView from './LibraryView';
import type { TTSTab } from './types';

const TABS: { id: TTSTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'reader', label: 'Reader', icon: BookOpen },
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'voice', label: 'Voice', icon: Settings2 },
  { id: 'library', label: 'Library', icon: Library },
];

export default function TextToSpeechApp() {
  const [activeTab, setActiveTab] = useState<TTSTab>('reader');

  const renderView = () => {
    switch (activeTab) {
      case 'reader': return <ReaderView />;
      case 'upload': return <UploadView onUploaded={() => setActiveTab('reader')} />;
      case 'voice': return <VoiceSettingsView />;
      case 'library': return <LibraryView onUpload={() => setActiveTab('upload')} onOpen={() => setActiveTab('reader')} />;
    }
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col">
      <div className="flex-1 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
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
                onClick={() => setActiveTab(tab.id)}
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
