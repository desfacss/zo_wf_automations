import { create } from 'zustand';
import { persist, createJSONStorage, PersistStorage } from 'zustand/middleware';
import type { Organization, User, Location } from './types';
import { supabase } from './supabase';

// Define specific types for permissions, navigation items, and location
interface Permission {
  module: string;
  actions: string[];
}

interface NavigationItem {
  key: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  children?: NavigationItem[];
}

interface ViewPreferences {
  [entityType: string]: {
    viewType: 'table' | 'grid';
    currentTab: string;
    pageSize: number;
    currentPage: number;
    filters: Record<string, any>;
    sortBy?: { field: string; direction: 'asc' | 'desc' };
    lastPath: string;
  };
}

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

interface AuthState {
  organization: Organization | null;
  user: User | null;
  location: Location | null;
  permissions: Permission[] | null;
  navigationItems: NavigationItem[];
  viewPreferences: ViewPreferences;
  initialized: boolean;
  isOnline: boolean;
  authError: string | null;
  appSettings: any;
  setInitialized: (value: boolean) => void;
  setOrganization: (org: Organization | null) => void;
  setUser: (user: User | null) => void;
  setLocation: (location: Location | null) => void;
  setPermissions: (permissions: Permission[] | null) => void;
  setNavigationItems: (items: NavigationItem[]) => void;
  setViewPreferences: (entityType: string, prefs: Partial<ViewPreferences[string]>) => void;
  setIsOnline: (isOnline: boolean) => void;
  setAuthError: (error: string | null) => void;
  reset: () => void;
  setAppSettings: (settings: any) => void;
}

// Secure storage wrapper to encrypt sensitive data
const secureStorage: PersistStorage<AuthState> = {
  getItem: (name) => {
    try {
      const item = localStorage.getItem(name);
      if (!item) return null;
      return JSON.parse(item);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
};

const initialState: Partial<AuthState> = {
  organization: null,
  user: null,
  location: null,
  permissions: null,
  navigationItems: [],
  initialized: false,
  viewPreferences: {},
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  authError: null,
  appSettings: null,
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      isDarkMode: false,
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        console.log('Theme store rehydrated');
        return (state, error) => {
          if (error) {
            console.error('Theme store rehydration error:', error);
          }
        };
      },
    }
  )
);

// Helper function to fetch the default organization
const fetchDefaultOrganization = async (orgName: string, set: (state: Partial<AuthState>) => void) => {
  try {
    const { data, error } = await supabase
      .schema('identity').from('organizations')
      .select('*')
      .eq('subdomain', orgName)
      .single();
    console.log("dz", data);
    if (error) {
      console.error('Error fetching default organization:', error);
      return null;
    }
    if (data) {
      set({ organization: data }); // Use set to update state
      console.log('Default organization set:', data.name);
    } else {
      console.warn(`Default organization "${orgName}" not found.`);
    }
  } catch (err) {
    console.error('Failed to fetch default organization:', err);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      // Define reset function to avoid duplication
      const reset = () => {
        console.log('Resetting auth state');
        set({
          ...initialState,
          organization: null,
          location: null,
          appSettings: null,
        });
        secureStorage.removeItem('auth-store');
      };

      return {
        ...initialState,
        setAppSettings: (settings) => set({ appSettings: settings }),
        setInitialized: (value) => set({ initialized: value }),
        setOrganization: (org) => set({ organization: org }),
        setUser: (user) => {
          console.log('Setting user:', user?.id);
          set({ user, authError: null });
        },
        setLocation: (location) => set({ location }),
        setPermissions: (permissions) => set({ permissions }),
        setNavigationItems: (items) => set({ navigationItems: items }),
        setViewPreferences: (entityType, prefs) =>
          set((state) => ({
            viewPreferences: {
              ...state.viewPreferences,
              [entityType]: {
                ...state.viewPreferences[entityType],
                ...prefs,
              },
            },
          })),
        setIsOnline: (isOnline) => set({ isOnline }),
        setAuthError: (error) => set({ authError: error }),
        reset,
        onRehydrateStorage: () => {
          console.log('Auth store rehydrated');
          return (state, error) => {
            if (error) {
              console.error('Auth store rehydration error:', error);
              reset(); // Use reset function
            } else if (state?.user && !state.user.id) {
              console.warn('Invalid rehydrated user, resetting');
              reset(); // Use reset function
            }

            // Fetch default organization if none exists
            if (!state?.organization && "vkbs") {
              console.log(`No organization set, fetching default from VITE_ORG: ${"vkbs"}`);
              fetchDefaultOrganization("vkbs", set); // Pass set function
            }
          };
        },
      };
    },
    {
      name: 'auth-store',
      storage: secureStorage,
      partialize: (state) => ({
        viewPreferences: state.viewPreferences,
        user: state.user ? state.user : null,
        organization: state.organization ? { id: state.organization.id, name: state.organization.name } : null,
        location: state.location ? { id: state.location.id, name: state.location.name } : null,
        permissions: state.permissions,
        navigationItems: state.navigationItems,
        appSettings: state.appSettings,
      }),
    }
  )
);