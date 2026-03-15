export interface Category {
  id: string;
  category: string;
  last_updated: string;
}

export type ItemCategory = string;

export interface Item {
  id: string;
  name: string;
  category_id: string;
  quantity: number;
  last_updated: string;
  category?: string;
}

export interface Volunteer {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  color?: string;
}

export interface Assignment {
  id: string;
  itemId: string;
  volunteerId: string;
  volunteerFirstName?: string;
  volunteerLastName?: string;
  volunteerPhone?: string;
  volunteerColor?: string;
  quantity_assigned: number;
  assigned_at: string;
  returned_at?: string | null;
}

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
}
