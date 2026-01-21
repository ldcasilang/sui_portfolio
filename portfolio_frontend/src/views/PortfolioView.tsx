import React, { useEffect, useState } from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";

// FULL portfolio object ID from your transaction
const PORTFOLIO_OBJECT_ID = "0xaea8c28189494d599a65dd5f3d935d4009ac2cad50f96a5e1123ff7a0744585a";
const PACKAGE_ID = "0x1c9d4893b52e3673cbb1c568fe06743e40cfb70a876f6817870202a402ddc477";
const pollIntervalMs = 5_000;

const defaultPortfolioData = {
  name: "LADY DIANE BAUZON CASILANG",
  course: "BS in Information Technology",
  school: "FEU Institute of Technology",
  about:
    "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
  skills: [
    "Graphic Design",
    "UI / UX Design",
    "Project Management",
    "Full Stack Development",
    "Web & App Development",
  ],
  linkedin: "https://www.linkedin.com/in/ldcasilang/",
  github: "https://github.com/ldcasilang",
};

const PortfolioView: React.FC = () => {
  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData);
  const [lastTransactionDigest, setLastTransactionDigest] = useState<string>("");
  const [dataSource, setDataSource] = useState<"unknown" | "blockchain">("unknown");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // DIRECT QUERY: Fetch the portfolio object using the exact full object ID
  const {
    data: portfolioObject,
    refetch: refetchPortfolioObject,
    isFetching: isFetchingObject,
  } = useSuiClientQuery(
    "getObject",
    {
      id: PORTFOLIO_OBJECT_ID,
      options: { 
        showContent: true, 
        showType: true,
        showOwner: true,
        showPreviousTransaction: true,
        showStorageRebate: true,
        showDisplay: true,
        showBcs: false
      },
    },
    { 
      enabled: true,
      retry: 3,
      refetchInterval: pollIntervalMs
    }
  );

  // Apply blockchain data to UI
  useEffect(() => {
    console.log("Portfolio object query result:", portfolioObject);
    
    if (!portfolioObject) {
      console.log("No portfolio object data yet");
      return;
    }
    
    if (portfolioObject.error) {
      console.error("Error fetching portfolio:", portfolioObject.error);
      setError(`Error: ${portfolioObject.error.message}`);
      setIsLoading(false);
      return;
    }
    
    if (!portfolioObject.data) {
      console.log("No portfolio object data available");
      setError("No data received from blockchain");
      setIsLoading(false);
      return;
    }

    const content = portfolioObject.data.content;
    if (!content) {
      console.log("No content in portfolio object");
      setError("Portfolio object has no content");
      setIsLoading(false);
      return;
    }

    if (content.dataType !== "moveObject") {
      console.log("Content is not a move object:", content.dataType);
      setError(`Expected moveObject, got ${content.dataType}`);
      setIsLoading(false);
      return;
    }

    const fields = (content as any).fields;
    console.log("Portfolio object fields:", fields);

      document.title = `${fields.name || defaultPortfolioData.name} | Move Smart Contract Portfolio`;
    
    // Get transaction info
    if (portfolioObject.data.previousTransaction) {
      setLastTransactionDigest(portfolioObject.data.previousTransaction);
    }
    
    // Extract ALL possible field names from the Move object
    // Try multiple variations since field names might differ
    const blockchainData = {
      name: fields.name || fields.full_name || fields.student_name || fields.Name || defaultPortfolioData.name,
      course: fields.course || fields.degree || fields.program || fields.Course || defaultPortfolioData.course,
      school: fields.school || fields.university || fields.institution || fields.School || defaultPortfolioData.school,
      about: fields.about || fields.bio || fields.description || fields.About || fields.about_me || defaultPortfolioData.about,
      linkedin: fields.linkedin || fields.linkedin_url || fields.linkedin_link || fields.LinkedIn || defaultPortfolioData.linkedin,
      github: fields.github || fields.github_url || fields.github_link || fields.GitHub || defaultPortfolioData.github,
      skills: Array.isArray(fields.skills) ? fields.skills : 
             Array.isArray(fields.Skills) ? fields.Skills : 
             Array.isArray(fields.skill_list) ? fields.skill_list :
             defaultPortfolioData.skills,
    };
    
    console.log("Extracted blockchain data:", blockchainData);
    
    // Check if we actually got blockchain data (not just defaults)
    const hasBlockchainData = 
      blockchainData.name !== defaultPortfolioData.name ||
      blockchainData.course !== defaultPortfolioData.course ||
      blockchainData.school !== defaultPortfolioData.school ||
      blockchainData.about !== defaultPortfolioData.about ||
      blockchainData.skills !== defaultPortfolioData.skills;
    
    if (hasBlockchainData) {
      setPortfolioData(blockchainData);
      setDataSource("blockchain");
      setError(""); // Clear any previous errors
      console.log("✅ Successfully loaded blockchain data!");
    } else {
      console.log("Using default data - no blockchain data extracted");
      setError("Connected to blockchain but using default data (field names may not match)");
    }
    
    setIsLoading(false);
    
  }, [portfolioObject]);

  // Also search by type as backup (in case object was updated to new ID)
  const {
    data: objectsByType,
    refetch: refetchObjectsByType,
  } = useSuiClientQuery(
    "queryObjects",
    { 
      query: { 
        filter: { 
          StructType: `${PACKAGE_ID}::portfolio::Portfolio` 
        } 
      },
      options: { showContent: true, showType: true }
    },
    { 
      enabled: false, // We'll trigger this manually if direct fetch fails
      retry: 2 
    }
  );

  // If direct fetch has error, try type search
  useEffect(() => {
    if (error && error.includes("Error")) {
      console.log("Direct fetch failed, trying type search...");
      refetchObjectsByType();
    }
  }, [error, refetchObjectsByType]);

  // Handle type search results
  useEffect(() => {
    if (objectsByType?.data?.data && Array.isArray(objectsByType.data.data)) {
      const items = objectsByType.data.data;
      console.log(`Found ${items.length} portfolio objects by type search`);
      
      if (items.length > 0) {
        console.log("First portfolio object:", items[0]);
      }
    }
  }, [objectsByType]);

  // Poll for updates
  useEffect(() => {
    const refreshData = () => {
      console.log("Refreshing portfolio data...");
      refetchPortfolioObject();
    };

    // Initial refresh after a short delay
    const timeoutId = setTimeout(refreshData, 1000);
    
    // Set up polling
    const intervalId = setInterval(refreshData, pollIntervalMs);
    
    // Refresh when window gets focus
    window.addEventListener("focus", refreshData);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      window.removeEventListener("focus", refreshData);
    };
  }, [refetchPortfolioObject]);

  // Loading state
  useEffect(() => {
    setIsLoading(isFetchingObject);
  }, [isFetchingObject]);

  // Debug logging
  useEffect(() => {
    console.log("Current state:", {
      portfolioObjectId: PORTFOLIO_OBJECT_ID,
      isLoading,
      dataSource,
      error,
      hasPortfolioObject: !!portfolioObject,
      portfolioObject
    });
  }, [isLoading, dataSource, error, portfolioObject]);

  return (
    <div className="font-inter">
      {/* HERO SECTION - KEEPING YOUR EXACT UI */}
      <div className="hero-wrapper">
        <div className="hero">
          <div className="avatar">
            <img
              src="/profile.png"
              alt="Lady Diane Casilang"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/180x180?text=Profile";
              }}
            />
          </div>

          <div className="hero-content">
            <small>Hello! My name is</small>
            <h1 className="gradient-name">{portfolioData.name}</h1>
            <p>
              <span className="degree">{portfolioData.course}, {portfolioData.school}</span>
            </p>

            <div className="socials">
              <a href={portfolioData.linkedin} target="_blank" rel="noreferrer" className="social-btn">
                <i className="fa-brands fa-linkedin"></i> LinkedIn
              </a>
              <a href={portfolioData.github} target="_blank" rel="noreferrer" className="social-btn">
                <i className="fa-brands fa-github"></i> GitHub
              </a>
            </div>

            {/* <div className="mt-4 p-3 rounded-md">
              {dataSource === "blockchain" ? (
                <div className="text-xs text-emerald-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-semibold">✅ LIVE: On-chain Portfolio</span>
                  </div>
                  
                  {lastTransactionDigest && (
                    <div className="mb-1">
                      <span className="text-blue-200">Latest Update: </span>
                      <a
                        href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-300 hover:text-blue-200 font-mono text-xs"
                        title={lastTransactionDigest}
                      >
                        {lastTransactionDigest.slice(0, 10)}...{lastTransactionDigest.slice(-6)}
                      </a>
                    </div>
                  )}
                  
                  <div className="mb-1">
                    <span className="text-blue-200">Object ID: </span>
                    <code className="text-blue-100 font-mono text-xs" title={PORTFOLIO_OBJECT_ID}>
                      {PORTFOLIO_OBJECT_ID.slice(0, 10)}...{PORTFOLIO_OBJECT_ID.slice(-8)}
                    </code>
                  </div>
                  
                  <div className="text-green-300 text-xs">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-1"></span>
                    Auto-refreshing every 5 seconds
                  </div>
                </div>
              ) : isLoading ? (
                <div className="text-xs text-blue-300">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Loading on-chain portfolio...</span>
                  </div>
                  <div className="mt-1 text-blue-200 text-xs">
                    Fetching: <code className="text-xs">{PORTFOLIO_OBJECT_ID.slice(0, 10)}...</code>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span>Using default portfolio data</span>
                  </div>
                  {error && (
                    <div className="mt-1 text-xs text-yellow-500">
                      {error}
                    </div>
                  )}
                  <div className="mt-1 text-blue-200 text-xs">
                    Object ID: <code className="text-xs">{PORTFOLIO_OBJECT_ID.slice(0, 10)}...</code>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>

      {/* ABOUT + SKILLS SECTION */}
      <section className="solid-section">
        <h2 className="section-title">About Me</h2>
        <p>{portfolioData.about}</p>

        <h2 className="section-title">Skills</h2>
        <div className="skills">
          {portfolioData.skills.map((skill, idx) => (
            <div key={idx} className="skill">{skill}</div>
          ))}
        </div>
      </section>

      {/* TRANSACTION INFO SECTION */}
      {/* {lastTransactionDigest && (
        <section className="solid-section" style={{ backgroundColor: "rgba(15, 23, 42, 0.7)" }}>
          <h2 className="section-title">Latest Transaction</h2>
          <div className="transaction-info">
            <div className="transaction-detail">
              <span className="detail-label">Transaction ID:</span>
              <code className="detail-value" title={lastTransactionDigest}>
                {lastTransactionDigest.slice(0, 12)}...{lastTransactionDigest.slice(-8)}
              </code>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Status:</span>
              <span className="detail-value success">✅ Success</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">
                {dataSource === "blockchain" ? (
                  <span className="text-green-300">Blockchain (Live)</span>
                ) : (
                  "Unknown"
                )}
              </span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Object ID:</span>
              <code className="detail-value" title={PORTFOLIO_OBJECT_ID}>
                {PORTFOLIO_OBJECT_ID.slice(0, 12)}...{PORTFOLIO_OBJECT_ID.slice(-8)}
              </code>
            </div>
            <a
              href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-transaction-btn"
            >
              <i className="fa-solid fa-external-link-alt"></i> View on Sui Scan
            </a>
          </div>
        </section>
      )} */}

      {/* MOVE SMART CONTRACTS SECTION */}
      <div className="move-wrapper">
        <div className="move-card">
          <div className="move-title">
            <img src="/sui-logo.png" alt="Move Logo" className="move-logo" />
            <strong>Move Smart Contracts</strong>
          </div>

          <p>
            Move smart contracts are programs written in the Move language and deployed on blockchains like Sui, enabling secure asset management and high scalability. As a secure and efficient language designed for apps that scale, Move ushers in a new era of smart contract programming by offering significant advancements in security and productivity. Move drastically reduces the Web3 learning curve and enables a developer experience of unprecedented ease, serving as the foundation for Sui, a high-performance Layer 1 blockchain that utilizes an object-centric data model to achieve industry-leading transaction speeds.
          </p>

          <a href="https://www.sui.io/move" target="_blank" className="learn-more-btn" rel="noopener noreferrer">
            Learn More About Sui →
          </a>
        </div>
      </div>

      {/* FOOTER */}
      <div className="custom-footer">
        <div className="footer-container">
          <div className="footer-logo-section">
            <div className="footer-logos" style={{ display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
              <img src="/devcon.png" alt="DEVCON" className="logo-img" style={{ height: 30, objectFit: "contain" }} />
              <img src="/sui.png" alt="SUI" className="logo-img" style={{ height: 28, objectFit: "contain" }} />
            </div>
          </div>

          <div className="footer-info-section">
            <div className="info-box">
              <div className="info-label">PROJECT ID:</div>
              <div className="info-value" title={PACKAGE_ID}>
                {PACKAGE_ID.slice(0, 10)}...{PACKAGE_ID.slice(-8)}
              </div>
            </div>
            {/* <div className="info-box mt-2">
              <div className="info-label">PORTFOLIO OBJECT ID:</div>
              <div className="info-value" title={PORTFOLIO_OBJECT_ID}>
                {PORTFOLIO_OBJECT_ID.slice(0, 10)}...{PORTFOLIO_OBJECT_ID.slice(-8)}
              </div>
            </div> */}
            {/* {dataSource === "blockchain" && (
              <div className="mt-2 text-xs text-green-300 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Live blockchain data • Auto-refreshing every 5 seconds</span>
                </div>
              </div>
            )} */}
          </div>
        </div>
      </div>

      <style>{`
        .socials { display:flex; gap:1rem; margin-top:2rem; flex-wrap:wrap; }
        .social-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:12px; background:#0b4df0; color:#e6f6ff; text-decoration:none; border:1px solid #0b4df0; transition:0.3s; font-weight:500; cursor:pointer; font-family:inherit; font-size:14px; }
        .social-btn:hover { background:#0838c9; color:#fff; }
        .transaction-info { background: rgba(11,27,58,0.8); border-radius:12px; padding:20px; border:1px solid #1e40af; margin-top:15px; }
        .transaction-detail { margin-bottom:12px; display:flex; align-items:center; gap:10px; }
        .detail-label { color:#93c5fd; font-weight:600; min-width:120px; }
        .detail-value { color:white; font-family:monospace; background: rgba(0,0,0,0.3); padding:4px 8px; border-radius:6px; }
        .detail-value.success { color:#10b981; }
        .view-transaction-btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:10px; background:#0b4df0; color:white; text-decoration:none; font-weight:500; margin-top:10px; transition:0.3s; }
        .view-transaction-btn:hover { background:#0838c9; }
        .custom-footer { padding: 16px 20px; }
        .footer-container { display:flex; flex-direction: column; align-items: center; width:100%; gap: 16px; padding: 0; }
        .footer-logo-section { width: 100%; }
        .footer-logos { display:flex; justify-content: center; gap: 16px; align-items:center; margin-bottom: 8px; }
        .footer-logos img.logo-img { height: 28px; }
        .footer-info-section { width: 100%; display: flex; flex-direction: column; align-items: center; }
        .info-box { background: rgba(11, 27, 58, 0.9); border:1px solid #1e40af; border-radius:8px; padding:8px 12px; width: 100%; max-width: 600px; text-align:center; }
        .info-label { font-size:0.75rem; color:#93c5fd; font-weight:600; margin-bottom:4px; text-transform:uppercase; }
        .info-value { font-size:0.85rem; color:white; font-family:monospace; font-weight:500; overflow-wrap: break-word; word-wrap: break-word; word-break: break-all; }
        .footer-text { text-align:center; font-size:0.8rem; color:rgba(255,255,255,0.7); line-height:1.3; margin-top: 8px; width: 100%; max-width: 600px; }
        .loading { color:#93c5fd; animation:pulse 1.5s infinite; }
        .mt-2 { margin-top: 0.5rem; }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        @media (min-width: 768px) {
          .footer-container { flex-direction: row; align-items: center; justify-content: space-between; }
          .footer-logo-section { width: auto; }
          .footer-info-section { width: auto; align-items: flex-end; }
          .info-box { width: 400px; }
          .footer-text { text-align: right; max-width: 400px; }
          .footer-logos { justify-content: flex-start; margin-bottom: 0; }
        }
        @media (max-width: 767px) { 
          .socials { justify-content:center; } 
          .transaction-detail { flex-direction:column; align-items:flex-start; gap:5px; }
        }
      `}</style>
    </div>
  );
};

export default PortfolioView;