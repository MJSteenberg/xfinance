import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const Settings: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  const checkApiStatus = async () => {
    setIsChecking(true);
    try {
      const status = await invoke<string>('get_api_status');
      setApiStatus(status);
    } catch (error) {
      setApiStatus(`Error: ${error}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-black">Settings</h2>

      {/* Add API Status Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4 text-black">API Status</h3>
        <div className="flex items-center space-x-4">
          <button 
            onClick={checkApiStatus}
            disabled={isChecking}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isChecking ? 'Checking...' : 'Check API Status'}
          </button>
          {apiStatus && (
            <span className={`text-sm ${
              apiStatus.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}>
              {apiStatus}
            </span>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-black">Personal Information</h3>
        <form>
          <div className="mb-4">
            <label htmlFor="name" className="block text-black font-semibold mb-2">Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-black font-semibold mb-2">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="currency" className="block text-black font-semibold mb-2">Preferred Currency</label>
            <select 
              id="currency" 
              name="currency" 
              className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="ZAR">ZAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Save Changes
          </button>
        </form>
      </div>
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-black">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input type="checkbox" id="email-notifications" className="mr-2" />
            <label htmlFor="email-notifications" className="text-black">Receive email notifications</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="push-notifications" className="mr-2" />
            <label htmlFor="push-notifications" className="text-black">Receive push notifications</label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="weekly-summary" className="mr-2" />
            <label htmlFor="weekly-summary" className="text-black">Receive weekly summary</label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
