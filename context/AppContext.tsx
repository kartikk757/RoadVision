import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Camera, Role, User, Vehicle } from '../lib/types';
import { storage } from '../lib/storage';
import { cameras as seedCameras } from '../lib/mockData';

interface AppState {
  ready: boolean;
  user: User | null;
  onboarded: boolean;
  vehicle: Vehicle | null;
  cameras: Camera[];
  monitoring: boolean;
  demoMode: boolean;
  login: (name: string, role: Role, extra?: Pick<User, 'authority' | 'division'>) => Promise<void>;
  completeOnboarding: (vehicle: Vehicle, camera: Camera) => Promise<void>;
  setMonitoring: (v: boolean) => Promise<void>;
  setDemoMode: (v: boolean) => Promise<void>;
  addCamera: (c: Camera) => void;
  updateCamera: (id: string, patch: Partial<Camera>) => void;
  logout: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [onboarded, setOnboarded] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [cams, setCams] = useState<Camera[]>(seedCameras);
  const [monitoring, setMon] = useState(false);
  const [demoMode, setDemo] = useState(true);

  useEffect(() => {
    (async () => {
      const [u, o, v, m, d] = await Promise.all([
        storage.loadJson<User>(storage.keys.user),
        storage.loadJson<boolean>(storage.keys.onboarded),
        storage.loadJson<Vehicle>(storage.keys.vehicle),
        storage.loadJson<boolean>(storage.keys.monitoring),
        storage.loadJson<boolean>(storage.keys.demoMode),
      ]);
      if (u) setUser(u);
      if (o) setOnboarded(true);
      if (v) setVehicle(v);
      if (m) setMon(true);
      if (d === false) setDemo(false);
      setReady(true);
    })();
  }, []);

  const login = useCallback(async (name: string, role: Role, extra?: Pick<User, 'authority' | 'division'>) => {
    const u: User = { name, role, ...extra };
    setUser(u);
    await storage.saveJson(storage.keys.user, u);
  }, []);

  const completeOnboarding = useCallback(async (v: Vehicle, camera: Camera) => {
    setVehicle(v);
    setCams((prev) => {
      const exists = prev.some((c) => c.id === camera.id);
      return exists ? prev.map((c) => (c.id === camera.id ? camera : c)) : [camera, ...prev];
    });
    setOnboarded(true);
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

  const addCamera = useCallback((c: Camera) => {
    setCams((prev) => [c, ...prev]);
  }, []);

  const updateCamera = useCallback((id: string, patch: Partial<Camera>) => {
    setCams((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setOnboarded(false);
    setVehicle(null);
    setMon(false);
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
