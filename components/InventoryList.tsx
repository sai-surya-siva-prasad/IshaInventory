import React, { useState, useMemo } from 'react';
import { Item, Assignment, Volunteer, Category } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { BottomSheet } from './ui/BottomSheet';
import { Plus, Search, Phone, Hash, Trash2, Edit2, Check, ArrowRight, RotateCcw, ChevronRight } from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  volunteers: Volunteer[];
  assignments: Assignment[];
  categories: Category[];
  onAssign: (itemId: string, volunteerId: string, quantity: number) => Promise<void>;
  onTransfer: (fromAssignmentId: string, itemId: string, fromCurrentQty: number, toVolunteerId: string, quantityToMove: number) => Promise<void>;
  onReturn: (assignmentId: string) => Promise<void>;
  onAddItem: (item: Partial<Item>) => void;
  onDeleteItem: (itemId: string) => void;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory?: (id: string, name: string) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

// Darken a hex color slightly for text contrast on colored backgrounds
const darken = (hex: string) => hex; // colors are used at low opacity so no need

// Return a text color (white or dark) for a given bg color
const textColorFor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#000000' : '#FFFFFF';
};

const VolunteerBadge: React.FC<{ name: string; qty?: number; color?: string; onCall?: () => void; small?: boolean }> = ({
  name, qty, color = '#007AFF', onCall, small
}) => {
  const bg = color + '22'; // ~13% opacity
  const border = color + '55';
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        color: color,
        fontSize: small ? 11 : 13,
        padding: small ? '2px 8px' : '3px 10px',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {name}{qty !== undefined && qty > 1 ? ` ×${qty}` : ''}
      {onCall && (
        <a
          href={`tel:${onCall}`}
          onClick={e => e.stopPropagation()}
          className="ml-0.5 active:opacity-50"
          style={{ color }}
        >
          <Phone size={10} fill="currentColor" />
        </a>
      )}
    </span>
  );
};

type SheetMode = 'detail' | 'assign-new' | 'move';

export const InventoryList: React.FC<InventoryListProps> = ({
  items,
  volunteers,
  assignments,
  categories,
  onAssign,
  onTransfer,
  onReturn,
  onAddItem,
  onDeleteItem,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Bottom sheet state
  const [sheetItem, setSheetItem] = useState<Item | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>('detail');
  const [moveFrom, setMoveFrom] = useState<Assignment | null>(null);
  const [moveQty, setMoveQty] = useState(1);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [volSearch, setVolSearch] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  // Add item modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>('');

  // Manage categories modal
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catAdding, setCatAdding] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  const getItemAssignments = (itemId: string) =>
    assignments.filter(a => a.itemId === itemId);

  const getAvailableQty = (item: Item) => {
    const assigned = assignments
      .filter(a => a.itemId === item.id)
      .reduce((s, a) => s + a.quantity_assigned, 0);
    return Math.max(0, item.quantity - assigned);
  };

  const groupedItems = useMemo(() => {
    const filtered = items.filter(i => {
      const matchSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || i.category_id === selectedCategory;
      return matchSearch && matchCat;
    });

    const cats = selectedCategory === 'All'
      ? categories
      : categories.filter(c => c.id === selectedCategory);

    return cats.reduce((acc, cat) => {
      const catItems = filtered.filter(i => i.category_id === cat.id);
      if (catItems.length > 0) acc[cat.category] = catItems;
      return acc;
    }, {} as Record<string, Item[]>);
  }, [items, searchTerm, selectedCategory, categories]);

  const filteredVolunteers = volunteers.filter(v =>
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(volSearch.toLowerCase())
  );

  // --- Sheet open helpers ---
  const openSheet = (item: Item) => {
    setSheetItem(item);
    setSheetMode('detail');
    setMoveFrom(null);
    setSelectedVolunteer(null);
    setVolSearch('');
    setMoveQty(1);
  };

  const openAssignNew = () => {
    setSheetMode('assign-new');
    setSelectedVolunteer(null);
    setVolSearch('');
  };

  const openMove = (a: Assignment) => {
    setMoveFrom(a);
    setMoveQty(1);
    setSelectedVolunteer(null);
    setVolSearch('');
    setSheetMode('move');
  };

  const closeSheet = () => {
    setSheetItem(null);
    setSheetMode('detail');
    setMoveFrom(null);
    setSelectedVolunteer(null);
    setVolSearch('');
  };

  // --- Actions ---
  const handleAssignNew = async () => {
    if (!sheetItem || !selectedVolunteer || isWorking) return;
    setIsWorking(true);
    try {
      await onAssign(sheetItem.id, selectedVolunteer.id, 1);
      closeSheet();
    } finally {
      setIsWorking(false);
    }
  };

  const handleTransfer = async () => {
    if (!sheetItem || !moveFrom || !selectedVolunteer || isWorking) return;
    setIsWorking(true);
    try {
      await onTransfer(moveFrom.id, sheetItem.id, moveFrom.quantity_assigned, selectedVolunteer.id, moveQty);
      closeSheet();
    } finally {
      setIsWorking(false);
    }
  };

  const handleReturn = async (assignmentId: string) => {
    if (isWorking) return;
    setIsWorking(true);
    try {
      await onReturn(assignmentId);
      closeSheet();
    } finally {
      setIsWorking(false);
    }
  };

  // "After this" preview for move
  const afterPreview = useMemo(() => {
    if (!sheetItem || !moveFrom || !selectedVolunteer) return null;
    const itemAssignments = getItemAssignments(sheetItem.id);
    const toExisting = itemAssignments.find(a => a.volunteerId === selectedVolunteer.id && a.id !== moveFrom.id);
    const fromRemaining = moveFrom.quantity_assigned - moveQty;
    const toTotal = (toExisting?.quantity_assigned || 0) + moveQty;
    return { fromRemaining, toTotal, toName: `${selectedVolunteer.first_name}` };
  }, [sheetItem, moveFrom, selectedVolunteer, moveQty, assignments]);

  // --- Add item ---
  const handleSaveNewItem = () => {
    if (!newItemName.trim() || !newItemCategoryId) return;
    onAddItem({ name: newItemName.trim(), category_id: newItemCategoryId, quantity: newItemQuantity });
    setNewItemName('');
    setNewItemQuantity(1);
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (item: Item) => {
    if (confirm(`Permanently remove "${item.name}" and all its records?`)) {
      onDeleteItem(item.id);
      closeSheet();
    }
  };

  // --- Categories ---
  const handleCreateCategory = async () => {
    if (!newCatName.trim() || catAdding) return;
    setCatAdding(true);
    try { await onAddCategory(newCatName.trim()); setNewCatName(''); }
    finally { setCatAdding(false); }
  };

  const handleSaveEditCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim() || catAdding) return;
    setCatAdding(true);
    try {
      if (onUpdateCategory) await onUpdateCategory(editingCategoryId, editingCategoryName.trim());
      setEditingCategoryId(null);
    } finally { setCatAdding(false); }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!onDeleteCategory) return;
    if (items.some(i => i.category_id === id)) {
      alert(`Cannot delete "${name}" — it has items assigned. Remove or reassign them first.`);
      return;
    }
    if (confirm(`Delete category "${name}"?`)) await onDeleteCategory(id);
  };

  // Quantity pill buttons
  const QtyPills: React.FC<{ max: number; value: number; onChange: (v: number) => void }> = ({ max, value, onChange }) => (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`w-10 h-10 rounded-full text-[15px] font-bold border transition-all active:scale-95
            ${value === n
              ? 'bg-iosBlue text-white border-iosBlue shadow-sm'
              : 'bg-white text-black border-iosDivider/40'}`}
        >
          {n === max ? `${n} All` : n}
        </button>
      ))}
    </div>
  );

  const sheetItemAssignments = sheetItem ? getItemAssignments(sheetItem.id) : [];
  const sheetAvailQty = sheetItem ? getAvailableQty(sheetItem) : 0;

  return (
    <div className="flex flex-col">
      {/* Search + Add */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#C7C7CC]" size={18} />
          <input
            type="text"
            placeholder="Search items..."
            className="w-full pl-10 pr-4 py-2 rounded-[10px] bg-[#E3E3E8] text-[17px] focus:outline-none placeholder-[#8E8E93]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setNewItemCategoryId(categories[0]?.id || ''); setIsAddModalOpen(true); }}
          className="w-10 h-10 bg-iosBlue text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Category filters */}
      <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar -mx-4 px-4 items-center">
        {['All', ...categories.map(c => c.id)].map((id) => {
          const label = id === 'All' ? 'All' : categories.find(c => c.id === id)?.category || '';
          const active = selectedCategory === id;
          return (
            <button
              key={id}
              onClick={() => setSelectedCategory(id)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all
                ${active ? 'bg-iosBlue text-white shadow-sm' : 'bg-white text-iosGray border border-iosDivider/30'}`}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={() => setIsManageCategoriesOpen(true)}
          className="whitespace-nowrap flex items-center gap-1 px-4 py-1.5 rounded-full text-[13px] font-semibold text-iosBlue border border-iosBlue/20 shrink-0"
        >
          <Plus size={12} /> Manage
        </button>
      </div>

      {/* Items list */}
      <div className="space-y-5">
        {Object.entries(groupedItems).map(([catName, catItems]) => (
          <div key={catName} className="animate-fade-in">
            <h3 className="mb-1.5 text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest px-1">{catName}</h3>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-iosDivider/10">
              {(catItems as Item[]).map((item, idx) => {
                const itemAssigns = getItemAssignments(item.id);
                const avail = getAvailableQty(item);

                return (
                  <button
                    key={item.id}
                    onClick={() => openSheet(item)}
                    className={`w-full text-left px-4 py-4 active:bg-iosBg transition-colors
                      ${idx < (catItems as Item[]).length - 1 ? 'border-b border-iosDivider/10' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[16px] font-bold text-black leading-tight">{item.name}</span>
                          <span className="text-[11px] bg-iosBg px-2 py-0.5 rounded-full font-bold text-iosGray">×{item.quantity}</span>
                          {avail > 0 && (
                            <span className="text-[11px] text-[#34C759] font-semibold">{avail} free</span>
                          )}
                        </div>

                        {itemAssigns.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {itemAssigns.map(a => {
                              const name = a.volunteerFirstName || 'Unknown';
                              return (
                                <VolunteerBadge
                                  key={a.id}
                                  name={name}
                                  qty={a.quantity_assigned > 1 ? a.quantity_assigned : undefined}
                                  color={a.volunteerColor}
                                  onCall={a.volunteerPhone || undefined}
                                  small
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[12px] text-iosGray/60 italic">Nobody — tap to assign</span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-iosDivider mt-1 shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedItems).length === 0 && (
          <div className="text-center py-24 text-iosGray opacity-40">
            <p className="text-[17px] font-medium">No items found</p>
          </div>
        )}
      </div>

      {/* ── ITEM BOTTOM SHEET ── */}
      <BottomSheet isOpen={!!sheetItem} onClose={closeSheet}>
        {sheetItem && sheetMode === 'detail' && (
          <div className="space-y-5 pb-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-black">{sheetItem.name}</h2>
                <p className="text-[13px] text-iosGray mt-0.5">
                  {sheetItem.category} · {sheetItem.quantity} total
                  {sheetAvailQty > 0 && ` · ${sheetAvailQty} available`}
                </p>
              </div>
              <button
                onClick={() => handleDeleteItem(sheetItem)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#FF3B30] bg-red-50 active:bg-red-100"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Current holders */}
            {sheetItemAssignments.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-iosGray uppercase tracking-widest">Currently with</p>
                <div className="space-y-2">
                  {sheetItemAssignments.map(a => {
                    const name = `${a.volunteerFirstName || ''} ${a.volunteerLastName || ''}`.trim() || 'Unknown';
                    const color = a.volunteerColor || '#007AFF';
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 rounded-2xl"
                        style={{ background: color + '12', border: `1px solid ${color}30` }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold"
                            style={{ background: color + '25', color }}>
                            {(a.volunteerFirstName || '?').charAt(0)}
                          </div>
                          <div>
                            <p className="text-[15px] font-bold text-black leading-tight">{name}</p>
                            <p className="text-[12px] font-semibold" style={{ color }}>×{a.quantity_assigned}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.volunteerPhone && (
                            <a
                              href={`tel:${a.volunteerPhone}`}
                              onClick={e => e.stopPropagation()}
                              className="w-9 h-9 rounded-full flex items-center justify-center active:opacity-50"
                              style={{ background: color + '20', color }}
                            >
                              <Phone size={15} fill="currentColor" />
                            </a>
                          )}
                          <button
                            onClick={() => openMove(a)}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-iosBg text-iosGray active:bg-iosDivider/30"
                          >
                            <ArrowRight size={15} />
                          </button>
                          <button
                            onClick={() => handleReturn(a.id)}
                            disabled={isWorking}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#34C759]/10 text-[#34C759] active:bg-[#34C759]/20"
                          >
                            <RotateCcw size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Assign from pool */}
            {sheetAvailQty > 0 && (
              <button
                onClick={openAssignNew}
                className="w-full py-4 rounded-2xl bg-iosBlue text-white text-[16px] font-bold active:opacity-80 transition-opacity"
              >
                Assign {sheetAvailQty > 1 ? `(${sheetAvailQty} available)` : ''} →
              </button>
            )}

            {sheetItemAssignments.length === 0 && sheetAvailQty === 0 && (
              <p className="text-center text-[14px] text-iosGray/60 py-2">All units accounted for</p>
            )}
          </div>
        )}

        {/* ── ASSIGN NEW from pool ── */}
        {sheetItem && sheetMode === 'assign-new' && (
          <div className="space-y-4 pb-4">
            <button onClick={() => setSheetMode('detail')} className="text-iosBlue text-[15px] font-semibold">← Back</button>
            <h3 className="text-[18px] font-bold text-black">Assign {sheetItem.name}</h3>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-iosGray/40" size={16} />
              <input
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-[12px] bg-iosBg outline-none text-[16px]"
                placeholder="Search person..."
                value={volSearch}
                onChange={e => setVolSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              {filteredVolunteers.map(vol => (
                <button
                  key={vol.id}
                  onClick={() => setSelectedVolunteer(vol)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all
                    ${selectedVolunteer?.id === vol.id ? 'bg-iosBlue/10' : 'bg-iosBg active:bg-iosDivider/20'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold"
                      style={{ background: (vol.color || '#007AFF') + '25', color: vol.color || '#007AFF' }}>
                      {vol.first_name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-semibold text-black">{vol.first_name} {vol.last_name}</p>
                      {vol.phone && <p className="text-[12px] text-iosGray">{vol.phone}</p>}
                    </div>
                  </div>
                  {selectedVolunteer?.id === vol.id && <Check size={18} className="text-iosBlue" />}
                </button>
              ))}
            </div>

            <button
              disabled={!selectedVolunteer || isWorking}
              onClick={handleAssignNew}
              className="w-full py-4 rounded-2xl bg-iosBlue text-white text-[16px] font-bold disabled:opacity-30 active:opacity-80 transition-opacity"
            >
              Assign to {selectedVolunteer?.first_name || '...'}
            </button>
          </div>
        )}

        {/* ── MOVE from one person ── */}
        {sheetItem && sheetMode === 'move' && moveFrom && (
          <div className="space-y-4 pb-4">
            <button onClick={() => setSheetMode('detail')} className="text-iosBlue text-[15px] font-semibold">← Back</button>
            <h3 className="text-[18px] font-bold text-black">
              Move {moveFrom.volunteerFirstName}'s {sheetItem.name}
            </h3>

            {moveFrom.quantity_assigned > 1 && (
              <div className="space-y-2">
                <p className="text-[12px] font-bold text-iosGray uppercase tracking-widest">How many?</p>
                <QtyPills
                  max={moveFrom.quantity_assigned}
                  value={moveQty}
                  onChange={setMoveQty}
                />
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-iosGray/40" size={16} />
              <input
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 rounded-[12px] bg-iosBg outline-none text-[16px]"
                placeholder="Move to..."
                value={volSearch}
                onChange={e => setVolSearch(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              {filteredVolunteers
                .filter(v => v.id !== moveFrom.volunteerId)
                .map(vol => (
                  <button
                    key={vol.id}
                    onClick={() => setSelectedVolunteer(vol)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all
                      ${selectedVolunteer?.id === vol.id ? 'bg-iosBlue/10' : 'bg-iosBg active:bg-iosDivider/20'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[14px] font-bold"
                        style={{ background: (vol.color || '#007AFF') + '25', color: vol.color || '#007AFF' }}>
                        {vol.first_name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-[15px] font-semibold text-black">{vol.first_name} {vol.last_name}</p>
                        {vol.phone && <p className="text-[12px] text-iosGray">{vol.phone}</p>}
                      </div>
                    </div>
                    {selectedVolunteer?.id === vol.id && <Check size={18} className="text-iosBlue" />}
                  </button>
                ))}
            </div>

            {/* After-this preview */}
            {afterPreview && (
              <div className="bg-iosBg rounded-2xl p-4 space-y-1 border border-iosDivider/20">
                <p className="text-[11px] font-bold text-iosGray uppercase tracking-widest mb-2">After this</p>
                {afterPreview.fromRemaining > 0 ? (
                  <p className="text-[14px] text-black">
                    <span className="font-bold">{moveFrom.volunteerFirstName}</span> keeps{' '}
                    <span className="font-bold text-iosBlue">×{afterPreview.fromRemaining}</span>
                  </p>
                ) : (
                  <p className="text-[14px] text-black">
                    <span className="font-bold">{moveFrom.volunteerFirstName}</span>{' '}
                    <span className="text-[#34C759] font-semibold">· done ✓</span>
                  </p>
                )}
                <p className="text-[14px] text-black">
                  <span className="font-bold">{afterPreview.toName}</span> gets{' '}
                  <span className="font-bold text-iosBlue">×{afterPreview.toTotal}</span>
                </p>
              </div>
            )}

            <button
              disabled={!selectedVolunteer || isWorking}
              onClick={handleTransfer}
              className="w-full py-4 rounded-2xl bg-iosBlue text-white text-[16px] font-bold disabled:opacity-30 active:opacity-80 transition-opacity"
            >
              Confirm Move →
            </button>
          </div>
        )}
      </BottomSheet>

      {/* ── ADD ITEM MODAL ── */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Item">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Item Name</label>
            <input
              className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={newItemName}
              onChange={e => setNewItemName(e.target.value)}
              placeholder="e.g., Speaker Stand"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Quantity</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/40" size={18} />
              <input
                type="number"
                min="1"
                className="w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px] font-bold"
                value={newItemQuantity}
                onChange={e => setNewItemQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Category</label>
            <select
              className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={newItemCategoryId}
              onChange={e => setNewItemCategoryId(e.target.value)}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.category}</option>)}
            </select>
          </div>
          <Button fullWidth onClick={handleSaveNewItem} disabled={!newItemName.trim() || !newItemCategoryId}>
            Add Item
          </Button>
        </div>
      </Modal>

      {/* ── MANAGE CATEGORIES MODAL ── */}
      <Modal isOpen={isManageCategoriesOpen} onClose={() => { setIsManageCategoriesOpen(false); setEditingCategoryId(null); }} title="Categories">
        <div className="space-y-5 pb-2">
          {!editingCategoryId && (
            <div className="flex gap-2">
              <input
                className="flex-1 px-4 py-3 rounded-[12px] bg-iosBg outline-none text-[16px]"
                placeholder="New category..."
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCategory()}
              />
              <button
                onClick={handleCreateCategory}
                disabled={!newCatName.trim() || catAdding}
                className="bg-iosBlue text-white px-5 py-3 rounded-[12px] font-bold disabled:opacity-30 active:scale-95 transition-all"
              >
                Add
              </button>
            </div>
          )}

          <div className="space-y-1">
            {categories.map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-iosBg rounded-[12px] px-4 py-3">
                {editingCategoryId === c.id ? (
                  <>
                    <input
                      autoFocus
                      className="flex-1 bg-white rounded-lg px-3 py-2 text-[15px] border border-iosBlue/30 outline-none"
                      value={editingCategoryName}
                      onChange={e => setEditingCategoryName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveEditCategory()}
                    />
                    <button onClick={handleSaveEditCategory} className="text-iosBlue font-bold text-[14px] px-2">Save</button>
                    <button onClick={() => setEditingCategoryId(null)} className="text-iosGray text-[14px] px-2">Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-[15px] font-semibold text-black">{c.category}</span>
                    <button onClick={() => { setEditingCategoryId(c.id); setEditingCategoryName(c.category); }}
                      className="w-8 h-8 flex items-center justify-center text-iosBlue active:opacity-50">
                      <Edit2 size={15} />
                    </button>
                    {onDeleteCategory && (
                      <button onClick={() => handleDeleteCategory(c.id, c.category)}
                        className="w-8 h-8 flex items-center justify-center text-[#FF3B30] active:opacity-50">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};
