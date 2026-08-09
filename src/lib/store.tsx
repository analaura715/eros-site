import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Meeting, Note, Prospect, User } from "./types";
import { MOCK_MEETINGS, MOCK_NOTES, MOCK_PROSPECTS, MOCK_USERS } from "./mock-data";

const LS_KEY = "crm_state_v1";
const AUTH_KEY = "crm_auth_v1";
const THEME_KEY = "crm_theme_v1";

interface State {
  users: User[];
  prospects: Prospect[];
  meetings: Meeting[];
  notes: Note[];
  notifications: { id: string, message: string, read: boolean, date: Date }[];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string; // Adicionado Cargo (Administrador, Vendedor, etc)
  notifyEmail: boolean;
  notifyDesktop: boolean;
  timezone?: string;
  defaultScreen?: string;
}

interface StoreContextType {
  state: State;
  auth: AuthUser | null;
  login: (email: string) => { ok: boolean; error?: string };
  setAuthSession: (user: AuthUser) => void; // Método oficial
  register: (name: string, email: string, _password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => void;
  
  // Notifications
  addNotification: (message: string) => void;
  markNotificationsAsRead: () => void;
  
  // Data actions
  addProspect: (p: Omit<Prospect, "id" | "createdAt">) => Prospect;
  updateProspect: (id: string, patch: Partial<Prospect>) => void;
  deleteProspect: (id: string) => void;
  addNote: (n: Omit<Note, "id" | "createdAt">) => void;
  addMeeting: (m: Omit<Meeting, "id">) => Meeting;
  updateMeeting: (id: string, patch: Partial<Meeting>) => void;
  deleteMeeting: (id: string) => void;
  theme: "light" | "dark" | "system";
  setTheme: (t: "light" | "dark" | "system") => void;
  toggleTheme: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const initialState = (): State => ({
  users: MOCK_USERS,
  prospects: MOCK_PROSPECTS,
  meetings: MOCK_MEETINGS,
  notes: MOCK_NOTES,
  notifications: [],
});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [auth, setAuth] = useState<AuthUser | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark" | "system">("system");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setState(JSON.parse(raw));
      const a = localStorage.getItem(AUTH_KEY);
      if (a) setAuth(JSON.parse(a));
      const t = localStorage.getItem(THEME_KEY) as "light" | "dark" | "system" | null;
      if (t) setThemeState(t);
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(LS_KEY, JSON.stringify(state));
  }, [state, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    else localStorage.removeItem(AUTH_KEY);
  }, [auth, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(THEME_KEY, theme);
    
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, hydrated]);

  const value = useMemo<StoreContextType>(
    () => ({
      state,
      auth,
      theme,
      setTheme: (t) => setThemeState(t),
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
      setAuthSession: (user) => setAuth(user),
      login: (email) => {
        const u = MOCK_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase()) ?? MOCK_USERS[0];
        setAuth({ id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: u.role || 'Padrão', notifyEmail: true, notifyDesktop: false });
        return { ok: true };
      },
      register: (name, email) => {
        if (!name || !email) return { ok: false, error: "Missing fields" };
        const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
        const newUser: User = { id: "u_" + Math.random().toString(36).slice(2, 7), name, email, avatar: initials, role: "Vendedor" };
        setState((s) => ({ ...s, users: [newUser, ...s.users] }));
        setAuth({ id: newUser.id, name, email, avatar: initials, role: "Vendedor", notifyEmail: true, notifyDesktop: false });
        return { ok: true };
      },
      logout: () => setAuth(null),
      updateProfile: (patch) => setAuth((a) => (a ? { ...a, ...patch } : a)),
      addProspect: (p) => {
        const np: Prospect = { ...p, id: "p_" + Math.random().toString(36).slice(2, 8), createdAt: new Date().toISOString() };
        setState((s) => ({ ...s, prospects: [np, ...s.prospects] }));
        return np;
      },
      updateProspect: (id, patch) =>
        setState((s) => ({ ...s, prospects: s.prospects.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      deleteProspect: (id) =>
        setState((s) => ({
          ...s,
          prospects: s.prospects.filter((p) => p.id !== id),
          meetings: s.meetings.filter((m) => m.prospectId !== id),
          notes: s.notes.filter((n) => n.prospectId !== id),
        })),
      addNote: (n) =>
        setState((s) => ({
          ...s,
          notes: [{ ...n, id: "n_" + Math.random().toString(36).slice(2, 8), createdAt: new Date().toISOString() }, ...s.notes],
        })),
      addMeeting: (m) => {
        const nm: Meeting = { ...m, id: "m_" + Math.random().toString(36).slice(2, 8) };
        setState((s) => ({ ...s, meetings: [nm, ...s.meetings] }));
        return nm;
      },
      updateMeeting: (id, patch) =>
        setState((s) => ({ ...s, meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMeeting: (id) => setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) })),
      
      addNotification: (message: string) => {
        setState((s) => ({
          ...s,
          notifications: [
            { id: crypto.randomUUID(), message, read: false, date: new Date() },
            ...(s.notifications || []),
          ],
        }));
      },
      markNotificationsAsRead: () => {
        setState((s) => ({
          ...s,
          notifications: (s.notifications || []).map(n => ({ ...n, read: true }))
        }));
      }
    }),
    [state, auth, theme],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function userById(users: User[], id: string): User | undefined {
  return users.find((u) => u.id === id);
}
