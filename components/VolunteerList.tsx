
import React, { useState } from 'react';
import { Volunteer, Assignment, Item } from '../types';
import { Search, Plus, Phone, Trash2, MapPin, ChevronRight, Edit3, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

interface VolunteerListProps {
  volunteers: Volunteer[];
  assignments: Assignment[];
  items: Item[];
  onAddVolunteer: (volunteer: Partial<Volunteer>) => void;
  onUpdateVolunteer: (volunteer: Volunteer) => void;
  onDeleteVolunteer: (volunteerId: string) => void;
  onReturnItem: (assignmentId: string) => void;
}

const COLORS = [
  '#007AFF', '#FF6B35', '#34C759', '#AF52DE',
  '#FF3B30', '#00B4A0', '#FF9500', '#5856D6',
];

const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2 flex-wrap">
    {COLORS.map(c => (
      <button
        key={c}
        onClick={() => onChange(c)}
        className="w-8 h-8 rounded-full transition-transform active:scale-90"
        style={{
          background: c,
          boxShadow: value === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : undefined,
          transform: value === c ? 'scale(1.15)' : undefined,
        }}
      />
    ))}
  </div>
);

export const VolunteerList: React.FC<VolunteerListProps> = ({
  volunteers,
  assignments,
  items,
  onAddVolunteer,
  onUpdateVolunteer,
  onDeleteVolunteer,
  onReturnItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);

  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editColor, setEditColor] = useState(COLORS[0]);

  const filteredVolunteers = volunteers.filter(v =>
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.phone?.includes(searchTerm)
  );

  const activeAssignments = selectedVolunteer
    ? assignments.filter(a => a.volunteerId === selectedVolunteer.id)
    : [];

  const handleSave = () => {
    if (!newFirstName.trim() || !newLastName.trim()) return;
    onAddVolunteer({
      first_name: newFirstName.trim(),
      last_name: newLastName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      color: newColor,
    });
    setNewFirstName(''); setNewLastName(''); setNewPhone(''); setNewAddress('');
    setNewColor(COLORS[0]);
    setIsAddOpen(false);
  };

  const openEditModal = () => {
    if (!selectedVolunteer) return;
    setEditFirstName(selectedVolunteer.first_name);
    setEditLastName(selectedVolunteer.last_name);
    setEditPhone(selectedVolunteer.phone || '');
    setEditAddress(selectedVolunteer.address || '');
    setEditColor(selectedVolunteer.color || COLORS[0]);
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedVolunteer || !editFirstName.trim() || !editLastName.trim()) return;
    const updated = {
      ...selectedVolunteer,
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
      color: editColor,
    };
    onUpdateVolunteer(updated);
    setIsEditOpen(false);
    setSelectedVolunteer(updated);
  };

  const handleDelete = () => {
    if (selectedVolunteer && confirm(`Delete profile for "${selectedVolunteer.first_name} ${selectedVolunteer.last_name}"?`)) {
      onDeleteVolunteer(selectedVolunteer.id);
      setSelectedVolunteer(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-iosGray/50" size={18} />
          <input
            type="text"
            placeholder="Search people..."
            className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-[#E3E3E8] text-[17px] focus:outline-none placeholder-[#8E8E93]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="w-10 h-10 bg-iosBlue text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-iosDivider/10">
        {filteredVolunteers.length > 0 ? filteredVolunteers.map((vol, idx) => {
          const held = assignments.filter(a => a.volunteerId === vol.id);
          const totalUnits = held.reduce((s, a) => s + a.quantity_assigned, 0);
          const color = vol.color || '#007AFF';

          return (
            <button
              key={vol.id}
              onClick={() => setSelectedVolunteer(vol)}
              className={`w-full flex items-center gap-4 px-4 py-4 text-left active:bg-iosBg transition-colors
                ${idx < filteredVolunteers.length - 1 ? 'border-b border-iosDivider/10' : ''}`}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[17px] font-bold shrink-0"
                style={{ background: color + '20', color }}>
                {vol.first_name.charAt(0)}{vol.last_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-bold text-black leading-tight">
                  {vol.first_name} {vol.last_name}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {vol.phone && (
                    <span className="text-[13px] text-iosGray">{vol.phone}</span>
                  )}
                  {totalUnits > 0 && (
                    <span className="text-[12px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color + '18', color }}>
                      {totalUnits} unit{totalUnits > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={16} className="text-iosDivider shrink-0" />
            </button>
          );
        }) : (
          <div className="py-16 text-center text-iosGray opacity-40">
            <p className="text-[16px] font-medium">No people found</p>
          </div>
        )}
      </div>

      {/* Volunteer detail modal */}
      <Modal isOpen={!!selectedVolunteer} onClose={() => setSelectedVolunteer(null)} title="Member">
        {selectedVolunteer && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-[24px] font-bold shrink-0"
                style={{ background: (selectedVolunteer.color || '#007AFF') + '20', color: selectedVolunteer.color || '#007AFF' }}>
                {selectedVolunteer.first_name.charAt(0)}{selectedVolunteer.last_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h4 className="text-[20px] font-bold text-black">
                  {selectedVolunteer.first_name} {selectedVolunteer.last_name}
                </h4>
                {selectedVolunteer.phone && (
                  <a href={`tel:${selectedVolunteer.phone}`}
                    className="inline-flex items-center gap-1.5 mt-1 font-semibold text-[14px]"
                    style={{ color: selectedVolunteer.color || '#007AFF' }}>
                    <Phone size={13} fill="currentColor" />
                    {selectedVolunteer.phone}
                  </a>
                )}
                {selectedVolunteer.address && (
                  <div className="flex items-center gap-1.5 mt-1 text-iosGray text-[13px]">
                    <MapPin size={12} />
                    {selectedVolunteer.address}
                  </div>
                )}
              </div>
              <button
                onClick={openEditModal}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-iosBg text-iosBlue active:bg-iosDivider/30"
              >
                <Edit3 size={16} />
              </button>
            </div>

            {/* Items held */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-iosGray uppercase tracking-widest px-1">
                Items Held {activeAssignments.length > 0 && `(${activeAssignments.length})`}
              </p>
              {activeAssignments.length > 0 ? (
                <div className="space-y-2">
                  {activeAssignments.map(a => {
                    const item = items.find(i => i.id === a.itemId);
                    const color = selectedVolunteer.color || '#007AFF';
                    return (
                      <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-2xl"
                        style={{ background: color + '10', border: `1px solid ${color}25` }}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-bold"
                            style={{ background: color + '25', color }}>
                            ×{a.quantity_assigned}
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold text-black">{item?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-iosGray uppercase font-medium">{item?.category || ''}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onReturnItem(a.id)}
                          className="w-8 h-8 rounded-full flex items-center justify-center bg-[#34C759]/10 text-[#34C759] active:bg-[#34C759]/20"
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-2xl text-center border-2 border-dashed border-iosDivider/20">
                  <p className="text-[14px] text-iosGray/60">Nothing assigned</p>
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              className="w-full py-3.5 text-[#FF3B30] text-[15px] font-bold rounded-2xl border border-[#FF3B30]/10 active:bg-red-50 transition-colors"
            >
              Delete Profile
            </button>
          </div>
        )}
      </Modal>

      {/* Add volunteer modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="New Member">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={newFirstName} onChange={e => setNewFirstName(e.target.value)} placeholder="First Name" />
            <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={newLastName} onChange={e => setNewLastName(e.target.value)} placeholder="Last Name" />
          </div>
          <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
            value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone Number" type="tel" />
          <textarea className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px] resize-none"
            value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="Address (optional)" rows={2} />
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Colour</p>
            <ColorPicker value={newColor} onChange={setNewColor} />
          </div>
          <Button fullWidth onClick={handleSave} disabled={!newFirstName || !newLastName}>
            Create Member
          </Button>
        </div>
      </Modal>

      {/* Edit volunteer modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Member">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="First Name" />
            <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Last Name" />
          </div>
          <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
            value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone Number" type="tel" />
          <textarea className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px] resize-none"
            value={editAddress} onChange={e => setEditAddress(e.target.value)} placeholder="Address" rows={2} />
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Colour</p>
            <ColorPicker value={editColor} onChange={setEditColor} />
          </div>
          <Button fullWidth onClick={handleSaveEdit} disabled={!editFirstName || !editLastName}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  );
};
