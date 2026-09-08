import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Camera, Role, User, Vehicle } from '../lib/types';
import { storage } from '../lib/storage';
import { fetchCameras, saveVehicleAndCamera, updateCameraRecord } from '../services/backendData';
import { isSupabaseConfigured, supabase } from '../utils/supabase';

interface AppState {
  ready: boolean;
  user: User | null;
  onboarded: boolean;
  vehicle: Vehicle | null;
  cameras: Camera[];
  monitoring: boolean;
  demoMode: boolean;
  login: (name: string, email: string, password: string, role: Role, extra?: Pick<User, 'authority' | 'division'>) => Promise<void>;
  completeOnboarding: (vehicle: Vehicle, camera: Camera) => Promise<void>;
  setMonitoring: (v: boolean) => Promise<void>;
  setDemoMode: (v: boolean) => Promise<void>;
  addCamera: (c: Camera) => Promise<void>;
  updateCamera: (id: string, patch: Partial<Camera>) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [cams, setCams] = useState<Camera[]>([]);
  const [monitoring, setMon] = useState(false);
  const [demoMode, setDemo] = useState(!isSupabaseConfigured);

  useEffect(() => {
    (async () => {
      try {
        const [o, v, m, d] = await Promise.all([
          storage.loadJson<boolean>(storage.keys.onboarded),
          storage.loadJson<Vehicle>(storage.keys.vehicle),
          storage.loadJson<boolean>(storage.keys.monitoring),
          storage.loadJson<boolean>(storage.keys.demoMode),
        ]);

        if (o) setOnboarded(true);
        if (v) setVehicle(v);
        if (m) setMon(true);
        if (d === false) setDemo(false);

        if (!isSupabaseConfigured) {
          const demoUser: User = { name: 'Demo Operator', role: 'admin' };
          setUser(demoUser);
          setOnboarded(true);
          setReady(true);
          return;
        }

        const sessionPromise = Promise.race([
          supabase!.auth.getSession(),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Auth timeout')), 2000)),
        ]);

        const sessionData = await sessionPromise;
        if (sessionData.data.session) {
          const realCameras = await fetchCameras();
          setCams(realCameras);
        }
        if (sessionData.data.session) {
          const { data: profile } = await Promise.race([
            supabase!
              .from('profiles')
              .select('name, role, authority, division')
              .eq('id', sessionData.data.session.user.id)
              .maybeSingle(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 2000)),
          ]);
          if (profile) setUser(profile as User);
        }
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const login = useCallback(async (name: string, email: string, password: string, role: Role, extra?: Pick<User, 'authority' | 'division'>) => {
    const demoFallback = async () => {
      const u: User = { name: name.trim() || 'Demo Operator', role, ...extra };
      setUser(u);
      setOnboarded(true);
      await storage.saveJson(storage.keys.onboarded, true);
    };

    if (!isSupabaseConfigured) {
      await demoFallback();
      return;
    }

    try {
      const signIn = await Promise.race([
        supabase!.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 2000)),
      ]);
      let userId = signIn.data.user?.id;
      if (signIn.error || !userId) {
        const signUp = await Promise.race([
          supabase!.auth.signUp({
            email,
            password,
            options: { data: { name } },
          }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Signup timeout')), 2000)),
        ]);
        if (signUp.error) throw new Error(signUp.error.message);
        if (!signUp.data.session || !signUp.data.user) {
          throw new Error('Account created. Check your email to confirm it, then sign in.');
        }
        userId = signUp.data.user.id;
      }
      const profileResult = await Promise.race([
        supabase!.from('profiles').upsert(
          {
            id: userId,
            name,
            role,
            ...extra,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Profile save timeout')), 2000)),
      ]);
      const { error: profileError } = profileResult;
      if (profileError) {
        if (profileError.code === '42501') {
          throw new Error('We could not finish setting up your profile. Please try again shortly.');
        }
        throw new Error(profileError.message);
      }
      const u: User = { name, role, ...extra };
      setUser(u);
      const backendCameras = await fetchCameras();
      setCams(backendCameras);
    } catch (error) {
      throw error;
    }
  }, []);

  const completeOnboarding = useCallback(async (v: Vehicle, camera: Camera) => {
    setVehicle(v);
    setCams((prev) => {
      const exists = prev.some((c) => c.id === camera.id);
      return exists ? prev.map((c) => (c.id === camera.id ? camera : c)) : [camera, ...prev];
    });
    setOnboarded(true);
    await saveVehicleAndCamera(v, camera);
    await storage.saveJson(storage.keys.vehicle, v);
    await storage.saveJson(storage.keys.onboarded, true);
  }, []);

  const setMonitoring = useCallback(async (v: boolean) => {
    setMon(v);
    await storage.saveJson(storage.keys.monitoring, v);
  }, []);

  const setDemoMode = useCallback(async (v: boolean) => {
    setDemo(v);
    await storage.saveJson(storage.keys.demoMode, v);
  }, []);

  const addCamera = useCallback(async (c: Camera) => {
    setCams((prev) => [c, ...prev]);
    await saveVehicleAndCamera({ id: c.vehicleId, type: 'City Bus', route: c.route }, c);
  }, []);

  const updateCamera = useCallback(async (id: string, patch: Partial<Camera>) => {
    setCams((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    await updateCameraRecord(id, patch);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setOnboarded(false);
    setVehicle(null);
    setMon(false);
    if (isSupabaseConfigured) {
      await supabase!.auth.signOut();
    }
    await storage.clearAll();
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      onboarded,
      vehicle,
      cameras: cams,
      monitoring,
      demoMode,
      login,
      completeOnboarding,
      setMonitoring,
      setDemoMode,
      addCamera,
      updateCamera,
      logout,
    }),
    [ready, user, onboarded, vehicle, cams, monitoring, demoMode, login, completeOnboarding, setMonitoring, setDemoMode, addCamera, updateCamera, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
}
