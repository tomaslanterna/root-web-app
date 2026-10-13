import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { getBadgeFlyer, getBadgeArtistImage } from "./badges";
import { attendanceDate, badgeProgress } from "@/lib/badgeAppearance";
import { badgeLocation } from "@/lib/badgeLocation";
import type { EventBadge } from "@/types/badges";

export async function createBadgeCard(badge: EventBadge): Promise<File> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No se puede generar la imagen en este dispositivo.");
  ctx.fillStyle = "#0B0D10"; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "white"; ctx.font = "italic 900 64px Geist, sans-serif"; ctx.fillText("root", 72, 110);
  ctx.fillStyle = "#9ca3af"; ctx.font = "24px Geist, sans-serif"; ctx.fillText("CADA INSIGNIA, UNA NOCHE PARA RECORDAR.", 72, 159);
  if (badge.stepsPreview || badge.mostDancedPreview) { ctx.font = "24px Geist, sans-serif"; ctx.fillText("EJEMPLO VISUAL · DATOS DE PRUEBA", 72, 208); }
  const x = 540, y = 590, radius = badge.mostDanced ? 280 : 245;
  ctx.fillStyle = "#14171F"; ctx.beginPath(); ctx.arc(x, y, 350, 0, Math.PI * 2); ctx.fill();
  let officialImage: Blob | undefined;
  if (badge.imageUrl) {
    try { officialImage = await getBadgeFlyer(badge.eventId); }
    catch (error) { if (!badge.headliner?.imageUrl) throw error; }
  }
  if (!officialImage && badge.headliner?.imageUrl) officialImage = await getBadgeArtistImage(badge.eventId, badge.headliner.id);
  if (officialImage) {
    const objectUrl = URL.createObjectURL(officialImage);
    try {
      const image = new Image(); image.src = objectUrl; await image.decode();
      const size = Math.min(image.naturalWidth, image.naturalHeight);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.clip();
      if (badge.review == null) { ctx.filter = "saturate(.25) brightness(.8)"; ctx.globalAlpha = .65; }
      ctx.drawImage(image, (image.naturalWidth - size) / 2, (image.naturalHeight - size) / 2, size, size, x - radius, y - radius, radius * 2, radius * 2); ctx.restore();
    } finally { URL.revokeObjectURL(objectUrl); }
  } else {
    ctx.fillStyle = "#252932"; ctx.beginPath(); ctx.arc(x,y,radius,0,2*Math.PI); ctx.fill();
    ctx.textAlign = "center"; ctx.fillStyle = "#71717a"; ctx.font = "900 120px Geist, sans-serif"; ctx.fillText(badge.title[0] || "r", x,y+40);
  }
  if (badge.mostDanced) {
    ctx.strokeStyle = "#D4FF00"; ctx.lineWidth = 70; ctx.beginPath(); ctx.arc(x,y,315,0,2*Math.PI); ctx.stroke();
  } else {
    ctx.lineWidth = 7; ctx.strokeStyle = "#252932";
    if (badge.review == null) ctx.setLineDash([10.5,17.5]);
    ctx.beginPath(); ctx.arc(x,y,336,0,2*Math.PI); ctx.stroke(); ctx.setLineDash([]);
    ctx.lineWidth = 16; ctx.strokeStyle = "#2a2e37"; ctx.beginPath(); ctx.arc(x,y,300,0,2*Math.PI); ctx.stroke();
    const progress = badgeProgress(badge.review?.generalRating);
    if (progress > 0) { ctx.strokeStyle = "#D4FF00"; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x,y,300,-Math.PI/2,-Math.PI/2+2*Math.PI*progress/100); ctx.stroke(); }
  }
  if (badge.review == null) {
    ctx.fillStyle = "#D4FF00"; ctx.beginPath(); ctx.roundRect(435,854,210,55,28); ctx.fill(); ctx.fillStyle = "#0B0D10"; ctx.font = "600 28px Geist, sans-serif"; ctx.textAlign = "center"; ctx.fillText("Reseñar",x,892);
  }
  ctx.textAlign = "center";
  const wrap = (text: string, top: number, maxWidth: number, lineHeight: number, maxLines: number) => {
    const lines: string[] = []; let line = "";
    for (const word of text.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else { line = next; }
    }
    if (line) lines.push(line);
    const shown = lines.slice(0,maxLines);
    if (lines.length > maxLines) shown[maxLines-1] = `${shown[maxLines-1]}…`;
    shown.forEach((item,index)=>ctx.fillText(item,x,top+index*lineHeight,maxWidth));
  };
  ctx.fillStyle = "#fff"; ctx.font = "700 48px Geist, sans-serif"; wrap(badge.title,1005,920,58,2);
  ctx.fillStyle = "#a3a3a3"; ctx.font = "28px Geist, sans-serif"; wrap(badgeLocation(badge),1150,920,36,2); ctx.fillText(attendanceDate(badge.eventDate),x,1250);
  const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result ? resolve(result) : reject(new Error("No pudimos generar la imagen.")),"image/png"));
  return new File([blob],`root-insignia-${badge.eventId}.png`,{type:"image/png"});
}

export async function shareBadgeFile(file: File, title: string): Promise<"shared" | "unsupported" | "cancelled"> {
  if (Capacitor.isNativePlatform()) {
    if (!(await Share.canShare()).value) return "unsupported";
    const data = await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error("No pudimos preparar la imagen."));reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.readAsDataURL(file);});
    const path = `badge-shares/${crypto.randomUUID()}.png`;
    const saved = await Filesystem.writeFile({path,data,directory:Directory.Cache,recursive:true});
    try { await Share.share({title,files:[saved.uri],dialogTitle:"Compartir tu insignia"}); return "shared"; }
    finally { await Filesystem.deleteFile({path,directory:Directory.Cache}).catch(()=>undefined); }
  }
  if (!navigator.canShare?.({files:[file]}) || !navigator.share) return "unsupported";
  try { await navigator.share({title,files:[file]}); return "shared"; }
  catch (error) { if ((error as DOMException).name === "AbortError") return "cancelled"; throw error; }
}
export function downloadBadgeFile(file: File) {
  const url=URL.createObjectURL(file),link=document.createElement("a");link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
