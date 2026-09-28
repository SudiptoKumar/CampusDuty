import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Phone, Mail, MapPin, Clock, Globe } from 'lucide-react';
import { useCreateTeacher } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AddTeacherPage() {
  const navigate = useNavigate();
  const createTeacher = useCreateTeacher();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [officeHours, setOfficeHours] = useState('');
  const [website, setWebsite] = useState('');
  
  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) return;
    
    await createTeacher.mutateAsync({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      office_hours: officeHours.trim() || null,
      website: website.trim() || null,
    });
    
    navigate('/teachers');
  };
  
  const isValid = firstName.trim() && lastName.trim();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <button 
          onClick={() => navigate('/teachers')}
          className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Button 
          onClick={handleSubmit}
          disabled={!isValid || createTeacher.isPending}
          className="rounded-full px-6"
        >
          {createTeacher.isPending ? 'Saving...' : 'Save'}
        </Button>
      </header>
      
      {/* Photo Placeholder */}
      <div className="bg-muted/50 h-48 flex items-center justify-center">
        <div className="text-muted-foreground">
          <Camera className="w-8 h-8" />
        </div>
      </div>
      
      {/* Form Fields */}
      <div className="divide-y divide-border">
        {/* Name */}
        <div className="flex items-center gap-4 px-4 py-3">
          <User className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Surname */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-5 h-5 shrink-0" /> {/* Spacer for alignment */}
          <Input
            placeholder="Surname"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Phone */}
        <div className="flex items-center gap-4 px-4 py-3">
          <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Add Phone Button */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-5 h-5 shrink-0" />
          <button className="text-primary text-sm font-medium flex items-center gap-1">
            <span className="text-lg">+</span> phone
          </button>
        </div>
        
        {/* Mail */}
        <div className="flex items-center gap-4 px-4 py-3">
          <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Add Mail Button */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-5 h-5 shrink-0" />
          <button className="text-primary text-sm font-medium flex items-center gap-1">
            <span className="text-lg">+</span> mail
          </button>
        </div>
        
        {/* Address */}
        <div className="flex items-center gap-4 px-4 py-3">
          <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Add Address Button */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-5 h-5 shrink-0" />
          <button className="text-primary text-sm font-medium flex items-center gap-1">
            <span className="text-lg">+</span> address
          </button>
        </div>
        
        {/* Office Hours */}
        <div className="flex items-center gap-4 px-4 py-3">
          <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Office hours"
            value={officeHours}
            onChange={(e) => setOfficeHours(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Add Office Hours Button */}
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="w-5 h-5 shrink-0" />
          <button className="text-primary text-sm font-medium flex items-center gap-1">
            <span className="text-lg">+</span> office hours
          </button>
        </div>
        
        {/* Website */}
        <div className="flex items-center gap-4 px-4 py-3">
          <Globe className="w-5 h-5 text-muted-foreground shrink-0" />
          <Input
            placeholder="Website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  );
}

export default AddTeacherPage;
