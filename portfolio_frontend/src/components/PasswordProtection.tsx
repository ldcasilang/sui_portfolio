import { useState, useEffect } from 'react';

interface PasswordProtectionProps {
  children: React.ReactNode;
  password: string;
}

const PasswordProtection = ({ children, password }: PasswordProtectionProps) => {
  const [inputPassword, setInputPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Check if already authenticated
  useEffect(() => {
    const storedAuth = localStorage.getItem('portfolio_admin_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputPassword === password) {
      setIsAuthenticated(true);
      localStorage.setItem('portfolio_admin_auth', 'true');
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setInputPassword('');
    }
  };

  const handleCancel = () => {
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sui-dark flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          {/* Blur background */}
          <div className="absolute inset-0 bg-sui-dark/50 backdrop-blur-lg -z-10"></div>
          
          {/* Password modal */}
          <div className="bg-slate-900 border-2 border-gray-800 rounded-2xl p-8 w-full shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-sui-blue to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-2xl text-white"></i>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
              <p className="text-gray-400">Enter password to access portfolio editor</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Password</label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                  placeholder="Enter admin password"
                  autoFocus
                />
                {error && (
                  <p className="text-red-400 text-sm mt-2">{error}</p>
                )}
              </div>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gradient-to-r from-sui-blue to-blue-700 hover:from-blue-700 hover:to-sui-blue text-white rounded-xl font-medium transition-all"
                >
                  Unlock Editor
                </button>
              </div>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-800">
              <p className="text-sm text-gray-500 text-center">
                ℹ️ This is a protected area. Only authorized users can access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PasswordProtection;