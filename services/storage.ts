
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Item, Volunteer, Assignment, UserProfile, Category } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dnsmugvjkbjjpxvqdpdt.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc211Z3Zqa2JqanB4dnFkcGR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5OTU0MDUsImV4cCI6MjA4MTU3MTQwNX0.fycPooCLyds928NXYcjqD9AryTcNoyTNM_LLdxlGeH4';

export const supabase: SupabaseClient | null = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const AuthService = {
  async signUp(email: string, pass: string, profileData: Partial<UserProfile>) {
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
        }
      }
    });

    if (authError) throw authError;

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
        updated_at: new Date().toISOString()
      });
    }
    return data;
  },

  async signIn(email: string, pass: string) {
    if (!supabase) throw new Error("Supabase not configured");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  },

  async updateProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    if (!supabase) throw new Error("Supabase not configured");
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        address: profileData.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    if (error) throw error;
  }
};

export const StorageService = {
  async getCategories(): Promise<Category[]> {
    if (supabase) {
      const { data } = await supabase
        .from('isha_static_categories')
        .select('*')
        .order('category');
      return data || [];
    }
    return [];
  },

  async saveCategory(name: string): Promise<Category> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('isha_static_categories')
        .insert({ category: name, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    throw new Error("Supabase not configured");
  },

  async updateCategory(id: string, name: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('isha_static_categories')
        .update({ category: name, last_updated: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    } else {
      throw new Error("Supabase not configured");
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (supabase) {
      const { error } = await supabase
        .from('isha_static_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } else {
      throw new Error("Supabase not configured");
    }
  },

  async getItems(): Promise<Item[]> {
    if (supabase) {
      const { data } = await supabase
        .from('isha_items')
        .select('*, isha_static_categories(category)')
        .order('name');

      return (data || []).map(item => ({
        ...item,
        category: item.isha_static_categories?.category || 'Uncategorized'
      }));
    }
    return [];
  },

  async saveItem(item: Partial<Item>) {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        name: item.name,
        category_id: item.category_id,
        quantity: item.quantity,
        last_updated: new Date().toISOString(),
        user_id: user?.id
      };

      if (item.id) payload.id = item.id;

      const { error } = await supabase.from('isha_items').upsert(payload);
      if (error) throw error;
    }
  },

  async deleteItem(id: string) {
    if (supabase) {
      const { error } = await supabase
        .from('isha_items')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  async getVolunteers(): Promise<Volunteer[]> {
    if (supabase) {
      const { data } = await supabase.from('volunteers').select('*').order('first_name');
      return data || [];
    }
    return [];
  },

  async saveVolunteer(v: Partial<Volunteer>): Promise<Volunteer> {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const payload: any = {
        first_name: v.first_name,
        last_name: v.last_name,
        phone: v.phone,
        address: v.address,
        color: v.color || '#007AFF',
        user_id: user?.id
      };

      if (v.id) payload.id = v.id;

      const { data, error } = await supabase
        .from('volunteers')
        .upsert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    throw new Error('Supabase not configured');
  },

  async deleteVolunteer(id: string) {
    if (supabase) {
      const { error } = await supabase
        .from('volunteers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  },

  // Returns only active (not yet returned) assignments, joined with volunteer info
  async getAssignments(): Promise<Assignment[]> {
    if (supabase) {
      const { data } = await supabase
        .from('isha_item_assignments')
        .select('*, volunteers(first_name, last_name, phone, color)')
        .is('returned_at', null)
        .order('assigned_at', { ascending: false });

      return (data || []).map(a => ({
        id: a.id,
        itemId: a.item_id,
        volunteerId: a.volunteer_id,
        volunteerFirstName: a.volunteers?.first_name,
        volunteerLastName: a.volunteers?.last_name,
        volunteerPhone: a.volunteers?.phone,
        volunteerColor: a.volunteers?.color || '#007AFF',
        quantity_assigned: a.quantity_assigned,
        assigned_at: a.assigned_at,
        returned_at: a.returned_at
      }));
    }
    return [];
  },

  async saveAssignment(a: Partial<Assignment>) {
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('isha_item_assignments').insert({
        item_id: a.itemId,
        volunteer_id: a.volunteerId,
        quantity_assigned: a.quantity_assigned || 1,
        user_id: user?.id
      });
      if (error) throw error;
    }
  },

  // Marks an assignment as returned (preserves history) instead of deleting
  async returnAssignment(id: string) {
    if (supabase) {
      const { error } = await supabase
        .from('isha_item_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    }
  },

  // Moves quantity from one person to another.
  // If moving all → marks old as returned. If partial → reduces old qty, creates new.
  async transferAssignment(
    fromAssignmentId: string,
    itemId: string,
    fromCurrentQty: number,
    toVolunteerId: string,
    quantityToMove: number
  ) {
    if (!supabase) throw new Error("Supabase not configured");
    const { data: { user } } = await supabase.auth.getUser();

    if (quantityToMove >= fromCurrentQty) {
      // Full move — mark old as returned
      const { error: retErr } = await supabase
        .from('isha_item_assignments')
        .update({ returned_at: new Date().toISOString() })
        .eq('id', fromAssignmentId);
      if (retErr) throw retErr;
    } else {
      // Partial move — reduce old quantity
      const { error: reduceErr } = await supabase
        .from('isha_item_assignments')
        .update({ quantity_assigned: fromCurrentQty - quantityToMove })
        .eq('id', fromAssignmentId);
      if (reduceErr) throw reduceErr;
    }

    // Create new assignment for the receiving volunteer
    const { error: newErr } = await supabase.from('isha_item_assignments').insert({
      item_id: itemId,
      volunteer_id: toVolunteerId,
      quantity_assigned: quantityToMove,
      user_id: user?.id
    });
    if (newErr) throw newErr;
  },

  async deleteAssignment(id: string) {
    if (supabase) {
      const { error } = await supabase
        .from('isha_item_assignments')
        .delete()
        .eq('id', id);
      if (error) throw error;
    }
  }
};
