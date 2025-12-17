
import React, { useState } from 'react';
import { Volunteer, Assignment, Item } from '../types';
import { Search, Plus, Phone, Trash2, MapPin, User, ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface VolunteerListProps {
  volunteers: Volunteer[];
  assignments: Assignment[];
  items: Item[];
  onAddVolunteer: (volunteer: Partial<Volunteer>) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
  onReturnItem: (assignmentId: string) => void;
}

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-600', 
    'bg-purple-100 text-purple-600', 
    'bg-pink-100 text-pink-600', 
    'bg-indigo-100 text-indigo-600', 
    'bg-orange-100 text-orange-600',
    'bg-teal-100 text-teal-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

export const VolunteerList: React.FC<VolunteerListProps> = ({
  volunteers,
  assignments,
  items,
  onAddVolunteer,
  onDeleteVolunteer,
  onReturnItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const filteredVolunteers = volunteers.filter(v => 
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm) ||
    v.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeAssignments = selectedVolunteer 
    ? assignments.filter(a => a.volunteerId === selectedVolunteer.id)
    : [];

  const handleSave = () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    // We omit ID here to let Supabase generate a proper UUID
    onAddVolunteer({ 
      first_name: newFirstName.trim(), 
      last_name: newLastName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim()
    });
    setNewFirstName(''); 
    setNewLastName(''); 
    setNewPhone(''); 
    setNewAddress('');
    setIsAddOpen(false);
  };

  const handleDeleteProfile = () => {
    if (selectedVolunteer && confirm(`Delete profile for "${selectedVolunteer.first_name} ${selectedVolunteer.last_name}"?`)) {
      onDeleteVolunteer(selectedVolunteer.id);
      setSelectedVolunteer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/60" size={18} />
          <input 
            type="text" 
            placeholder="Search people..." 
            className="w-full pl-11 pr-4 py-3 rounded-[14px] border border-iosDivider/20 bg-white shadow-sm text-[17px] focus:outline-none placeholder-iosGray/50 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setIsAddOpen(true)} 
          className="w-12 h-12 bg-iosBlue text-white rounded-[14px] flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus size={26} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {filteredVolunteers.length > 0 ? filteredVolunteers.map((vol) => {
          const heldAssignments = assignments.filter(a => a.volunteerId === vol.id);
          const totalUnits = heldAssignments.reduce((sum, a) => sum + a.quantity_assigned, 0);
          const fullName = `${vol.first_name} ${vol.last_name}`;
          const initials = `${vol.first_name.charAt(0)}${vol.last_name.charAt(0)}`.toUpperCase();
          
          return (
            <div 
              key={vol.id} 
              onClick={() => setSelectedVolunteer(vol)}
              className="group bg-white rounded-2xl border border-iosDivider/10 p-5 shadow-sm hover:shadow-md active:bg-iosBg transition-all cursor-pointer relative"
            >
              {totalUnits > 0 && (
                <div className="absolute top-4 right-4 bg-iosBlue text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-sm z-10">
                  {totalUnits} Units
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner shrink-0 ${getAvatarColor(fullName)}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <h3 className="text-[17px] font-bold text-black truncate">{fullName}</h3>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {vol.phone && (
                      <div className="flex items-center gap-2 text-[13px] text-iosGray">
                        <Phone size={12} className="shrink-0 text-iosBlue/60" />
                        <span className="truncate">{vol.phone}</span>
                      </div>
                    )}
                    {heldAssignments.length > 0 && (
                      <div className="text-[12px] font-bold text-iosBlue mt-1">
                         Holding {heldAssignments.length} different items
                      </div>
                    )}
                  </div>
                </div>
                <div className="self-center text-iosDivider">
                  <ChevronRight size={20} />
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center opacity-40">
            <p className="text-iosGray text-[17px] font-medium">No members found</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedVolunteer} onClose={() => setSelectedVolunteer(null)} title="Member Profile">
        <div className="space-y-6">
          <div className="text-center">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-[28px] font-bold shadow-md ${selectedVolunteer ? getAvatarColor(`${selectedVolunteer.first_name} ${selectedVolunteer.last_name}`) : ''}`}>
              {selectedVolunteer?.first_name.charAt(0)}{selectedVolunteer?.last_name.charAt(0)}
            </div>
            <h4 className="text-[22px] font-bold text-black tracking-tight">
              {selectedVolunteer?.first_name} {selectedVolunteer?.last_name}
            </h4>
            {selectedVolunteer?.phone && (
              <a href={`tel:${selectedVolunteer.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-iosBlue font-semibold text-[15px]">
                <Phone size={14} fill="currentColor" />
                {selectedVolunteer.phone}
              </a>
            )}
          </div>

          <div className="space-y-3">
            <h5 className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Items Held</h5>
            {activeAssignments.length > 0 ? (
              <div className="bg-iosBg/40 rounded-2xl overflow-hidden divide-y divide-white border border-iosDivider/10">
                {activeAssignments.map((a) => {
                  const item = items.find(i => i.id === a.itemId);
                  return (
                    <div key={a.id} className="flex justify-between items-center px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm text-iosBlue font-bold text-[15px]">
                          {a.quantity_assigned}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold text-black leading-none">{item?.name || 'Unknown Item'}</p>
                          <p className="text-[11px] text-iosGray mt-1 uppercase font-medium">{item?.category || 'General'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => onReturnItem(a.id)}
                        className="w-9 h-9 text-[#FF3B30] active:bg-red-100 rounded-full flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="bg-iosBg/20 p-8 rounded-2xl text-center border-2 border-dashed border-iosDivider/10">
                <p className="text-iosGray/60 text-[14px]">No items currently assigned.</p>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button 
              onClick={handleDeleteProfile}
              className="w-full py-4 text-[#FF3B30] text-[16px] font-bold active:bg-red-50 rounded-2xl border border-[#FF3B30]/10 transition-colors"
            >
              Delete Profile
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Member Profile">
        <div className="space-y-4">
           <div className="grid grid-cols-2 gap-3">
             <input 
               className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
               value={newFirstName}
               onChange={(e) => setNewFirstName(e.target.value)}
               placeholder="First Name"
             />
             <input 
               className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
               value={newLastName}
               onChange={(e) => setNewLastName(e.target.value)}
               placeholder="Last Name"
             />
           </div>
           <input 
             className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
             value={newPhone}
             onChange={(e) => setNewPhone(e.target.value)}
             placeholder="Phone Number"
             type="tel"
           />
           <Button fullWidth onClick={handleSave} disabled={!newFirstName || !newLastName}>
             Create Profile
           </Button>
        </div>
      </Modal>
    </div>
  );
};
