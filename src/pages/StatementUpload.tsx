import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { readBinaryFile } from '@tauri-apps/api/fs';
import { StatementData } from '../types/statement';
import { useNavigate } from 'react-router-dom';

export default function StatementUpload() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(false);
      
      // Open file dialog with both PDF and CSV support
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Statement Files',
          extensions: ['pdf', 'csv']
        }]
      });

      if (!selected) {
        console.log('No file selected');
        return;
      }

      const filePath = selected as string;
      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('Please log in to upload statements');
      }

      // Process the statement using file path
      console.log('Processing statement...');
      const result = await invoke<{ success: boolean; data?: StatementData; error?: string }>('process_statement', {
        filePath
      });

      console.log('Process result:', result);

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to process statement');
      }

      // Store the statement data
      console.log('Storing statement data...', {
        userId,
        filePath,
        startDate: result.data.summary.start_date,
        endDate: result.data.summary.end_date,
        transactionCount: result.data.transactions.length
      });

      const storeResult = await invoke<{ success: boolean; error?: string }>('store_statement_data', {
        userId,
        filePath,
        startDate: result.data.summary.start_date,
        endDate: result.data.summary.end_date,
        transactions: result.data.transactions
      });

      if (!storeResult.success) {
        throw new Error(storeResult.error || 'Failed to store statement data');
      }

      setSuccess(true);
      console.log('Statement upload completed successfully');
      
      // Navigate to dashboard after successful upload
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process statement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Upload Bank Statement</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div 
          className={`flex flex-col items-center p-8 border-2 border-dashed rounded-lg transition-all
            ${dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrag}
        >
          {isLoading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Processing your statement...</p>
            </div>
          ) : (
            <>
              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3 3m0 0l-3-3m3 3V8" />
              </svg>
              <button
                onClick={handleFileSelect}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose File or Drag & Drop
              </button>
              <p className="mt-2 text-sm text-gray-500">Supported formats: PDF, CSV</p>
              <div className="mt-4 text-sm text-gray-600">
                <p>CSV file should have the following columns:</p>
                <ul className="list-disc list-inside mt-1">
                  <li>Posting Date (DD/MM/YYYY)</li>
                  <li>Transaction Date</li>
                  <li>Description</li>
                  <li>Money In</li>
                  <li>Money Out</li>
                  <li>Balance</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
            </svg>
            Statement uploaded successfully!
          </div>
        )}
      </div>
    </div>
  );
}