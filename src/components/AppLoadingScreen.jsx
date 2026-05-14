import * as React from 'react';
const { useEffect, useState } = React;

export default function AppLoadingScreen() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
          <span className="text-5xl font-bold text-white">S</span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2">SEAMATY</h1>
          <p className="text-indigo-200 text-lg">CRM Veterinário Premium</p>
        </div>

        {/* Loading spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-900/30" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-indigo-400 animate-spin" />
        </div>

        {/* Status text */}
        <p className="text-indigo-200 text-lg min-w-[200px] text-center">
          Carregando{dots}
        </p>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-8 text-center text-indigo-400 text-sm">
        <p>Otimizado para Samsung Galaxy Tab S11</p>
      </div>
    </div>
  );
}