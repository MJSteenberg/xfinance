import React from 'react';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg shadow-blue-500/10 p-4 flex items-center">
        <div className="rounded-full bg-green-100 p-3 mr-4">
          <DollarSign className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-black">Total Balance</p>
          <p className="text-2xl font-semibold text-black">R12,750</p>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg shadow-blue-500/10 p-4 flex items-center">
        <div className="rounded-full bg-blue-100 p-3 mr-4">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-black">Income</p>
          <p className="text-2xl font-semibold text-black">R5,240</p>
        </div>
      </div>
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg shadow-blue-500/10 p-4 flex items-center">
        <div className="rounded-full bg-red-100 p-3 mr-4">
          <TrendingDown className="h-6 w-6 text-red-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-black">Expenses</p>
          <p className="text-2xl font-semibold text-black">R3,890</p>
        </div>
      </div>
    </div>
  );
};

export default Header;

