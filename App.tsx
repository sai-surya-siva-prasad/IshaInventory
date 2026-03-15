
import React, { useState, useEffect } from 'react';
import { Users, Settings, LogOut, User, MapPin, Phone, Edit3 } from 'lucide-react';
import { StorageService, AuthService, supabase } from './services/storage';
import { Item, Volunteer, Assignment, UserProfile, Category } from './types';
import { InventoryList } from './components/InventoryList';
import { VolunteerList } from './components/VolunteerList';
import { Auth } from './components/Auth';
import { CubeLogo } from './components/ui/Logo';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { SplashScreen } from './components/SplashScreen';

type Tab = 'inventory' | 'people' | 'settings';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [items, setItems] = useState<Item[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  useEffect(() => {
    AuthService.getSession().then(s => {
      setSession(s);
      if (s) {
        loadData();
        AuthService.getProfile(s.user.id).then(setProfile);
      } else {
        setLoading(false);
      }
    }).catch(() => setLoading(false));

    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
          loadData();
          AuthService.getProfile(session.user.id).then(setProfile);
        } else {
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }
    return () => { if (subscription) subscription.unsubscribe(); };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [i, v, a, c] = await Promise.all([
        StorageService.getItems(),
        StorageService.getVolunteers(),
        StorageService.getAssignments(),
        StorageService.getCategories(),
      ]);
      setItems(i || []);
      setVolunteers(v || []);
      setAssignments(a || []);
      setCategories(c || []);
    } catch {
      showToast('Sync error', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleSignOut = async () => {
    await AuthService.signOut();
    setSession(null);
    setProfile(null);
    setItems([]); setVolunteers([]); setAssignments([]); setCategories([]);
  };

  // ── Inventory handlers ──

  const handleAssign = async (itemId: string, volunteerId: string, quantity: number) => {
    await StorageService.saveAssignment({ itemId, volunteerId, quantity_assigned: quantity });
    await loadData();
    showToast('Assigned');
  };

  const handleTransfer = async (
    fromAssignmentId: string,
    itemId: string,
    fromCurrentQty: number,
    toVolunteerId: string,
    quantityToMove: number
  ) => {
    await StorageService.transferAssignment(fromAssignmentId, itemId, fromCurrentQty, toVolunteerId, quantityToMove);
    await loadData();
    showToast('Moved');
  };

  const handleReturn = async (assignmentId: string) => {
    await StorageService.returnAssignment(assignmentId);
    await loadData();
    showToast('Returned');
  };

  const handleAddItem = async (item: Partial<Item>) => {
    await StorageService.saveItem(item);
    await loadData();
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await StorageService.deleteItem(id);
      await loadData();
      showToast('Item removed');
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  const handleAddCategory = async (name: string) => {
    await StorageService.saveCategory(name);
    const updated = await StorageService.getCategories();
    setCategories(updated);
    showToast('Category added');
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    await StorageService.updateCategory(id, name);
    const [updatedCats, updatedItems] = await Promise.all([
      StorageService.getCategories(),
      StorageService.getItems(),
    ]);
    setCategories(updatedCats);
    setItems(updatedItems);
    showToast('Category updated');
  };

  const handleDeleteCategory = async (id: string) => {
    await StorageService.deleteCategory(id);
    const updated = await StorageService.getCategories();
    setCategories(updated);
    showToast('Category deleted');
  };

  // ── Volunteer handlers ──

  const handleAddVolunteer = async (v: Partial<Volunteer>) => {
    await StorageService.saveVolunteer(v);
    await loadData();
  };

  const handleUpdateVolunteer = async (v: Volunteer) => {
    await StorageService.saveVolunteer(v);
    await loadData();
    showToast('Member updated');
  };

  const handleDeleteVolunteer = async (id: string) => {
    await StorageService.deleteVolunteer(id);
    await loadData();
  };

  // ── Profile ──

  const openEditProfile = () => {
    setEditFirstName(profile?.first_name || '');
    setEditLastName(profile?.last_name || '');
    setEditPhone(profile?.phone || '');
    setEditAddress(profile?.address || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    try {
      await AuthService.updateProfile(session.user.id, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
      });
      const updated = await AuthService.getProfile(session.user.id);
      setProfile(updated);
      setIsEditProfileOpen(false);
      showToast('Profile updated');
    } catch {
      showToast('Failed to update profile', 'error');
    }
  };

  if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />;
  if (!session && !loading) return <Auth onAuthComplete={() => loadData()} />;

  return (
    <div className="bg-iosBg min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 ios-blur sticky top-0 z-50 border-b border-iosDivider safe-top">
        {activeTab === 'inventory' ? (
          <div className="px-5 pt-3 pb-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CubeLogo size={42} color="#007AFF" />
              <span className="text-[17px] font-bold text-black">WhoHasWhat</span>
            </div>
            <button onClick={handleSignOut} className="text-iosGray p-2 active:opacity-40">
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="px-5 pt-6 pb-4">
            <h2 className="text-[34px] font-extrabold text-black tracking-tight">
              {activeTab === 'people' ? 'People' : 'Settings'}
            </h2>
          </div>
        )}
      </header>

      <main className="flex-1 pb-32 pt-2">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-iosBlue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <div className="animate-fade-in px-4">
                <InventoryList
                  items={items}
                  volunteers={volunteers}
                  assignments={assignments}
                  categories={categories}
                  onAssign={handleAssign}
                  onTransfer={handleTransfer}
                  onReturn={handleReturn}
                  onAddItem={handleAddItem}
                  onDeleteItem={handleDeleteItem}
                  onAddCategory={handleAddCategory}
                  onUpdateCategory={handleUpdateCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </div>
            )}

            {activeTab === 'people' && (
              <div className="animate-fade-in px-4">
                <VolunteerList
                  volunteers={volunteers}
                  assignments={assignments}
                  items={items}
                  onAddVolunteer={handleAddVolunteer}
                  onUpdateVolunteer={handleUpdateVolunteer}
                  onDeleteVolunteer={handleDeleteVolunteer}
                  onReturnItem={handleReturn}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="animate-fade-in px-4 space-y-6">
                <div className="bg-white rounded-[16px] border border-iosDivider/30 overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-iosDivider/30 flex items-center gap-4">
                    <div className="w-16 h-16 bg-iosBlue/10 rounded-full flex items-center justify-center text-iosBlue">
                      <User size={32} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[20px] font-bold text-black">{profile?.first_name} {profile?.last_name}</h3>
                      <p className="text-iosGray text-[15px]">{session?.user?.email}</p>
                    </div>
                    <button
                      onClick={openEditProfile}
                      className="w-10 h-10 bg-iosBlue/10 rounded-full flex items-center justify-center text-iosBlue active:bg-iosBlue/20"
                    >
                      <Edit3 size={18} />
                    </button>
                  </div>
                  <div className="divide-y divide-iosDivider/20">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <Phone size={18} className="text-iosGray" />
                      <div>
                        <span className="text-[13px] font-medium text-iosGray uppercase tracking-wider block">Phone</span>
                        <span className="text-[16px] text-black">{profile?.phone || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <MapPin size={18} className="text-iosGray" />
                      <div>
                        <span className="text-[13px] font-medium text-iosGray uppercase tracking-wider block">Address</span>
                        <span className="text-[16px] text-black">{profile?.address || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[12px] border border-iosDivider/30 overflow-hidden">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center px-6 py-4 active:bg-iosBg transition-colors"
                  >
                    <div className="flex items-center gap-3 text-[#FF3B30]">
                      <LogOut size={18} />
                      <span className="text-[17px] font-semibold">Sign Out</span>
                    </div>
                  </button>
                </div>

                <div className="text-center pb-8">
                  <p className="text-[13px] text-iosGray">WhoHasWhat v1.1.0</p>
                  <p className="text-[11px] text-iosGray/50 mt-1">Isha Inventory Tracker</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-[200] ios-blur text-white text-[14px] font-medium animate-slide-up
          ${toast.type === 'error' ? 'bg-[#FF3B30]/90' : 'bg-[#323232]/95'}`}>
          {toast.msg}
        </div>
      )}

      <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Edit Profile">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-iosGray uppercase tracking-wider block mb-2 px-1">First Name</label>
              <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
                value={editFirstName} onChange={e => setEditFirstName(e.target.value)} placeholder="First Name" />
            </div>
            <div>
              <label className="text-[12px] font-medium text-iosGray uppercase tracking-wider block mb-2 px-1">Last Name</label>
              <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
                value={editLastName} onChange={e => setEditLastName(e.target.value)} placeholder="Last Name" />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-iosGray uppercase tracking-wider block mb-2 px-1">Phone</label>
            <input className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px]"
              value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Phone Number" type="tel" />
          </div>
          <div>
            <label className="text-[12px] font-medium text-iosGray uppercase tracking-wider block mb-2 px-1">Address</label>
            <textarea className="w-full px-4 py-3.5 rounded-[12px] bg-iosBg outline-none text-[17px] resize-none"
              value={editAddress} onChange={e => setEditAddress(e.target.value)} rows={3} />
          </div>
          <Button fullWidth onClick={handleSaveProfile} disabled={!editFirstName || !editLastName}>
            Save Changes
          </Button>
        </div>
      </Modal>

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 ios-blur border-t border-iosDivider z-50 safe-bottom">
        <div className="flex h-[49px]">
          <button onClick={() => setActiveTab('inventory')}
            className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'inventory' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <CubeLogo size={26} color={activeTab === 'inventory' ? '#007AFF' : '#8E8E93'} />
            <span className="text-[10px] font-medium mt-0.5">Inventory</span>
          </button>
          <button onClick={() => setActiveTab('people')}
            className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'people' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <Users size={23} />
            <span className="text-[10px] font-medium mt-0.5">People</span>
          </button>
          <button onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'settings' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <Settings size={23} />
            <span className="text-[10px] font-medium mt-0.5">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
