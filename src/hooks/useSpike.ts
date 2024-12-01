import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Transaction, StatementSummary, StatementData } from '../types/statement';

interface CommandResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useSpike = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statementData, setStatementData] = useState<StatementData | null>(null);

  const processStatement = async (pdfFile: File): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      const response = await invoke<CommandResponse<StatementData>>('process_statement', {
        pdfContent: base64String,
        fileName: pdfFile.name,
      });

      if (response.success && response.data) {
        setStatementData(response.data);
      } else {
        throw new Error(response.error || 'Failed to process statement');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process statement');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    statementData,
    processStatement,
  };
};