import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SuperMasterHunterModal from '@/components/SuperMasterHunterModal';

export default function SuperMasterHunterButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="bg-red-600 hover:bg-red-700 gap-2 animate-pulse shadow-lg shadow-red-600/50"
      >
        <AlertTriangle className="w-5 h-5" />
        ⚠️ SUPER MASTER HUNTER
      </Button>

      <SuperMasterHunterModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}