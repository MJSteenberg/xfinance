import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Settings, FileUp, LogOut, Database, Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-blue-600 text-white"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-10
        w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600">XFinance</h1>
          {user && (
            <p className="mt-2 text-sm text-gray-600">
              Welcome, {user.username}
            </p>
          )}
        </div>
        <nav className="mt-8">
          <Link 
            to="/" 
            className="flex items-center px-4 py-2 text-black hover:bg-blue-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Home className="mr-3" size={20} />
            Dashboard
          </Link>
          <Link 
            to="/settings" 
            className="flex items-center px-4 py-2 text-black hover:bg-blue-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Settings className="mr-3" size={20} />
            Settings
          </Link>
          <Link 
            to="/upload" 
            className="flex items-center px-4 py-2 text-black hover:bg-blue-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <FileUp className="mr-3" size={20} />
            Upload Statement
          </Link>
          <Link 
            to="/admin" 
            className="flex items-center px-4 py-2 text-black hover:bg-blue-100 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <Database className="mr-3" size={20} />
            Database Admin
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-4">
          <button 
            onClick={handleLogout}
            type="button" 
            className="flex items-center w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
          >
            <LogOut className="mr-3" size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 w-full lg:ml-0 mt-16 lg:mt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;