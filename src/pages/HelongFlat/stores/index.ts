import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type ConeStyle = "cone" | "smooth-cone" | "cylinder" | "sphere" | "box";

interface ConfigStore {
  mapPlayComplete: boolean;
  
  // Customizer Settings
  heightScale: number;
  beamColor: string;
  lightMainColor: string;
  lightFillColor: string;
  flyLineColor: string;
  labelColor: string;
  coneColor: string;
  coneStyle: ConeStyle;
  
  // Background & Skirt Customizations
  bgColor: string;
  skirtColor: string;
  bgImage: string | null;
  bgRepeat: boolean;
  bgSize: number;

  // Ground Floor Customizations
  floorColor: string;
  floorImageMode: "color" | "texture" | "custom";
  floorImage: string | null;
  floorRepeat: number;

  // Sky System Customizations
  skyInclination: number;
  skyAzimuth: number;
  skyRayleigh: number;
  skyTurbidity: number;
  skyMode: "procedural" | "panorama";
  skyPreset: "none" | "sunset" | "orchard" | "night";
  skyImage: string | null;
  skySunGlow: boolean;
  skySunScale: number;

  toggle: (key: keyof Omit<ConfigStore, "toggle" | "reset" | "setField">) => void;
  setField: <K extends keyof Omit<ConfigStore, "toggle" | "reset" | "setField">>(
    key: K,
    value: ConfigStore[K]
  ) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigStore>()(
  subscribeWithSelector((set) => ({
    mapPlayComplete: false,
    heightScale: 1.1,
    beamColor: "#8fc2ff",
    lightMainColor: "#ffffff",
    lightFillColor: "#4a90e2",
    flyLineColor: "#8fc2ff",
    labelColor: "#ffffff",
    coneColor: "#8fc2ff",
    coneStyle: "cone",
    
    bgColor: "#000000",
    skirtColor: "#8fc2ff",
    bgImage: null,
    bgRepeat: false,
    bgSize: 200,

    floorColor: "#011024",
    floorImageMode: "texture",
    floorImage: "/textures/floor_texture_20x.png",
    floorRepeat: 20,

    skyInclination: 0.3,
    skyAzimuth: 0.25,
    skyRayleigh: 3.0,
    skyTurbidity: 8.0,
    skyMode: "procedural",
    skyPreset: "none",
    skyImage: null,
    skySunGlow: true,
    skySunScale: 10,

    toggle: (key) => set((s) => ({ [key]: !s[key] })),
    setField: (key, value) => set(() => ({ [key]: value })),
    reset: () =>
      set({
        mapPlayComplete: false,
        heightScale: 1.1,
        beamColor: "#8fc2ff",
        lightMainColor: "#ffffff",
        lightFillColor: "#4a90e2",
        flyLineColor: "#8fc2ff",
        labelColor: "#ffffff",
        coneColor: "#8fc2ff",
        coneStyle: "cone",
        
        bgColor: "#000000",
        skirtColor: "#8fc2ff",
        bgImage: null,
        bgRepeat: false,
        bgSize: 200,

        floorColor: "#011024",
        floorImageMode: "texture",
        floorImage: "/textures/floor_texture_20x.png",
        floorRepeat: 20,

        skyInclination: 0.3,
        skyAzimuth: 0.25,
        skyRayleigh: 3.0,
        skyTurbidity: 8.0,
        skyMode: "procedural",
        skyPreset: "none",
        skyImage: null,
        skySunGlow: true,
        skySunScale: 10,
      }),
  }))
);

