import { useState } from 'react';
import { useUpdateTeacher } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';

type Teacher = Database['public']['Tables']['teachers']['Row'];

interface EditTeacherFormProps {
  teacher: Teacher;
  onClose: () => void;
}

export function EditTeacherForm({ teacher, onClose }: EditTeacherFormProps) {
  const updateTeacher = useUpdateTeacher();
  
  const [firstName, setFirstName] = useState(teacher.first_name);
  const [lastName, setLastName] = useState(teacher.last_name);
  const [email, setEmail] = useState(teacher.email || '');
  const [phone, setPhone] = useState(teacher.phone || '');
  const [officeHours, setOfficeHours] = useState(teacher.office_hours || '');
  const [address, setAddress] = useState(teacher.address || '');
  const [website, setWebsite] = useState(teacher.website || '');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim()) return;
    
    await updateTeacher.mutateAsync({
      id: teacher.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      office_hours: officeHours.trim() || null,
      address: address.trim() || null,
      website: website.trim() || null,
    });
    
    onClose();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="e.g., John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="e.g., Smith"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email (Optional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="teacher@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone (Optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+1 555-0123"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="officeHours">Office Hours (Optional)</Label>
        <Input
          id="officeHours"
          placeholder="e.g., Mon/Wed 2-4 PM"
          value={officeHours}
          onChange={(e) => setOfficeHours(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Office Address (Optional)</Label>
        <Input
          id="address"
          placeholder="e.g., Room 302, Building A"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="website">Website (Optional)</Label>
        <Input
          id="website"
          type="url"
          placeholder="https://..."
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1" 
          disabled={!firstName.trim() || !lastName.trim() || updateTeacher.isPending}
        >
          {updateTeacher.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
