import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Under Maintenance</h1>
          <p className="text-muted-foreground mt-2">
            Campus Duty is currently undergoing scheduled maintenance. We'll be back shortly!
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground">
            Please check back in a few minutes. We're working to improve your experience.
          </p>
        </div>
      </div>
    </div>
  );
}
