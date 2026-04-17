'use client';

import { useState, useEffect } from 'react';
import { Bell, X, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSalonStore } from '@/lib/store';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

const SISTEMA_VERSION = '1.0.0';
const SISTEMA_VERSION_DATE = '17/04/2026';

interface SistemaConfig {
  versao: string;
  versaoData: string;
  changelog: string[];
  ativo: boolean;
}

export default function VersionBanner() {
  const { tenant } = useSalonStore();
  const [showBanner, setShowBanner] = useState(false);
  const [config, setConfig] = useState<SistemaConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVersion = async () => {
      if (!tenant) {
        setLoading(false);
        return;
      }

      try {
        const db = getFirebaseDb();
        const configRef = doc(db, 'saloes', tenant.id, 'config', 'sistema');
        const configSnap = await getDoc(configRef);

        if (configSnap.exists()) {
          const data = configSnap.data() as SistemaConfig;
          setConfig(data);

          // Verificar se a versão no Firebase é diferente da versão atual
          if (data.ativo && data.versao !== SISTEMA_VERSION) {
            // Verificar se o banner já foi fechado
            const dismissedVersion = localStorage.getItem('dismissedVersionBanner');
            if (dismissedVersion !== data.versao) {
              setShowBanner(true);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao verificar versão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVersion();
  }, [tenant]);

  const dismissBanner = () => {
    if (config) {
      localStorage.setItem('dismissedVersionBanner', config.versao);
    }
    setShowBanner(false);
  };

  if (loading || !tenant || !showBanner || !config) {
    return null;
  }

  const versaoAtual = config.versao;
  const temNovidades = config.changelog && config.changelog.length > 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">
                🆕 Nova versão disponível: {versaoAtual}
              </p>
              {temNovidades && (
                <div className="text-xs text-white/80 mt-0.5">
                  <span className="font-medium">Novidades:</span>{' '}
                  {config.changelog.slice(0, 3).join(' • ')}
                  {config.changelog.length > 3 && ` (+${config.changelog.length - 3} mais)`}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {temNovidades && (
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 h-7 px-3 text-xs"
                onClick={() => {
                  alert(`📋 Novidades da versão ${versaoAtual}:\n\n${config.changelog.map((item, i) => `${i + 1}. ${item}`).join('\n')}`);
                }}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver detalhes
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 h-7 w-7 p-0"
              onClick={dismissBanner}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SISTEMA_VERSION, SISTEMA_VERSION_DATE };
