import { useState, useMemo } from 'react';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useExpenses';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Plus, Trash2, TrendingUp, Wallet, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORIES = [
  { value: 'food', label: 'Food', color: 'hsl(35, 90%, 55%)', icon: '🍔' },
  { value: 'transport', label: 'Transport', color: 'hsl(200, 80%, 50%)', icon: '🚌' },
  { value: 'books', label: 'Books', color: 'hsl(262, 83%, 58%)', icon: '📚' },
  { value: 'supplies', label: 'Supplies', color: 'hsl(142, 71%, 45%)', icon: '✏️' },
  { value: 'entertainment', label: 'Entertainment', color: 'hsl(340, 80%, 55%)', icon: '🎮' },
  { value: 'other', label: 'Other', color: 'hsl(0, 0%, 50%)', icon: '📦' },
];

export default function ExpenseTrackerApp() {
  const { data: expenses = [], isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthExpenses = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return expenses.filter(e => {
      const d = parseISO(e.expense_date);
      return d >= start && d <= end;
    });
  }, [expenses]);

  const totalThisMonth = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return CATEGORIES.filter(c => map[c.value]).map(c => ({
      name: c.label,
      value: map[c.value],
      color: c.color,
      icon: c.icon,
    }));
  }, [monthExpenses]);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    createExpense.mutate(
      { amount: amt, category, description: description || undefined, expense_date: expenseDate },
      {
        onSuccess: () => {
          toast.success('Expense added');
          setAmount(''); setDescription('');
        },
        onError: () => toast.error('Failed to add'),
      }
    );
  };

  const getCat = (val: string) => CATEGORIES.find(c => c.value === val) || CATEGORIES[5];

  return (
    <div className="py-4 space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="add">Add</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><Wallet className="w-4 h-4" /> This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">৳{totalThisMonth.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{monthExpenses.length} transactions</p>
            </CardContent>
          </Card>

          {categoryBreakdown.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> By Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryBreakdown} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {categoryBreakdown.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `৳${v.toFixed(2)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categoryBreakdown.map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-xs">
                      <span>{c.icon}</span>
                      <span className="text-muted-foreground">{c.name}</span>
                      <span className="ml-auto font-medium">৳{c.value.toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount (৳)</label>
                <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} min="0" step="0.01" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <Input placeholder="What was it for?" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
              </div>
              <Button onClick={handleAdd} disabled={createExpense.isPending} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Expense
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-2 mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses yet</p>
          ) : (
            expenses.slice(0, 50).map(e => {
              const cat = getCat(e.category);
              return (
                <Card key={e.id}>
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.description || cat.label}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(e.expense_date), 'MMM d, yyyy')}</p>
                    </div>
                    <span className="text-sm font-semibold text-destructive flex items-center gap-0.5">
                      <ArrowDown className="w-3 h-3" />৳{Number(e.amount).toFixed(2)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteExpense.mutate(e.id, { onSuccess: () => toast.success('Deleted') })}>
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
