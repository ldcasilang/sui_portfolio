import React, { useEffect, useRef, useState } from "react";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { toast } from "react-toastify";

/**
 * PortfolioView - chain-first with owner discovery + polling + focus refetch
 *
 * Guarantees:
 * - Periodically (every pollIntervalMs) re-checks the owner's objects (getOwnedObjects)
 *   and re-fetches the portfolio object (getObject) if found or if lastTransactionDigest changes.
 * - Also refetches when window/tab gains focus for near-instant updates when users return.
 * - OWNER_ADDRESS must be the account that owns / published the portfolio Move object.
 *
 * Set OWNER_ADDRESS to the publisher's address to guarantee other visitors see updates.
 */

const OWNER_ADDRESS = "0x967ebe2164e054b4954b3c75892ecef4666f5c271bd6b0436ee17c7f60fe422c"; // <-- set owner/publisher address
const pollIntervalMs = 10_000; // 10s polling interval (safe and responsive)

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
  const account = useCurrentAccount();

  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData);
  const [projectId] = useState(
    "0x1c9d4893b52e3673cbb1c568fe06743e40cfb70a876f6817870202a402ddc477"
  );

  // identifiers / source state
  const [portfolioObjectId, setPortfolioObjectId] = useState<string>("");
  const [lastTransactionDigest, setLastTransactionDigest] = useState<string>(
    localStorage.getItem("lastTransactionDigest") || ""
  );
  const [dataSource, setDataSource] = useState<"unknown" | "blockchain">("unknown");
  const [isLoading, setIsLoading] = useState(false);

  // Refs for stable functions
  const isMountedRef = useRef(true);

  // 1) Query owned objects for OWNER_ADDRESS (disabled auto-run; we'll trigger refetch manually)
  const {
    data: ownedObjects,
    refetch: refetchOwnedObjects,
    isFetching: isFetchingOwnedObjects,
  } = useSuiClientQuery(
    "getOwnedObjects",
    { owner: OWNER_ADDRESS },
    { enabled: false, retry: 1 }
  );

  // 2) Query transaction block when we have a digest (AdminView saves this digest)
  const {
    data: txBlockData,
    refetch: refetchTxBlock,
    isFetching: isFetchingTxBlock,
  } = useSuiClientQuery(
    "getTransactionBlock",
    {
      digest: lastTransactionDigest,
      options: { showEffects: true, showEvents: true, showObjectChanges: true },
    },
    { enabled: !!lastTransactionDigest, retry: 1 }
  );

  // 3) Query the object content when we have an object id
  const {
    data: portfolioObject,
    refetch: refetchPortfolioObject,
    isFetching: isFetchingObject,
  } = useSuiClientQuery(
    "getObject",
    {
      id: portfolioObjectId,
      options: { showContent: true, showType: true, showOwner: true },
    },
    { enabled: !!portfolioObjectId && portfolioObjectId.startsWith("0x"), retry: 2 }
  );

  // Helper to try to extract portfolio object id from various SDK shapes
  const extractObjectIdFromOwned = (items: any): string | null => {
    if (!items) return null;
    const arr = Array.isArray(items) ? items : items?.data || items?.objects || items?.result || [];
    if (!Array.isArray(arr)) return null;
    for (const it of arr) {
      const type = it?.type || it?.data?.type || it?.object?.type || it?.result?.type;
      const objectId =
        it?.objectId ||
        it?.object_id ||
        it?.reference?.objectId ||
        it?.object?.objectId ||
        it?.id;
      if (type && String(type).includes("portfolio::Portfolio")) {
        return objectId || it?.object?.reference?.objectId || it?.reference?.objectId || it?.objectId;
      }
    }
    return null;
  };

  // Parse transaction block for object id (events/effects/objectChanges)
  const extractObjectIdFromTxBlock = (tx: any): string | null => {
    if (!tx) return null;
    try {
      const events = tx?.effects?.events || tx?.events || [];
      for (const ev of events) {
        if (ev?.parsedJson && typeof ev.parsedJson === "object") {
          if (ev.parsedJson?.object_id) return ev.parsedJson.object_id;
          if (ev.parsedJson?.fields?.object_id) return ev.parsedJson.fields.object_id;
        } else if (ev?.bcs && typeof ev.bcs === "string") {
          try {
            const parsed = JSON.parse(ev.bcs);
            if (parsed?.object_id) return parsed.object_id;
          } catch {}
        } else if (ev?.object_id) {
          return ev.object_id;
        }
      }

      const created = tx?.effects?.created || tx?.effects?.createdObjects || [];
      for (const obj of created) {
        const cand =
          obj?.reference?.objectId || obj?.objectId || obj?.object_id || obj?.id || obj?.object?.objectId;
        if (cand && String(cand).startsWith("0x")) return cand;
      }

      if (Array.isArray(tx?.objectChanges)) {
        for (const ch of tx.objectChanges) {
          if (ch?.type === "created" || ch?.type === "mutated" || ch?.type === "published") {
            const cand = ch.objectId || ch.object_id || ch?.object?.objectId || ch?.objectId;
            if (cand && String(cand).startsWith("0x")) return cand;
          }
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    return null;
  };

  // Apply on-chain object fields to UI
  useEffect(() => {
    if (!portfolioObject) return;

    try {
      const content = portfolioObject?.data?.content;
      if (content && content?.dataType === "moveObject") {
        const fields = (content as any).fields || {};
        const blockchainData = {
          name: fields.name || defaultPortfolioData.name,
          course: fields.course || defaultPortfolioData.course,
          school: fields.school || defaultPortfolioData.school,
          about: fields.about || defaultPortfolioData.about,
          linkedin: fields.linkedin_url || fields.linkedin || defaultPortfolioData.linkedin,
          github: fields.github_url || fields.github || defaultPortfolioData.github,
          skills: fields.skills || defaultPortfolioData.skills,
        };
        setPortfolioData(blockchainData);
        setDataSource("blockchain");

        // sync lastTransactionDigest from localStorage (AdminView writes this)
        const savedDigest = localStorage.getItem("lastTransactionDigest");
        if (savedDigest) setLastTransactionDigest(savedDigest);
      } else if (portfolioObject?.error) {
        console.warn("Error fetching blockchain object:", portfolioObject.error);
      }
    } catch (e) {
      console.error("Error applying on-chain portfolio to UI:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioObject]);

  // When ownedObjects result changes, try to extract portfolio object id
  useEffect(() => {
    if (!ownedObjects) return;
    try {
      const candidate = extractObjectIdFromOwned(ownedObjects?.data || ownedObjects);
      if (candidate) {
        if (candidate !== portfolioObjectId) {
          setPortfolioObjectId(candidate);
          setDataSource("blockchain");
          setTimeout(() => refetchPortfolioObject?.(), 50);
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedObjects]);

  // When txBlockData arrives, try to extract object id and fetch object
  useEffect(() => {
    if (!txBlockData) return;
    try {
      const candidate = extractObjectIdFromTxBlock(txBlockData);
      if (candidate) {
        if (candidate !== portfolioObjectId) {
          setPortfolioObjectId(candidate);
          setDataSource("blockchain");
          setTimeout(() => refetchPortfolioObject?.(), 50);
        }
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txBlockData]);

  // Polling + focus refetch: periodically refetch ownedObjects, object, and txBlock
  useEffect(() => {
    isMountedRef.current = true;

    const doRefetch = () => {
      try {
        refetchOwnedObjects?.().catch((e) => console.warn("ownedObjects:", e));
        if (portfolioObjectId) refetchPortfolioObject?.().catch((e) => console.warn("getObject:", e));
        if (lastTransactionDigest) refetchTxBlock?.().catch((e) => console.warn("txBlock:", e));
      } catch (e) {
        console.warn("Periodic refetch failed:", e);
      }
    };

    // immediate fetch on mount
    doRefetch();

    // interval
    const id = setInterval(() => {
      if (!isMountedRef.current) return;
      doRefetch();
    }, pollIntervalMs);

    // focus refetch
    const onFocus = () => {
      doRefetch();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      isMountedRef.current = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioObjectId, lastTransactionDigest]);

  // If AdminView updates the digest in localStorage (same domain), we can detect it via a storage event
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "lastTransactionDigest") {
        if (e.newValue && e.newValue !== lastTransactionDigest) {
          setLastTransactionDigest(e.newValue);
        }
      }
      if (e.key === "portfolioObjectId") {
        if (e.newValue && e.newValue !== portfolioObjectId) {
          setPortfolioObjectId(e.newValue);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastTransactionDigest, portfolioObjectId]);

  // Show a small UI indicator for loading if desired
  useEffect(() => {
    setIsLoading(isFetchingOwnedObjects || isFetchingObject || isFetchingTxBlock);
  }, [isFetchingOwnedObjects, isFetchingObject, isFetchingTxBlock]);

  return (
    <div className="font-inter">
      {/* HERO SECTION */}
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

            <div className="mt-4 p-3 rounded-md">
              {dataSource === "blockchain" && lastTransactionDigest ? (
                <div className="text-xs text-emerald-200">
                  Latest on-chain update:{" "}
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${lastTransactionDigest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-200"
                  >
                    {lastTransactionDigest.slice(0, 10)}...{lastTransactionDigest.slice(-6)}
                  </a>
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  {isLoading ? "Checking chain for latest portfolio..." : "Portfolio shown from on-chain data when available"}
                </div>
              )}
            </div>
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
              <code className="detail-value">{`${lastTransactionDigest.slice(0, 12)}...${lastTransactionDigest.slice(-8)}`}</code>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Status:</span>
              <span className="detail-value success">✅ Success</span>
            </div>
            <div className="transaction-detail">
              <span className="detail-label">Data Source:</span>
              <span className="detail-value">{dataSource === "blockchain" ? "Blockchain" : "Unknown"}</span>
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

      {/* FOOTER: logos preserved */}
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
              <div className="info-value" title={projectId}>
                {projectId}
              </div>
            </div>
            
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