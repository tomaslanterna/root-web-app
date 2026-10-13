"use client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "./useMutation";
import { createBadgeCard, downloadBadgeFile, shareBadgeFile } from "@/services/badgeSharing";
import type { EventBadge } from "@/types/badges";

export function useBadgeShare(badge?: EventBadge) {
  const [file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null),[open,setOpen]=useState(false),[message,setMessage]=useState("");
  const current = useRef(badge),previewUrl=useRef<string|null>(null);
  useEffect(()=>{current.current=badge;},[badge]);
  useEffect(()=>()=>{if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);},[]);
  const generate=useMutation(createBadgeCard),sharing=useMutation((input:{file:File;title:string})=>shareBadgeFile(input.file,input.title));
  const prepare=async()=>{
    if(!badge || generate.isLoading)return;setOpen(true);setFile(null);setPreview(null);setMessage("");
    if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);
    try{const result=await generate.mutate(badge);if(current.current?.eventId===badge.eventId){setFile(result);const url=URL.createObjectURL(result);previewUrl.current=url;setPreview(url);}}catch{/* Error displayed in dialog. */}
  };
  const share=async()=>{if(!file || !badge)return;setMessage("");try{const result=await sharing.mutate({file,title:badge.title});if(result==="unsupported")setMessage("Este dispositivo no permite compartir el archivo directamente. Podés descargarlo.");if(result==="shared")setOpen(false);}catch{setMessage("No pudimos abrir el menú de compartir. Podés descargar la imagen.");}};
  return {open,close:()=>setOpen(false),prepare:()=>void prepare(),share:()=>void share(),download:()=>file && downloadBadgeFile(file),preview,file,isPreparing:generate.isLoading,isSharing:sharing.isLoading,error:generate.error,message};
}
