import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface User {
  id: string;
  username: string;
  created_at: string;
}

interface Statement {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Transaction {
  posting_date: string;
  transaction_date: string;
  description: string;
  amount: number;
  balance: number;
  transaction_type: string;
}

export default function Admin() {
  const [users, setUsers] = useState<User[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await invoke<{ success: boolean; data: User[]; error?: string }>('list_users');
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        console.error('Failed to load users:', response.error);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadStatements = async (userId: string) => {
    try {
      setSelectedUser(userId);
      const response = await invoke<{ success: boolean; data: Statement[]; error?: string }>('get_user_statements', { userId });
      if (response.success && response.data) {
        setStatements(response.data);
      } else {
        console.error('Failed to load statements:', response.error);
      }
      setSelectedStatement(null);
      setTransactions([]);
    } catch (error) {
      console.error('Failed to load statements:', error);
    }
  };

  const loadTransactions = async (statementId: string) => {
    try {
      setSelectedStatement(statementId);
      const response = await invoke<{ success: boolean; data: Transaction[]; error?: string }>('get_statement_transactions', { statementId });
      if (response.success && response.data) {
        setTransactions(response.data);
      } else {
        console.error('Failed to load transactions:', response.error);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-8">
        {/* Users List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="space-y-2">
            {users.map(user => (
              <div
                key={user.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedUser === user.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => loadStatements(user.id)}
              >
                <div className="font-medium">{user.username}</div>
                <div className="text-sm text-gray-500">Created: {new Date(user.created_at).toLocaleDateString()}</div>
                <div className="text-xs text-gray-400">ID: {user.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Statements List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Statements</h2>
          <div className="space-y-2">
            {statements.map(statement => (
              <div
                key={statement.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedStatement === statement.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => loadTransactions(statement.id)}
              >
                <div className="font-medium">
                  {statement.start_date} to {statement.end_date}
                </div>
                <div className="text-sm text-gray-500">
                  Uploaded: {new Date(statement.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-400">ID: {statement.id}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transactions</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {transactions.map((transaction, index) => (
              <div key={index} className="p-3 border rounded">
                <div className="font-medium">{transaction.description}</div>
                <div className="text-sm">
                  <span className="text-gray-500">Posted: {transaction.posting_date}</span>
                  <span className="mx-2">|</span>
                  {transaction.money_in ? (
                    <span className="text-green-600">+R {transaction.money_in.toFixed(2)}</span>
                  ) : transaction.money_out ? (
                    <span className="text-red-600">-R {transaction.money_out.toFixed(2)}</span>
                  ) : null}
                </div>
                <div className="text-sm text-gray-500">
                  Balance: R {transaction.balance.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Database Debug Section */}
      <div className="mt-8 bg-gray-800 text-white p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Database Debug Information</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Selected User</h3>
            <pre className="bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(users.find(u => u.id === selectedUser), null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Selected Statement</h3>
            <pre className="bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(statements.find(s => s.id === selectedStatement), null, 2)}
            </pre>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Transactions</h3>
            <pre className="bg-gray-900 p-4 rounded overflow-auto">
              {JSON.stringify(transactions, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 