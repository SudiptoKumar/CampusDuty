import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

type Category = 'length' | 'weight' | 'temperature' | 'data';

const units: Record<Category, { label: string; value: string }[]> = {
  length: [
    { label: 'Millimeter', value: 'mm' }, { label: 'Centimeter', value: 'cm' },
    { label: 'Meter', value: 'm' }, { label: 'Kilometer', value: 'km' },
    { label: 'Inch', value: 'in' }, { label: 'Foot', value: 'ft' }, { label: 'Mile', value: 'mi' },
  ],
  weight: [
    { label: 'Gram', value: 'g' }, { label: 'Kilogram', value: 'kg' },
    { label: 'Pound', value: 'lb' }, { label: 'Ounce', value: 'oz' },
  ],
  temperature: [
    { label: 'Celsius', value: 'C' }, { label: 'Fahrenheit', value: 'F' }, { label: 'Kelvin', value: 'K' },
  ],
  data: [
    { label: 'Byte', value: 'B' }, { label: 'Kilobyte', value: 'KB' },
    { label: 'Megabyte', value: 'MB' }, { label: 'Gigabyte', value: 'GB' }, { label: 'Terabyte', value: 'TB' },
  ],
};

const toBase: Record<string, (v: number) => number> = {
  mm: v => v / 1000, cm: v => v / 100, m: v => v, km: v => v * 1000, in: v => v * 0.0254, ft: v => v * 0.3048, mi: v => v * 1609.344,
  g: v => v, kg: v => v * 1000, lb: v => v * 453.592, oz: v => v * 28.3495,
  C: v => v, F: v => (v - 32) * 5 / 9, K: v => v - 273.15,
  B: v => v, KB: v => v * 1024, MB: v => v * 1048576, GB: v => v * 1073741824, TB: v => v * 1099511627776,
};

const fromBase: Record<string, (v: number) => number> = {
  mm: v => v * 1000, cm: v => v * 100, m: v => v, km: v => v / 1000, in: v => v / 0.0254, ft: v => v / 0.3048, mi: v => v / 1609.344,
  g: v => v, kg: v => v / 1000, lb: v => v / 453.592, oz: v => v / 28.3495,
  C: v => v, F: v => v * 9 / 5 + 32, K: v => v + 273.15,
  B: v => v, KB: v => v / 1024, MB: v => v / 1048576, GB: v => v / 1073741824, TB: v => v / 1099511627776,
};

function convert(value: number, from: string, to: string): number {
  if (from === to) return value;
  return fromBase[to](toBase[from](value));
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('km');
  const [fromValue, setFromValue] = useState('1');
  const [swapRotation, setSwapRotation] = useState(0);

  const numVal = parseFloat(fromValue) || 0;
  const result = convert(numVal, fromUnit, toUnit);

  const handleCategoryChange = (cat: string) => {
    const c = cat as Category;
    setCategory(c);
    setFromUnit(units[c][0].value);
    setToUnit(units[c][1].value);
    setFromValue('1');
  };

  const swap = () => {
    setSwapRotation(prev => prev + 180);
    const newFrom = toUnit;
    const newTo = fromUnit;
    setFromUnit(newFrom);
    setToUnit(newTo);
    setFromValue(result.toString());
  };

  const fromLabel = units[category].find(u => u.value === fromUnit)?.label || fromUnit;
  const toLabel = units[category].find(u => u.value === toUnit)?.label || toUnit;

  return (
    <div className="flex flex-col gap-4 py-2">
      <Tabs value={category} onValueChange={handleCategoryChange}>
        <TabsList className="w-full">
          <TabsTrigger value="length" className="flex-1 text-xs">Length</TabsTrigger>
          <TabsTrigger value="weight" className="flex-1 text-xs">Weight</TabsTrigger>
          <TabsTrigger value="temperature" className="flex-1 text-xs">Temp</TabsTrigger>
          <TabsTrigger value="data" className="flex-1 text-xs">Data</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-4 space-y-3">
          {/* From */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">From</span>
            <div className="flex gap-2">
              <Input type="number" value={fromValue} onChange={e => setFromValue(e.target.value)} className="flex-1 h-10 text-lg font-semibold" />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units[category].map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Swap */}
          <div className="flex justify-center">
            <motion.div animate={{ rotate: swapRotation }} transition={{ duration: 0.3 }}>
              <Button variant="outline" size="icon" onClick={swap} className="rounded-full h-9 w-9">
                <ArrowDownUp className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* To */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-medium">To</span>
            <div className="flex gap-2">
              <Input type="number" value={result.toFixed(6).replace(/\.?0+$/, '')} readOnly className="flex-1 h-10 text-lg font-semibold bg-muted/30" />
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {units[category].map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Formula */}
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            {numVal} {fromLabel} = {result.toFixed(6).replace(/\.?0+$/, '')} {toLabel}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
