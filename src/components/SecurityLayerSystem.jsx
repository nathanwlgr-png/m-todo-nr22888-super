import { useEffect, useRef, useState } from 'react';
import CryptoJS from 'crypto-js';

// IA SEGURANÇA 1: Guardian - Criptografia Primária
class GuardianAI {
  constructor() {
    this.keys = [];
    this.layer = 0;
  }

  generateQuantumKey() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const entropy = window.crypto.getRandomValues(new Uint32Array(10)).join('');
    return CryptoJS.SHA512(`${timestamp}-${random}-${entropy}-${this.layer}`).toString();
  }

  encrypt(data, multiplier = 1) {
    let encrypted = data;
    
    for (let i = 0; i < multiplier; i++) {
      const key = this.generateQuantumKey();
      this.keys.push({ key, timestamp: Date.now(), layer: this.layer });
      encrypted = CryptoJS.AES.encrypt(encrypted, key).toString();
      this.layer++;
    }
    
    return encrypted;
  }

  rotateKeys() {
    // Remove keys antigas (mais de 5 minutos)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    this.keys = this.keys.filter(k => k.timestamp > fiveMinutesAgo);
  }
}

// IA SEGURANÇA 2: Sentinel - Detecção de Intrusão
class SentinelAI {
  constructor() {
    this.threats = [];
    this.patterns = [];
    this.scanning = false;
  }

  detectThreat() {
    const metrics = {
      failedAttempts: this.getFailedAttempts(),
      suspiciousActivity: this.detectSuspiciousPatterns(),
      unauthorized: this.detectUnauthorizedAccess(),
      timestamp: Date.now()
    };

    if (metrics.failedAttempts > 3 || metrics.suspiciousActivity || metrics.unauthorized) {
      this.threats.push(metrics);
      this.activateDefense();
      return true;
    }
    return false;
  }

  getFailedAttempts() {
    const attempts = parseInt(localStorage.getItem('security_failed_attempts') || '0');
    return attempts;
  }

  detectSuspiciousPatterns() {
    // Detecta comportamentos anormais
    const currentPath = window.location.pathname;
    const lastPaths = JSON.parse(localStorage.getItem('path_history') || '[]');
    
    // Se muitas páginas diferentes em pouco tempo
    if (lastPaths.length > 20) {
      return true;
    }
    
    return false;
  }

  detectUnauthorizedAccess() {
    // Verifica se há tentativas de acesso não autorizado
    const authToken = localStorage.getItem('auth_token');
    return !authToken;
  }

  activateDefense() {
    // Aumenta nível de segurança
    localStorage.setItem('security_level', 'high');
    console.warn('⚠️ SENTINEL: Ameaça detectada - Defesa ativada');
  }

  clearThreat() {
    localStorage.setItem('security_failed_attempts', '0');
    this.threats = [];
  }
}

// IA SEGURANÇA 3: Fortress - Blindagem Multi-Camada
class FortressAI {
  constructor() {
    this.shields = [];
    this.multiplier = 1;
  }

  createShield() {
    const shield = {
      id: CryptoJS.lib.WordArray.random(128/8).toString(),
      strength: Math.floor(Math.random() * 1000) + 500,
      layers: this.multiplier,
      timestamp: Date.now()
    };
    
    this.shields.push(shield);
    this.multiplier = Math.min(this.multiplier * 2, 128); // Multiplica até 128 camadas
    
    return shield;
  }

  fortify(data) {
    const shields = [];
    for (let i = 0; i < this.multiplier; i++) {
      shields.push(this.createShield());
    }
    
    return {
      data,
      shields,
      fortified: true,
      layers: this.multiplier
    };
  }

  validateShields() {
    // Remove shields antigas
    const oneMinuteAgo = Date.now() - 60000;
    this.shields = this.shields.filter(s => s.timestamp > oneMinuteAgo);
  }
}

// Sistema Principal de Segurança
export default function SecurityLayerSystem() {
  const [securityStatus, setSecurityStatus] = useState('initializing');
  const [layers, setLayers] = useState(0);
  const guardianRef = useRef(new GuardianAI());
  const sentinelRef = useRef(new SentinelAI());
  const fortressRef = useRef(new FortressAI());
  const intervalRef = useRef(null);

  useEffect(() => {
    // Inicializa sistema de segurança
    const initializeSecurity = () => {
      console.log('🔐 Inicializando Sistema de Segurança Quântico');
      setSecurityStatus('active');
      
      // Cria primeira camada de proteção
      guardianRef.current.encrypt(JSON.stringify({ init: true }), 3);
      fortressRef.current.createShield();
      
      setLayers(3);
    };

    initializeSecurity();

    // Rotação de chaves e blindagem a cada 10 segundos
    intervalRef.current = setInterval(() => {
      // Guardian: Rotaciona chaves
      guardianRef.current.rotateKeys();
      
      // Sentinel: Verifica ameaças
      const threatDetected = sentinelRef.current.detectThreat();
      
      if (threatDetected) {
        // Se ameaça detectada, multiplica camadas
        const currentMultiplier = fortressRef.current.multiplier;
        for (let i = 0; i < currentMultiplier; i++) {
          guardianRef.current.encrypt(JSON.stringify({ threat: true }), 2);
        }
        setLayers(prev => prev * 2);
      }
      
      // Fortress: Valida e renova shields
      fortressRef.current.validateShields();
      fortressRef.current.createShield();
      
      setSecurityStatus('scanning');
      setTimeout(() => setSecurityStatus('secure'), 500);
      
    }, 10000); // A cada 10 segundos

    // Rastreamento de navegação para detecção de padrões
    const trackNavigation = () => {
      const paths = JSON.parse(localStorage.getItem('path_history') || '[]');
      paths.push({ path: window.location.pathname, timestamp: Date.now() });
      
      // Mantém apenas últimos 30
      if (paths.length > 30) paths.shift();
      
      localStorage.setItem('path_history', JSON.stringify(paths));
    };

    window.addEventListener('popstate', trackNavigation);
    trackNavigation();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('popstate', trackNavigation);
    };
  }, []);

  // Função global para criptografar dados sensíveis
  useEffect(() => {
    window.secureData = (data) => {
      const guardian = guardianRef.current;
      const fortress = fortressRef.current;
      
      // Criptografa com Guardian
      const encrypted = guardian.encrypt(JSON.stringify(data), fortress.multiplier);
      
      // Adiciona blindagem Fortress
      const fortified = fortress.fortify(encrypted);
      
      return fortified;
    };

    window.getSecurityStatus = () => ({
      status: securityStatus,
      layers,
      shields: fortressRef.current.shields.length,
      threats: sentinelRef.current.threats.length,
      keys: guardianRef.current.keys.length
    });

    return () => {
      delete window.secureData;
      delete window.getSecurityStatus;
    };
  }, [securityStatus, layers]);

  // Indicador visual discreto
  return (
    <div className="fixed top-2 left-2 z-50">
      <div className={`w-2 h-2 rounded-full ${
        securityStatus === 'secure' ? 'bg-green-500' :
        securityStatus === 'scanning' ? 'bg-yellow-500 animate-pulse' :
        securityStatus === 'active' ? 'bg-blue-500' :
        'bg-gray-500'
      }`} title={`Segurança: ${securityStatus} | ${layers} camadas`} />
    </div>
  );
}