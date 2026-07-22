import React, { useRef } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import useSalesCapture from '@/hooks/useSalesCapture';
import SalesCaptureCard from '@/components/voice/SalesCaptureCard';

export default function SalesCaptureButton() {
  const inputRef = useRef(null);
  const capture = useSalesCapture();
  return <div className="space-y-2">
    <input ref={inputRef} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(event) => { capture.analyze(event.target.files?.[0]); event.target.value = ''; }} />
    <button onClick={() => inputRef.current?.click()} disabled={capture.loading} className="flex w-full items-center justify-center gap-2 rounded-xl border border-sky-500/40 bg-sky-500/10 p-3 text-sm font-bold text-sky-300 disabled:opacity-50">
      {capture.loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}{capture.loading ? 'Gemini lendo a captura...' : 'Fotografar ou filmar tela'}
    </button>
    <p className="text-center text-[11px] text-slate-500">Use foto nítida ou vídeo curto. Nada é cadastrado sem você aceitar.</p>
    {capture.error && <p className="text-xs text-rose-300">{capture.error}</p>}
    {capture.draft && <SalesCaptureCard result={capture.draft} loading={capture.loading} onApprove={capture.approve} onDiscard={capture.discard} />}
  </div>;
}