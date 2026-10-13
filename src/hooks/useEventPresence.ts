"use client";

import { Geolocation } from "@capacitor/geolocation";
import { getLiveStatus } from "@/services/presence";
import { useMutation } from "./useMutation";

// The existing presence check, not a separate detector or another provider.
export function useEventPresence() {
  return useMutation(async () => {
    const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, maximumAge: 300000, timeout: 10000 });
    return getLiveStatus(position.coords.latitude, position.coords.longitude);
  });
}
