
import React, { useState, useEffect } from 'react';
import { Users, Settings, LogOut, User, MapPin, Phone } from 'lucide-react';
import { StorageService, AuthService, supabase } from './services/storage';
import { Item, Volunteer, Assignment, UserProfile, Category } from './types';
import { InventoryList } from './components/InventoryList';
import { VolunteerList } from './components/VolunteerList';
import { Auth } from './components/Auth';
import { CubeLogo } from './components/ui/Logo';

type Tab = 'inventory' | 'people' | 'settings';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('inventory');
  const [items, setItems] = useState<Item[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    AuthService.getSession().then(s => {
      setSession(s);
      if (s) {
        loadData();
        AuthService.getProfile(s.user.id).then(setProfile);
      }
      else setLoading(false);
    });

    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadData();
        AuthService.getProfile(session.user.id).then(setProfile);
      }
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [i, v, a, c] = await Promise.all([
        StorageService.getItems(),
        StorageService.getVolunteers(),
        StorageService.getAssignments(),
        StorageService.getCategories()
      ]);
      setItems(i || []);
      setVolunteers(v || []);
      setAssignments(a || []);
      setCategories(c || []);
    } catch (err) {
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
    setItems([]);
    setVolunteers([]);
    setAssignments([]);
    setCategories([]);
  };

  const handleAddCategory = async (name: string) => {
    try {
      await StorageService.saveCategory(name);
      const updatedCategories = await StorageService.getCategories();
      setCategories(updatedCategories);
      showToast('Category added');
    } catch (err) {
      showToast('Failed to add category', 'error');
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await StorageService.updateCategory(id, name);
      const updatedCategories = await StorageService.getCategories();
      setCategories(updatedCategories);
      const updatedItems = await StorageService.getItems();
      setItems(updatedItems);
      showToast('Category updated');
    } catch (err) {
      showToast('Failed to update category', 'error');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await StorageService.deleteItem(id);
      await loadData();
      showToast('Item removed from registry');
    } catch (err) {
      showToast('Failed to remove item', 'error');
    }
  };

  if (!session && !loading) {
    return <Auth onAuthComplete={() => loadData()} />;
  }

  return (
    <div className="bg-iosBg min-h-screen flex flex-col font-sans">
      <header className="bg-white/80 ios-blur sticky top-0 z-50 border-b border-iosDivider safe-top">
        {activeTab === 'inventory' ? (
          <div className="px-5 pt-3 pb-3 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <CubeLogo size={42} color="#007AFF" />
               <div className="flex flex-col">
                 <span className="text-[17px] font-bold text-black leading-none">CommunityKeeper</span>
               </div>
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
            <div className="w-8 h-8 border-4 border-iosBlue border-t-transparent rounded-full animate-spin"></div>
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
                   onAssign={(i, v, q) => StorageService.saveAssignment({ itemId: i, volunteerId: v, quantity_assigned: q }).then(() => {
                     loadData();
                     showToast('Assigned successfully');
                   })}
                   onAddItem={(i) => StorageService.saveItem(i).then(() => loadData())}
                   onDeleteItem={handleDeleteItem}
                   onUnassign={(id) => StorageService.deleteAssignment(id).then(() => {
                     loadData();
                     showToast('Units returned');
                   })}
                   onAddCategory={handleAddCategory}
                   onUpdateCategory={handleUpdateCategory}
                 />
              </div>
            )}

            {activeTab === 'people' && (
              <div className="animate-fade-in px-4">
                 <VolunteerList 
                   volunteers={volunteers}
                   assignments={assignments}
                   items={items}
                   onAddVolunteer={(v) => StorageService.saveVolunteer(v).then(() => loadData())}
                   onDeleteVolunteer={(id) => StorageService.deleteVolunteer(id).then(() => loadData())}
                   onReturnItem={(id) => StorageService.deleteAssignment(id).then(() => loadData())}
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
                    <div>
                      <h3 className="text-[20px] font-bold text-black">{profile?.first_name} {profile?.last_name}</h3>
                      <p className="text-iosGray text-[15px]">{session?.user?.email}</p>
                    </div>
                  </div>
                  <div className="divide-y divide-iosDivider/20">
                    <div className="px-6 py-4 flex items-center gap-4">
                      <Phone size={18} className="text-iosGray" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-iosGray uppercase tracking-wider">Phone</span>
                        <span className="text-[16px] text-black">{profile?.phone || 'Not specified'}</span>
                      </div>
                    </div>
                    <div className="px-6 py-4 flex items-center gap-4">
                      <MapPin size={18} className="text-iosGray" />
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-iosGray uppercase tracking-wider">Address</span>
                        <span className="text-[16px] text-black">{profile?.address || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[12px] border border-iosDivider/30 overflow-hidden">
                  <button 
                    onClick={handleSignOut} 
                    className="w-full flex items-center justify-between px-6 py-4 active:bg-iosBg transition-colors"
                  >
                    <div className="flex items-center gap-3 text-[#FF3B30]">
                      <LogOut size={18} />
                      <span className="text-[17px] font-semibold">Sign Out of Account</span>
                    </div>
                  </button>
                </div>
                
                <div className="text-center pb-8">
                  <p className="text-[13px] text-iosGray">CommunityKeeper v3.6.0</p>
                  <p className="text-[11px] text-iosGray/50 mt-1">Registry Management System</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-[200] bg-[#323232]/95 ios-blur text-white text-[14px] font-medium animate-slide-up">
          {toast.msg}
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full bg-white/90 ios-blur border-t border-iosDivider z-50 safe-bottom">
        <div className="flex h-[49px]">
          <button onClick={() => setActiveTab('inventory')} className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'inventory' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <CubeLogo size={26} color={activeTab === 'inventory' ? '#007AFF' : '#8E8E93'} />
            <span className="text-[10px] font-medium mt-0.5">Inventory</span>
          </button>
          <button onClick={() => setActiveTab('people')} className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'people' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <Users size={23} />
            <span className="text-[10px] font-medium mt-0.5">People</span>
          </button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 flex flex-col items-center justify-center ${activeTab === 'settings' ? 'text-iosBlue' : 'text-[#8E8E93]'}`}>
            <Settings size={23} />
            <span className="text-[10px] font-medium mt-0.5">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
