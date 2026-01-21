import React, { useEffect } from "react";
import { useCurrentAccount, ConnectButton, useSuiClientQuery } from "@mysten/dapp-kit";
import { ToastContainer } from "react-toastify";
import PortfolioView from "./views/PortfolioView";
import AdminView from "./views/AdminView";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import PasswordProtection from "./components/PasswordProtection";
import "react-toastify/dist/ReactToastify.css";

// Inline toast filter function (defensive)
const toastClassName = (context: any): string => {
  try {
    const children = context?.toastProps?.children;
    if (!children) return "";

    let message = "";
    if (typeof children === "string") {
      message = children;
    } else if (Array.isArray(children)) {
      message = children.map((c) => (typeof c === "string" ? c : JSON.stringify(c))).join(" ");
    } else {
      message = String(children);
    }

    const lowerMessage = message.toLowerCase();
    const walletKeywords = ["wallet", "connect", "disconnect", "failed", "error", "no wallet", "extension"];
    if (walletKeywords.some((keyword) => lowerMessage.includes(keyword))) {
      return "wallet-toast-hidden";
    }
  } catch (e) {
    // fail silently — don't block toasts
    console.warn("toastClassName filter failed:", e);
  }
  return "";
};

// Main Layout Component (keeps your original header/footer and wallet banner)
const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const account = useCurrentAccount();
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch SUI balance quietly
  const { data: balanceData } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address as string },
    {
      enabled: !!account,
      retry: 0,
      onError: (error: any) => {
        console.log("Balance fetch failed:", error?.message ?? error);
      },
    }
  );

  const getSuiBalance = () => {
    try {
      const total = balanceData?.totalBalance ?? balanceData?.total_balance ?? 0;
      const numeric = Number(total);
      if (Number.isNaN(numeric)) return "0.00";
      return (numeric / 1_000_000_000).toFixed(2);
    } catch {
      return "0.00";
    }
  };

  const handleBackToPortfolio = () => navigate("/");

  return (
    <div className="min-h-screen bg-sui-dark text-white font-inter">
      <ToastContainer
        position="top-right"
        theme="dark"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={1}
        toastClassName={toastClassName}
        toastStyle={{
          background: "linear-gradient(180deg, rgba(11,27,58,0.95), rgba(6,10,30,0.95))",
          color: "#e6f6ff",
          border: "1px solid rgba(79,70,229,0.12)",
          borderRadius: 12,
          boxShadow: "0 6px 20px rgba(2,6,23,0.6)",
        }}
      />

      <header className="bg-slate-900 border-b border-gray-800 py-4 px-6">
        <div className="max-w-[1100px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/sui-logo.png" alt="Sui Logo" className="w-10 h-10 rounded-lg" />
            <h1 className="text-2xl font-bold bg-name-gradient bg-clip-text text-transparent">Move Smart Contract Portfolio</h1>
          </div>

          <div className="flex items-center gap-4">
            {location.pathname === "/cms-admin" && (
              <button
                onClick={handleBackToPortfolio}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-gray-700 to-gray-800 text-white font-semibold hover:from-gray-800 hover:to-gray-700 transition-all"
              >
                ← Back to Portfolio
              </button>
            )}

            {location.pathname === "/cms-admin" && (
              <ConnectButton
                connectText="Connect Wallet"
                className="!bg-gradient-to-r !from-sui-blue !to-blue-700 !text-white !font-semibold !rounded-xl !px-5 !py-3 hover:!from-blue-700 hover:!to-sui-blue transition-all"
              />
            )}
          </div>
        </div>
      </header>

      {/* Wallet Status Banner - Only show on admin page when connected */}
      {account && window.location.pathname === "/cms-admin" && (
        <div className="bg-green-900/20 border-l-4 border-green-500 p-3">
          <div className="max-w-[1100px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-green-400">Wallet Connected</p>
                  <span className="text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-300">Balance:</span>
                    <span className="font-bold text-white">{getSuiBalance()} SUI</span>
                  </div>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-300">Ready to edit your portfolio</div>
          </div>
        </div>
      )}

      <main id="top">{children}</main>

      <footer className="bg-slate-900 border-t border-gray-800 py-8">
        <div className="max-w-[1100px] mx-auto px-4 text-center text-gray-400">
          <p>Portfolio project published during <strong>Move Smart Contracts Code Camp</strong></p>
          <p className="mt-2">by DEVCON Philippines & SUI Foundation</p>
        </div>
      </footer>
    </div>
  );
};

function App() {
  // Lightweight console.error filter for noisy wallet logs (optional)
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      try {
        const message = args.map((a) => String(a)).join(" ");
        if (/wallet|connect|dapp-kit|no wallet/i.test(message)) {
          console.log("[Suppressed console.error]:", message);
          return;
        }
      } catch {
        // ignore
      }
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout><PortfolioView /></MainLayout>} />
        <Route path="/cms-admin" element={
          <PasswordProtection password="Movecodecampexercise!">
            <MainLayout><AdminView /></MainLayout>
          </PasswordProtection>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;