import React, { useState, useMemo, useEffect } from 'react';
import { Item, Assignment, Volunteer, Category } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { Plus, Search, Box, Check, Info, User, Settings2, Edit2, XCircle, Hash, Users, Phone, Trash2 } from 'lucide-react';

interface InventoryListProps {
  items: Item[];
  volunteers: Volunteer[];
  assignments: Assignment[];
  categories: Category[];
  onAssign: (itemId: string, volunteerId: string, quantity: number) => void;
  onAddItem: (item: Partial<Item>) => void;
  onDeleteItem: (itemId: string) => void;
  onUnassign: (assignmentId: string) => void;
  onAddCategory: (name: string) => Promise<void>;
  onUpdateCategory?: (id: string, name: string) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
}

export const InventoryList: React.FC<InventoryListProps> = ({ 
  items, 
  volunteers, 
  assignments, 
  categories,
  onAssign,
  onAddItem,
  onDeleteItem,
  onUnassign,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [assignItem, setAssignItem] = useState<Item | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [assignQuantity, setAssignQuantity] = useState<number>(1);
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState<number>(1);
  const [newItemCategoryId, setNewItemCategoryId] = useState<string>('');
  
  const [newCatName, setNewCatName] = useState('');
  const [catAdding, setCatAdding] = useState(false);
  const [showInlineCatInput, setShowInlineCatInput] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');

  useEffect(() => {
    if (isAddModalOpen && categories.length > 0 && !newItemCategoryId) {
      setNewItemCategoryId(categories[0].id);
    }
  }, [isAddModalOpen, categories, newItemCategoryId]);

  const getItemAssignments = (itemId: string) => assignments.filter(a => a.itemId === itemId);

  const getAvailableQuantity = (item: Item) => {
    const assignedCount = assignments
      .filter(a => a.itemId === item.id)
      .reduce((sum, a) => sum + a.quantity_assigned, 0);
    return Math.max(0, item.quantity - assignedCount);
  };

  const getHolderNamesPreview = (itemAssignments: Assignment[]) => {
    const names = Array.from(new Set(itemAssignments.map(a => 
      (a.volunteerFirstName && a.volunteerLastName) 
        ? `${a.volunteerFirstName} ${a.volunteerLastName}`
        : 'Unknown'
    )));

    if (names.length === 0) return null;
    if (names.length === 1) return `Held by ${names[0]}`;
    if (names.length === 2) return `Held by ${names[0]} & ${names[1]}`;
    return `Held by ${names[0]}, ${names[1]} + ${names.length - 2} more`;
  };

  const groupedItems = useMemo(() => {
    const filtered = items.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || i.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    
    const categoriesToGroup = selectedCategory === 'All' 
      ? categories 
      : categories.filter(c => c.id === selectedCategory);

    return categoriesToGroup.reduce((acc, cat) => {
      const catItems = filtered.filter(i => i.category_id === cat.id);
      if (catItems.length > 0) acc[cat.category] = catItems;
      return acc;
    }, {} as Record<string, Item[]>);
  }, [items, searchTerm, selectedCategory, categories]);

  const filteredVolunteers = volunteers.filter(v => 
    `${v.first_name} ${v.last_name}`.toLowerCase().includes(volunteerSearch.toLowerCase())
  );

  const handleOpenDetails = (item: Item) => {
    setSelectedItem(item);
  };

  const handleOpenAssign = (item: Item) => {
    setAssignItem(item);
    setSelectedItem(null);
    setSelectedVolunteer(null);
    setVolunteerSearch('');
    setAssignQuantity(1);
  };

  const handleConfirmAssignment = () => {
    if (assignItem && selectedVolunteer) {
      onAssign(assignItem.id, selectedVolunteer.id, assignQuantity);
      setAssignItem(null);
    }
  };

  const handleSaveNewItem = () => {
    if (!newItemName.trim() || !newItemCategoryId) return;
    onAddItem({
      name: newItemName.trim(),
      category_id: newItemCategoryId,
      quantity: newItemQuantity
    });
    setNewItemName('');
    setNewItemQuantity(1);
    setIsAddModalOpen(false);
  };

  const handleCreateCategory = async (nameOverride?: string) => {
    const name = nameOverride || newCatName;
    if (!name.trim() || catAdding) return;
    setCatAdding(true);
    try {
      await onAddCategory(name.trim());
      setNewCatName('');
      setShowInlineCatInput(false);
    } finally {
      setCatAdding(false);
    }
  };

  const handleStartEditCategory = (category: Category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.category);
  };

  const handleSaveEditedCategory = async () => {
    if (!editingCategoryId || !editingCategoryName.trim() || catAdding) return;
    setCatAdding(true);
    try {
      if (onUpdateCategory) {
        await onUpdateCategory(editingCategoryId, editingCategoryName.trim());
      }
      setEditingCategoryId(null);
      setEditingCategoryName('');
    } finally {
      setCatAdding(false);
    }
  };

  const handleDeleteItem = () => {
    if (selectedItem && confirm(`Are you sure you want to permanently remove "${selectedItem.name}" and all its records?`)) {
      onDeleteItem(selectedItem.id);
      setSelectedItem(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!onDeleteCategory) return;
    const itemsInCategory = items.filter(i => i.category_id === categoryId);
    if (itemsInCategory.length > 0) {
      alert(`Cannot delete "${categoryName}" because it has ${itemsInCategory.length} item(s) assigned. Please reassign or remove those items first.`);
      return;
    }
    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      await onDeleteCategory(categoryId);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3 mb-4 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[#C7C7CC]" size={18} />
          <input 
            type="text" 
            placeholder="Search registry..." 
            className="w-full pl-10 pr-4 py-2 rounded-[10px] border-none bg-[#E3E3E8] text-[17px] focus:outline-none placeholder-[#8E8E93]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            setNewItemCategoryId('');
            setIsAddModalOpen(true);
          }}
          className="w-10 h-10 bg-iosBlue text-white rounded-full flex items-center justify-center shadow-md active:scale-90 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="flex overflow-x-auto gap-2 pb-6 px-1 no-scrollbar -mx-4 px-5 items-center">
        <button
          onClick={() => setSelectedCategory('All')}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-[14px] font-semibold transition-all
            ${selectedCategory === 'All' ? 'bg-iosBlue text-white shadow-sm' : 'bg-white text-iosGray border border-iosDivider/30'}`}
        >
          All
        </button>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-[14px] font-semibold transition-all
              ${selectedCategory === c.id ? 'bg-iosBlue text-white shadow-sm' : 'bg-white text-iosGray border border-iosDivider/30'}`}
          >
            {c.category}
          </button>
        ))}
        <button 
          onClick={() => setIsManageCategoriesOpen(true)}
          className="whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold text-iosBlue border border-iosBlue/20 active:bg-iosBlue/5 transition-colors"
        >
          <Plus size={14} />
          Manage
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([categoryName, catItems]) => (
          <div key={categoryName} className="animate-fade-in">
            <h3 className="px-5 mb-1.5 text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest flex justify-between items-center">
              <span>{categoryName}</span>
            </h3>
            <div className="bg-white border-y border-iosDivider/20 overflow-hidden rounded-xl mx-1 shadow-sm">
              {(catItems as Item[]).map((item, idx) => {
                const available = getAvailableQuantity(item);
                const itemAssings = getItemAssignments(item.id);
                const isOut = itemAssings.length > 0;
                const holdersPreview = getHolderNamesPreview(itemAssings);

                return (
                  <div key={item.id}>
                    <button 
                      onClick={() => handleOpenDetails(item)}
                      className={`w-full flex items-center justify-between pl-5 pr-4 py-4 text-left active:bg-iosBg transition-colors
                        ${idx < (catItems as Item[]).length - 1 ? 'border-b border-iosDivider/10' : ''}`}
                    >
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2">
                           <p className="text-[17px] font-semibold text-black leading-tight">{item.name}</p>
                           <span className="text-[12px] bg-iosBg px-1.5 py-0.5 rounded font-bold text-iosGray">x{item.quantity}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className={`w-2 h-2 rounded-full ${available > 0 ? 'bg-[#34C759]' : 'bg-iosBlue'}`} />
                          <span className={`text-[13px] font-medium ${available > 0 ? 'text-[#34C759]' : 'text-iosBlue'}`}>
                            {available > 0 ? `${available} available` : 'Fully assigned'}
                          </span>
                        </div>
                        {isOut && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Users size={12} className="text-iosGray/60" />
                            <span className="text-[12px] text-iosGray/80 font-medium italic">
                              {holdersPreview}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-[#C7C7CC]">
                        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M1.5 1.5L6.5 6.5L1.5 11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedItems).length === 0 && (
          <div className="text-center py-24 text-[#8E8E93] opacity-50">
            <Box className="mx-auto mb-3" size={48} strokeWidth={1.5} />
            <p className="text-[17px] font-medium">No assets registered</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Asset Detail">
        <div className="space-y-6">
          <div className="text-center">
            <h4 className="text-[22px] font-bold text-black tracking-tight">{selectedItem?.name}</h4>
            <div className="flex justify-center gap-2 mt-2">
              <div className="px-3 py-1 bg-iosBg rounded-full">
                <p className="text-[12px] text-iosGray uppercase tracking-widest font-bold">
                  {selectedItem?.category}
                </p>
              </div>
              <div className="px-3 py-1 bg-iosBlue/10 text-iosBlue rounded-full">
                <p className="text-[12px] uppercase tracking-widest font-bold">
                  Total: {selectedItem?.quantity}
                </p>
              </div>
            </div>
          </div>

          {(() => {
            const itemAssings = selectedItem ? getItemAssignments(selectedItem.id) : [];
            
            return itemAssings.length > 0 ? (
              <div className="space-y-3">
                <h5 className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Assigned To</h5>
                <div className="bg-iosBg/50 p-4 rounded-2xl border border-iosDivider/10 space-y-3">
                  {itemAssings.map(a => {
                    const holderName = (a.volunteerFirstName && a.volunteerLastName) 
                      ? `${a.volunteerFirstName} ${a.volunteerLastName}` 
                      : 'Unknown Member';

                    return (
                      <div key={a.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-iosBlue/10 text-iosBlue flex items-center justify-center">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-[14px] font-bold text-black leading-tight">{holderName}</p>
                              {a.volunteerPhone && (
                                <a 
                                  href={`tel:${a.volunteerPhone}`}
                                  className="w-6 h-6 rounded-full bg-iosBlue/10 text-iosBlue flex items-center justify-center active:scale-90 transition-transform"
                                >
                                  <Phone size={12} fill="currentColor" />
                                </a>
                              )}
                            </div>
                            <p className="text-[11px] text-iosGray italic">Since {new Date(a.assigned_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[16px] font-bold text-iosBlue">x{a.quantity_assigned}</span>
                          <button 
                            onClick={() => onUnassign(a.id)}
                            className="text-[#FF3B30] flex items-center justify-center active:scale-95 transition-transform"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null;
          })()}

          <div className="space-y-3">
            {selectedItem && getAvailableQuantity(selectedItem) > 0 && (
              <Button fullWidth onClick={() => handleOpenAssign(selectedItem!)}>
                Assign to Person
              </Button>
            )}
            
            <button 
              onClick={handleDeleteItem}
              className="w-full py-4 text-[#FF3B30] text-[16px] font-bold active:bg-red-50 rounded-2xl border border-[#FF3B30]/10 transition-colors mt-2"
            >
              Remove Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={!!assignItem} onClose={() => setAssignItem(null)} title="Assign Units">
        <div className="space-y-6">
           <div className="space-y-4">
             <div className="bg-iosBlue/5 p-4 rounded-2xl border border-iosBlue/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-bold text-iosGray uppercase tracking-widest">Available Units</span>
                  <span className="text-[17px] font-black text-iosBlue">{assignItem ? getAvailableQuantity(assignItem) : 0}</span>
                </div>
                <div className="space-y-2">
                   <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest">Quantity to Assign</label>
                   <input 
                     type="number"
                     min="1"
                     max={assignItem ? getAvailableQuantity(assignItem) : 1}
                     className="w-full px-4 py-3.5 rounded-[12px] bg-white border-2 border-iosBlue/20 outline-none text-[18px] font-bold text-iosBlue"
                     value={assignQuantity}
                     onChange={(e) => setAssignQuantity(Math.min(parseInt(e.target.value) || 1, assignItem ? getAvailableQuantity(assignItem) : 1))}
                   />
                </div>
             </div>

             <div className="space-y-2">
               <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Select Receiver</label>
               <div className="relative">
                 <Search className="absolute left-3 top-2.5 text-iosGray/40" size={18} />
                 <input 
                   className="w-full pl-10 pr-4 py-2.5 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[17px] transition-all"
                   placeholder="Search Person..."
                   value={volunteerSearch}
                   onChange={(e) => setVolunteerSearch(e.target.value)}
                 />
               </div>
               <div className="max-h-48 overflow-y-auto bg-white border border-iosDivider/20 rounded-[14px] divide-y divide-iosDivider/10">
                  {filteredVolunteers.length > 0 ? filteredVolunteers.map(vol => (
                    <button
                      key={vol.id}
                      onClick={() => setSelectedVolunteer(vol)}
                      className={`w-full px-4 py-3 text-left transition-colors text-[16px] flex items-center justify-between
                        ${selectedVolunteer?.id === vol.id ? 'bg-iosBlue/5' : 'active:bg-iosBg'}`}
                    >
                      <span className={`font-medium ${selectedVolunteer?.id === vol.id ? 'text-iosBlue' : 'text-black'}`}>
                        {vol.first_name} {vol.last_name}
                      </span>
                      {selectedVolunteer?.id === vol.id && <Check size={18} className="text-iosBlue" />}
                    </button>
                  )) : (
                    <div className="p-6 text-center text-iosGray text-[14px] opacity-40">
                      No members found
                    </div>
                  )}
               </div>
             </div>
           </div>

           <Button fullWidth disabled={!selectedVolunteer || assignQuantity < 1} onClick={handleConfirmAssignment}>
             Confirm Assignment
           </Button>
        </div>
      </Modal>

      {/* New Asset Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => {
        setIsAddModalOpen(false);
        setShowInlineCatInput(false);
      }} title="New Registry Item">
        <div className="space-y-4">
           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Item Name</label>
             <input 
               className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[17px] transition-all"
               value={newItemName}
               onChange={(e) => setNewItemName(e.target.value)}
               placeholder="e.g., Plastic Chairs"
             />
           </div>

           <div className="space-y-1.5">
             <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">Total Stock</label>
             <div className="relative">
               <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-iosGray/40" size={18} />
               <input 
                 type="number"
                 min="1"
                 className="w-full pl-11 pr-4 py-3.5 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[17px] transition-all font-bold"
                 value={newItemQuantity}
                 onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
               />
             </div>
           </div>
           
           <div className="space-y-1.5">
             <div className="flex justify-between items-center px-1">
               <label className="text-[12px] font-bold text-iosGray uppercase tracking-widest">Category</label>
               <button 
                 onClick={() => setShowInlineCatInput(!showInlineCatInput)}
                 className="text-[12px] text-iosBlue font-semibold flex items-center gap-1"
               >
                 {showInlineCatInput ? 'Back to list' : '+ New Category'}
               </button>
             </div>

             {showInlineCatInput ? (
                <div className="flex gap-2 animate-fade-in">
                  <input 
                    autoFocus
                    className="flex-1 px-4 py-3 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[16px] transition-all"
                    placeholder="New category..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                  />
                  <button 
                    onClick={() => handleCreateCategory()}
                    disabled={!newCatName.trim() || catAdding}
                    className="bg-iosBlue text-white px-4 rounded-[12px] font-bold active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
             ) : (
                <div className="relative">
                  <select 
                      className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[17px] appearance-none"
                      value={newItemCategoryId}
                      onChange={(e) => setNewItemCategoryId(e.target.value)}
                  >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.category}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-iosGray">
                      <svg width="12" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  </div>
                </div>
             )}
           </div>

           <div className="pt-2">
             <Button fullWidth onClick={handleSaveNewItem} disabled={!newItemName.trim() || !newItemCategoryId || showInlineCatInput}>
               Add to Registry
             </Button>
           </div>
        </div>
      </Modal>

      <Modal isOpen={isManageCategoriesOpen} onClose={() => {
        setIsManageCategoriesOpen(false);
        setEditingCategoryId(null);
      }} title="Manage Categories">
        <div className="flex flex-col space-y-6 pb-2">
          {!editingCategoryId && (
            <div className="space-y-3 px-1 animate-fade-in">
              <h5 className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">New Category</h5>
              <div className="flex gap-2">
                <input 
                  className="flex-1 px-4 py-3 rounded-[12px] bg-iosBg focus:bg-white border border-transparent focus:border-iosBlue/20 outline-none text-[16px] transition-all"
                  placeholder="e.g., Furniture"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                />
                <button 
                  onClick={() => handleCreateCategory()}
                  disabled={!newCatName.trim() || catAdding}
                  className="bg-iosBlue text-white px-5 py-3 rounded-[12px] font-bold disabled:opacity-30 active:scale-95 transition-all shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h5 className="text-[12px] font-bold text-iosGray uppercase tracking-widest px-1">
              Active Categories
            </h5>
            <div className="bg-iosBg/40 rounded-2xl overflow-hidden divide-y divide-white border border-iosDivider/10">
              {categories.map((c) => (
                <div key={c.id} className={`px-4 py-3.5 transition-colors ${editingCategoryId === c.id ? 'bg-iosBlue/5' : ''}`}>
                  {editingCategoryId === c.id ? (
                    <div className="animate-fade-in py-1">
                      <input 
                        autoFocus
                        className="w-full px-3 py-2.5 rounded-lg bg-white border-2 border-iosBlue/40 outline-none text-[16px] transition-all font-medium"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEditedCategory()}
                      />
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[16px] font-semibold text-black truncate flex-1">{c.category}</span>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleStartEditCategory(c)}
                          className="w-10 h-10 flex items-center justify-center text-iosBlue bg-white shadow-sm border border-iosBlue/10 rounded-full active:scale-95 transition-transform"
                        >
                          <Edit2 size={16} />
                        </button>
                        {onDeleteCategory && (
                          <button 
                            onClick={() => handleDeleteCategory(c.id, c.category)}
                            className="w-10 h-10 flex items-center justify-center text-[#FF3B30] bg-white shadow-sm border border-[#FF3B30]/10 rounded-full active:scale-95 transition-transform"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {editingCategoryId && (
            <div className="pt-4 space-y-3 animate-slide-up px-1 border-t border-iosDivider/10">
              <Button 
                fullWidth 
                onClick={handleSaveEditedCategory}
                disabled={!editingCategoryName.trim() || catAdding}
                className="py-4 shadow-md"
              >
                Save Changes
              </Button>
              <button 
                onClick={() => setEditingCategoryId(null)}
                className="w-full py-3.5 text-iosGray font-bold text-[16px] active:bg-iosBg rounded-xl flex items-center justify-center gap-2"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};