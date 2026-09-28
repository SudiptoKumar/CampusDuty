import { useState } from 'react';
import { Target, Plus, Check, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGoals, useAddGoal, useUpdateGoalProgress, useDeleteGoal } from '@/hooks/useGoals';
import { useUnlockAchievement, useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';

export function GoalsWidget() {
  const { data: goals, isLoading } = useGoals();
  const { data: achievements } = useAchievements();
  const { mutate: addGoal, isPending: isAdding } = useAddGoal();
  const { mutate: updateProgress } = useUpdateGoalProgress();
  const { mutate: deleteGoal } = useDeleteGoal();
  const { mutate: unlockAchievement } = useUnlockAchievement();
  
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', target: 10 });
  
  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    
    addGoal({
      title: newGoal.title,
      target: newGoal.target,
    });
    
    setNewGoal({ title: '', target: 10 });
    setIsAddingNew(false);
  };
  
  const handleUpdateProgress = (id: string, current: number, target: number, increment: number) => {
    const newCurrent = Math.max(0, Math.min(target, current + increment));
    updateProgress({ id, current: newCurrent });
    
    // Check for goal completion achievement
    if (newCurrent >= target) {
      const unlockedKeys = new Set(achievements?.map((a) => a.achievement_key) || []);
      if (!unlockedKeys.has('goal_complete')) {
        unlockAchievement('goal_complete');
      }
      
      // Check for 5 goals completed
      const completedGoals = (goals?.filter((g) => g.is_completed).length || 0) + 1;
      if (completedGoals >= 5 && !unlockedKeys.has('goals_5')) {
        unlockAchievement('goals_5');
      }
    }
  };
  
  const completedGoals = goals?.filter((g) => g.current >= g.target).length || 0;

  if (isLoading) {
    return (
      <section className="surface-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
            <Target className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Goals</h2>
            <p className="text-xs text-muted-foreground">{completedGoals}/{goals?.length || 0} completed</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="h-8 w-8 p-0"
        >
          <Plus className={`w-4 h-4 transition-transform ${isAddingNew ? 'rotate-45' : ''}`} />
        </Button>
      </div>
      
      {/* Add Goal Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mb-4 pb-4 border-b border-border/30">
              <Input
                placeholder="Goal title..."
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="h-9 text-sm"
              />
              <Input
                type="number"
                placeholder="Target"
                value={newGoal.target}
                onChange={(e) => setNewGoal({ ...newGoal, target: parseInt(e.target.value) || 0 })}
                className="h-9 text-sm w-20"
              />
              <Button size="sm" onClick={handleAddGoal} disabled={isAdding} className="h-9">
                Add
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Goals List */}
      <div className="space-y-3">
        {!goals || goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No goals yet</p>
            <p className="text-xs text-muted-foreground">Add your first goal to track progress</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = Math.min((goal.current / goal.target) * 100, 100);
            const isComplete = progress >= 100;
            
            return (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-xl transition-colors ${isComplete ? 'bg-emerald-500/10' : 'bg-muted/30'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isComplete ? 'bg-emerald-500' : 'border-2'
                      }`}
                      style={{ borderColor: !isComplete ? goal.color : undefined }}
                    >
                      {isComplete && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm font-medium truncate ${isComplete ? 'line-through text-muted-foreground' : ''}`}>
                      {goal.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {goal.current}/{goal.target}
                    </span>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: isComplete ? '#22c55e' : goal.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => handleUpdateProgress(goal.id, goal.current, goal.target, -1)}
                      className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted text-xs flex items-center justify-center transition-colors"
                      disabled={goal.current <= 0}
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleUpdateProgress(goal.id, goal.current, goal.target, 1)}
                      className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted text-xs flex items-center justify-center transition-colors"
                      disabled={goal.current >= goal.target}
                    >
                      +
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
