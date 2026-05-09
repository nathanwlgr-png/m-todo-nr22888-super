import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SuperMasterHunterModal from '@/components/SuperMasterHunterModal';

export default function SuperMasterHunterButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        disabled
        onClick={() => setShowModal(true)}
        className="bg-slate-400 hover:bg-slate-400 gap-2 cursor-not-allowed opacity-50 shadow-lg shadow-slate-400/20"
      >
        <AlertTriangle className="w-5 h-5" />
        ⚠️ SUPER MASTER HUNTER (Desabilitado)
      </Button>

      {/* Modal desabilitada */}
      {/* <SuperMasterHunterModal isOpen={showModal} onClose={() => setShowModal(false)} /> */}
    </>
  );
}