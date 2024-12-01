import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Transaction } from '../types/statement';
import { Calendar } from 'lucide-react';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const formatDateForBackend = (dateStr: string) => {
    // Convert from YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchTransactions = async (start?: string, end?: string) => {
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?.id;
    
    if (!userId) {
      setError('Please log in to view transactions');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching transactions with dates:', { start, end });
      const response = await invoke<{ success: boolean; data?: Transaction[]; error?: string }>('get_user_transactions', {
        userId,
        startDate: start,
        endDate: end
      });

      console.log('Response from backend:', response);

      if (response.success && response.data) {
        // Sort transactions by date in descending order (most recent first)
        const sortedTransactions = [...response.data].sort((a, b) => {
          // Extract just the date part for comparison (first 10 characters)
          const aDate = new Date(a.transaction_date.substring(0, 10));
          const bDate = new Date(b.transaction_date.substring(0, 10));
          return bDate.getTime() - aDate.getTime();
        });
        console.log('Sorted transactions:', sortedTransactions);
        setTransactions(sortedTransactions);
      } else if (response.error) {
        throw new Error(response.error);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDateFilter = () => {
    console.log('Applying date filter with dates:', { startDate, endDate });
    fetchTransactions(startDate, endDate);
  };

  const clearDateFilter = () => {
    console.log('Clearing date filter');
    setStartDate('');
    setEndDate('');
    fetchTransactions();
  };

  const formatDate = (dateStr: string) => {
    try {
      if (dateStr.includes('-')) {
        const date = new Date(dateStr);
        return date.toLocaleDateString();
      }
      const [day, month, year] = dateStr.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error parsing date:', dateStr, e);
      return 'Invalid Date';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const totalIncome = transactions
    .filter(t => t.money_in !== null && t.money_in > 0)
    .reduce((sum, t) => sum + (t.money_in || 0), 0);

  const totalExpenses = transactions
    .filter(t => t.money_out !== null && t.money_out !== 0)
    .reduce((sum, t) => sum + Math.abs(t.money_out || 0), 0);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Financial Dashboard</h1>
      
      {/* Date Filter */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-44"
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDateFilter}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!startDate && !endDate}
            >
              Apply Filter
            </button>
            <button
              onClick={clearDateFilter}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Current Balance</h3>
            <p className={`text-2xl ${transactions[0]?.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R{transactions[0]?.balance.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Income</h3>
            <p className="text-2xl text-green-600">
              R{totalIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
            <p className="text-2xl text-red-600">
              R{totalExpenses.toFixed(2)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">Net Balance</h3>
            <p className={`text-2xl ${totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R{(totalIncome - totalExpenses).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.category || 'Uncategorized'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${
                      transaction.money_in ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R{transaction.money_in ? 
                          transaction.money_in.toFixed(2) : 
                          transaction.money_out ? 
                            transaction.money_out.toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}