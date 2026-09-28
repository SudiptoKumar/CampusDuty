import { Mic } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';

export function RecordingsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Recordings</h1>
        <p className="text-muted-foreground text-sm">
          Record and save class lectures
        </p>
      </header>
      
      <EmptyState
        icon={<Mic className="w-8 h-8" />}
        title="No recordings yet"
        description="Record your lectures to review them later"
      />
    </div>
  );
}

export default RecordingsPage;
