import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Play, Check, ListTodo } from 'lucide-react';
import { usePomodoroStore } from './usePomodoroStore';
import type { TaskCategory } from './types';

const CATEGORIES: { id: TaskCategory; label: string }[] = [
  { id: 'work', label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'study', label: 'Study' },
];

export default function TasksView() {
  const { tasks, addTask, removeTask, toggleTaskDone, setActiveTask, activeTaskId, setActiveTab } = usePomodoroStore();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [estimate, setEstimate] = useState(4);
  const [filter, setFilter] = useState<TaskCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  const activeTasks = tasks.filter(t => !t.done && (filter === 'all' || t.category === filter));
  const doneTasks = tasks.filter(t => t.done);

  const handleAdd = () => {
    if (!name.trim()) return;
    addTask(name.trim(), category, estimate);
    setName('');
    setEstimate(4);
    setShowForm(false);
  };

  const startWithTask = (id: string) => {
    setActiveTask(id);
    setActiveTab('timer');
  };

  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Tasks</h3>
          <p className="text-xs text-muted-foreground">{activeTasks.length} remaining</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" /> New</Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <Input placeholder="Task name" value={name} onChange={e => setName(e.target.value)} className="h-9 text-sm" />
            <div className="flex gap-1">
              {CATEGORIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${category === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Pomodoros:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <button
                    key={n}
                    onClick={() => setEstimate(n)}
                    className={`w-7 h-7 rounded-full text-xs font-bold transition-colors ${n <= estimate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full">Add Task</Button>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-1">
        {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map(c => (
          <button
            key={c.id}
            onClick={() => setFilter(c.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${filter === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {activeTasks.length === 0 && !showForm && (
        <div className="text-center py-8">
          <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No tasks yet</p>
        </div>
      )}

      {activeTasks.map(task => (
        <Card key={task.id} className={activeTaskId === task.id ? 'ring-2 ring-primary' : ''}>
          <CardContent className="p-3 flex items-center gap-3">
            <button onClick={() => toggleTaskDone(task.id)} className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{task.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{task.category}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: task.estimatedPomodoros }).map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i < task.completedPomodoros ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                  ))}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startWithTask(task.id)}><Play className="w-3.5 h-3.5" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeTask(task.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
          </CardContent>
        </Card>
      ))}

      {doneTasks.length > 0 && (
        <>
          <h4 className="text-xs font-medium text-muted-foreground mt-2">Completed ({doneTasks.length})</h4>
          {doneTasks.map(task => (
            <Card key={task.id} className="opacity-60">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm text-muted-foreground line-through truncate">{task.name}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto" onClick={() => removeTask(task.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
