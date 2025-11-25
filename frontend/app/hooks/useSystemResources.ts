/**
 * Hook para obter recursos do sistema (apenas no Electron)
 */

import { useState, useEffect, useCallback } from 'react';
import { useElectron } from '@/lib/electron';
import { SystemResources } from '@/types/electron';

export function useSystemResources() {
  const { isElectron, getSystemResources } = useElectron();
  const [resources, setResources] = useState<SystemResources | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    console.log('🔍 useSystemResources: fetchResources chamado', { isElectron, hasAPI: !!window.electronAPI?.getSystemResources });
    
    if (!isElectron) {
      console.log('⚠️ useSystemResources: Não está no Electron');
      setError('Apenas disponível no app desktop');
      return;
    }

    if (!window.electronAPI?.getSystemResources) {
      console.error('❌ useSystemResources: getSystemResources não está disponível no electronAPI');
      setError('API de recursos do sistema não disponível. Verifique se o app desktop está atualizado.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('📡 useSystemResources: Chamando getSystemResources...');
      const result = await getSystemResources();
      console.log('📋 useSystemResources: Resultado recebido:', result);
      
      if (result.success && result.data) {
        console.log('✅ useSystemResources: Recursos obtidos com sucesso:', result.data);
        setResources(result.data);
      } else {
        console.error('❌ useSystemResources: Erro na resposta:', result.error);
        setError(result.error || 'Erro ao obter recursos do sistema');
      }
    } catch (err: unknown) {
      console.error('❌ useSystemResources: Exceção capturada:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isElectron) {
      fetchResources();
    }
  }, [isElectron, fetchResources]);

  return {
    resources,
    loading,
    error,
    refresh: fetchResources,
    isElectron
  };
}

