import React, { useEffect, useRef, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast, ToastId } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PACKAGE_ID = "0x1c9d4893b52e3673cbb1c568fe06743e40cfb70a876f6817870202a402ddc477";
const OWNER_ADDRESS = "0x967ebe2164e054b4954b3c75892ecef4666f5c271bd6b0436ee17c7f60fe422c";

// KNOWN PORTFOLIO OBJECT ID (from your transaction - you should update this with the full ID)
const KNOWN_PORTFOLIO_OBJECT_ID = "0xaea8c28189494d599a65dd5f3d935d4009ac2cad50f96a5e1123ff7a0744585a";

const RETRY_COUNT = 8;
const RETRY_DELAY_MS = 1200;
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const formatDigest = (digest: string) =>
  digest ? `${digest.slice(0, 12)}...${digest.slice(-8)}` : "No transactions yet";

const AdminView: React.FC = () => {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [portfolioObjectId, setPortfolioObjectId] = useState<string>("");
  const [transactionDigest, setTransactionDigest] = useState<string>("");
  const [transactionSource, setTransactionSource] = useState<"blockchain" | "local">("local");
  const [hasExistingPortfolio, setHasExistingPortfolio] = useState<boolean>(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState<boolean>(true);
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);
  const [firstLoadComplete, setFirstLoadComplete] = useState<boolean>(false);
  const [manualPortfolioId, setManualPortfolioId] = useState<string>("");

  // Query to get portfolio object if we have its ID
  const { data: portfolioObject, refetch: refetchPortfolio } = useSuiClientQuery(
    "getObject",
    { id: portfolioObjectId, options: { showContent: true, showType: true } },
    { enabled: !!portfolioObjectId && portfolioObjectId.startsWith("0x"), retry: 2 }
  );

  // Query to search for objects by type (for shared objects)
  const { data: objectsByType, refetch: searchByType } = useSuiClientQuery(
    "queryObjects",
    { 
      query: { 
        filter: { 
          StructType: `${PACKAGE_ID}::portfolio::Portfolio` 
        } 
      },
      options: { showContent: true, showType: true }
    },
    { enabled: false, retry: 2 }
  );

  const [formData, setFormData] = useState({
    name: "LADY DIANE BAUZON CASILANG",
    course: "BS in Information Technology",
    school: "FEU Institute of Technology",
    about: "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
    linkedin: "https://www.linkedin.com/in/ldcasilang/",
    github: "https://github.com/ldcasilang",
    skills: ["Graphic Design", "UI/UX Design", "Project Management", "Full Stack Development", "Web Development"],
  });

  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  // Toast ids so we dismiss only the specific toast
  const waitingToastRef = useRef<ToastId | null>(null);
  const successToastRef = useRef<ToastId | null>(null);

  const applyFields = (fields: any) => {
    if (!fields) return false;
    setFormData((prev) => ({
      ...prev,
      name: fields.name ?? prev.name,
      course: fields.course ?? prev.course,
      school: fields.school ?? prev.school,
      about: fields.about ?? prev.about,
      linkedin: fields.linkedin_url ?? fields.linkedin ?? prev.linkedin,
      github: fields.github_url ?? fields.github ?? prev.github,
      skills: fields.skills ?? prev.skills,
    }));
    return true;
  };

  // UPDATED: Portfolio search function that handles shared objects
  const findAndSetPortfolio = async () => {
    if (searchAttempted && !firstLoadComplete) return;
    
    setIsLoadingPortfolio(true);
    if (!firstLoadComplete) setSearchAttempted(true);
    
    console.log("🔍 Searching for portfolio...");
    console.log("Using package ID:", PACKAGE_ID);
    console.log("Looking for type:", `${PACKAGE_ID}::portfolio::Portfolio`);
    
    // Try multiple search strategies
    let found = false;
    
    // STRATEGY 1: Try to load from localStorage first
    const storedPortfolioId = localStorage.getItem('portfolio_object_id');
    if (storedPortfolioId && storedPortfolioId.startsWith('0x')) {
      console.log("Found portfolio ID in localStorage:", storedPortfolioId);
      try {
        setPortfolioObjectId(storedPortfolioId);
        await refetchPortfolio();
        setHasExistingPortfolio(true);
        found = true;
        console.log("✅ Portfolio found via localStorage");
      } catch (err) {
        console.error("Error loading stored portfolio:", err);
      }
    }
    
    // STRATEGY 2: Search by type (for shared objects)
    if (!found) {
      try {
        console.log("Trying to search by type...");
        const typeSearchResult = await searchByType();
        
        if (typeSearchResult?.data?.data && Array.isArray(typeSearchResult.data.data)) {
          const items = typeSearchResult.data.data;
          console.log(`📊 Found ${items.length} objects by type search`);
          
          for (const item of items) {
            try {
              const objData = item?.data || item;
              const type = objData?.type;
              const objectId = objData?.objectId;
              
              console.log("Checking object:", { objectId, type });
              
              if (type && type.includes("portfolio::Portfolio") && objectId) {
                console.log("✅ FOUND PORTFOLIO (by type)! Object ID:", objectId);
                console.log("Object type:", type);
                console.log("Object owner:", objData?.owner);
                
                // Store in localStorage for future use
                localStorage.setItem('portfolio_object_id', objectId);
                
                setPortfolioObjectId(objectId);
                setHasExistingPortfolio(true);
                
                // Apply fields if we have them
                const fields = objData?.content?.fields;
                if (fields) {
                  console.log("Applying portfolio fields:", fields);
                  applyFields(fields);
                }
                
                found = true;
                break;
              }
            } catch (itemErr) {
              console.error("Error processing item:", itemErr);
            }
          }
        }
      } catch (err) {
        console.error("Error in type search:", err);
        // If queryObjects fails, try the next strategy
      }
    }
    
    // STRATEGY 3: Check known portfolio ID
    if (!found && KNOWN_PORTFOLIO_OBJECT_ID && KNOWN_PORTFOLIO_OBJECT_ID.includes("0x")) {
      console.log("Checking known portfolio ID:", KNOWN_PORTFOLIO_OBJECT_ID);
      try {
        setPortfolioObjectId(KNOWN_PORTFOLIO_OBJECT_ID);
        const knownRes: any = await refetchPortfolio?.();
        if (knownRes?.data) {
          console.log("✅ Found portfolio using known ID!");
          localStorage.setItem('portfolio_object_id', KNOWN_PORTFOLIO_OBJECT_ID);
          setHasExistingPortfolio(true);
          
          const content = knownRes.data?.content;
          if (content?.fields) {
            console.log("Applying portfolio fields:", content.fields);
            applyFields(content.fields);
          }
          
          found = true;
        }
      } catch (knownErr) {
        console.error("Error checking known ID:", knownErr);
      }
    }
    
    // STRATEGY 4: Fallback to owned objects search (legacy)
    if (!found) {
      console.log("No portfolio found by type/known ID, trying owned objects...");
      try {
        // Quick owned objects check as fallback
        const ownedRes = await fetch(
          `https://fullnode.testnet.sui.io:443`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'suix_getOwnedObjects',
              params: [OWNER_ADDRESS, {
                filter: { StructType: `${PACKAGE_ID}::portfolio::Portfolio` },
                options: { showContent: true, showType: true, showOwner: true }
              }]
            })
          }
        );
        
        const ownedData = await ownedRes.json();
        if (ownedData?.result?.data) {
          const items = ownedData.result.data;
          for (const item of items) {
            const objData = item?.data;
            if (objData?.type?.includes("portfolio::Portfolio") && objData?.objectId) {
              console.log("✅ Found portfolio in owned objects!");
              localStorage.setItem('portfolio_object_id', objData.objectId);
              setPortfolioObjectId(objData.objectId);
              setHasExistingPortfolio(true);
              if (objData.content?.fields) {
                applyFields(objData.content.fields);
              }
              found = true;
              break;
            }
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback search error:", fallbackErr);
      }
    }
    
    if (!found) {
      console.log("❌ No portfolio found using any search method");
      setHasExistingPortfolio(false);
    } else {
      console.log("✅ Portfolio search complete - portfolio found!");
    }
    
    setIsLoadingPortfolio(false);
    if (!firstLoadComplete) setFirstLoadComplete(true);
  };

  // Auto-search for portfolio on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Try to find portfolio immediately
    findAndSetPortfolio();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Apply portfolio data when portfolioObject updates
  useEffect(() => {
    if (!portfolioObject) return;
    
    try {
      console.log("Portfolio object updated:", portfolioObject);
      const content = portfolioObject?.data?.content || portfolioObject?.content;
      if (content?.fields) {
        console.log("Applying fields from portfolio object:", content.fields);
        applyFields(content.fields);
        setHasExistingPortfolio(true);
      }
    } catch (err) {
      console.error("Error applying portfolio fields:", err);
    }
  }, [portfolioObject]);

  // Show creation prompt if no portfolio found
  useEffect(() => {
    if (firstLoadComplete && !hasExistingPortfolio && account && mountedRef.current) {
      // Wait 3 seconds after page load to show prompt
      const timer = setTimeout(() => {
        toast.info(
          <div className="p-4">
            <div className="font-bold text-blue-100 text-lg mb-2">🚀 First-Time Setup Required</div>
            <div className="text-blue-200 mb-3">
              No portfolio found on-chain. Click the <strong>"Create Portfolio"</strong> button below to initialize your portfolio.
            </div>
            <div className="text-sm text-blue-300">
              This will create a permanent portfolio object on the Sui blockchain.
            </div>
          </div>,
          { 
            autoClose: 15000,
            closeButton: true 
          }
        );
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [firstLoadComplete, hasExistingPortfolio, account]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };
  
  const handleSkillChange = (i: number, v: string) => {
    const s = [...formData.skills];
    s[i] = v;
    setFormData((p) => ({ ...p, skills: s }));
  };
  
  const addSkill = () => {
    if (formData.skills.length < 5) setFormData((p) => ({ ...p, skills: [...p.skills, ""] }));
  };

  // Extract object ID from transaction result
  const extractObjectIdFromResult = (result: any): string | null => {
    try {
      // Check events first
      const events = result?.effects?.events || result?.events || [];
      for (const ev of events) {
        if (ev?.parsedJson?.object_id) return ev.parsedJson.object_id;
        if (ev?.parsedJson?.fields?.object_id) return ev.parsedJson.fields.object_id;
      }

      // Check created objects
      const created = result?.effects?.created || result?.effects?.createdObjects || [];
      for (const obj of created) {
        const cand = obj?.reference?.objectId || obj?.objectId || obj?.object_id || obj?.id;
        if (cand && String(cand).startsWith("0x")) return cand;
      }

      // Check object changes
      if (Array.isArray(result?.objectChanges)) {
        for (const ch of result.objectChanges) {
          if (ch?.type === "created") {
            const cand = ch.objectId || ch.object_id || ch?.object?.objectId;
            if (cand && String(cand).startsWith("0x")) return cand;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  // Create waiting toast
  const createWaitingToast = () => {
    const id = toast.info(
      <div style={{ position: "relative", padding: 14, maxWidth: 560, minHeight: 88 }}>
        <button
          aria-label="close"
          onClick={() => {
            if (waitingToastRef.current) {
              toast.dismiss(waitingToastRef.current);
              waitingToastRef.current = null;
            }
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "transparent",
            border: "none",
            color: "#e6f6ff",
            fontSize: 18,
            cursor: "pointer",
            padding: 6,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#0b4df0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                border: "3px solid #fff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>

          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 16, marginBottom: 6 }}>
              Waiting for wallet approval
            </div>
            <div style={{ color: "#90caf9", fontSize: 14, maxWidth: 420 }}>
              Check your wallet to approve the transaction
            </div>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>,
      { autoClose: false, closeButton: false }
    );
    waitingToastRef.current = id;
    return id;
  };

  // Create success toast
  const createSuccessToast = (txDigest: string, isCreate: boolean) => {
    const id = toast.success(
      <div style={{ position: "relative", padding: 14, maxWidth: 560, minHeight: 88 }}>
        <button
          aria-label="close"
          onClick={() => {
            if (successToastRef.current) {
              toast.dismiss(successToastRef.current);
              successToastRef.current = null;
            }
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "transparent",
            border: "none",
            color: "#e6f6ff",
            fontSize: 18,
            cursor: "pointer",
            padding: 6,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 16, marginBottom: 6 }}>
            {isCreate ? "🎉 Portfolio Created Successfully!" : "✅ Portfolio Updated Successfully!"}
          </div>
          <div style={{ color: "#90caf9", fontSize: 14, wordBreak: "break-all", marginBottom: 10 }}>
            {txDigest}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(txDigest);
                toast.info("Transaction ID copied");
              }}
              className="px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded-md text-white"
            >
              Copy
            </button>
            <a
              href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-md text-white"
            >
              View on Sui
            </a>
          </div>
        </div>
      </div>,
      { autoClose: false, closeButton: false }
    );
    successToastRef.current = id;
    return id;
  };

  // Main save function
  const saveToBlockchain = async () => {
    if (!account) {
      toast.error("Please connect wallet first");
      return;
    }
    if (formData.skills.length !== 5 || formData.skills.some((s) => s.trim() === "")) {
      toast.error("Please enter exactly 5 skills");
      return;
    }

    setIsSaving(true);
    const tx = new Transaction();
    const isCreate = !hasExistingPortfolio || !portfolioObjectId;
    
    console.log("💾 Saving portfolio. Mode:", isCreate ? "CREATE" : "UPDATE", "Object ID:", portfolioObjectId);
    
    try {
      if (!isCreate && portfolioObjectId) {
        // UPDATE existing portfolio
        console.log("🔄 Calling update function");
        tx.moveCall({
          target: `${PACKAGE_ID}::portfolio::update`,
          arguments: [
            tx.object(portfolioObjectId),
            tx.pure.string(formData.name),
            tx.pure.string(formData.course),
            tx.pure.string(formData.school),
            tx.pure.string(formData.about),
            tx.pure.string(formData.linkedin),
            tx.pure.string(formData.github),
            tx.pure.vector("string", formData.skills),
          ],
        });
      } else {
        // CREATE new portfolio (first time)
        console.log("🆕 Calling create function");
        tx.moveCall({
          target: `${PACKAGE_ID}::portfolio::create`,
          arguments: [
            tx.pure.string(formData.name),
            tx.pure.string(formData.course),
            tx.pure.string(formData.school),
            tx.pure.string(formData.about),
            tx.pure.string(formData.linkedin),
            tx.pure.string(formData.github),
            tx.pure.vector("string", formData.skills),
          ],
        });
      }

      createWaitingToast();

      const result: any = await signAndExecute({
        transaction: tx,
        options: { showEffects: true, showEvents: true, gasBudget: 100000000 },
      });

      if (waitingToastRef.current) {
        toast.dismiss(waitingToastRef.current);
        waitingToastRef.current = null;
      }

      console.log("📦 Transaction result:", result);

      if (!result) throw new Error("No response from wallet");
      
      const possibleError = result.error || result?.effects?.status?.error;
      if (possibleError) {
        throw new Error(typeof possibleError === "string" ? possibleError : JSON.stringify(possibleError));
      }

      const txDigest = result.digest || result.txDigest;
      if (!txDigest) throw new Error("Transaction failed - no digest returned");

      const foundObjectId = extractObjectIdFromResult(result);
      
      setTransactionDigest(txDigest);
      setTransactionSource("blockchain");

      if (foundObjectId) {
        console.log("📌 Found new object ID:", foundObjectId);
        
        // Store in localStorage for future sessions
        localStorage.setItem('portfolio_object_id', foundObjectId);
        
        setPortfolioObjectId(foundObjectId);
        setHasExistingPortfolio(true);
        
        // Refresh portfolio data
        await refetchPortfolio?.();
        
        // Wait a moment and refresh search
        setTimeout(() => {
          findAndSetPortfolio();
        }, 1000);
      } else {
        console.log("⚠️ No object ID found in result, but transaction succeeded");
      }

      createSuccessToast(txDigest, isCreate);

      if (isCreate) {
        toast.info(
          <div className="p-3">
            <div className="font-bold text-green-100 mb-2">🎉 Portfolio Initialized!</div>
            <div className="text-green-200">
              Your portfolio is now on-chain! The object ID has been saved for future sessions.
            </div>
          </div>,
          { autoClose: 5000 }
        );
      }

    } catch (err: any) {
      if (waitingToastRef.current) {
        toast.dismiss(waitingToastRef.current);
        waitingToastRef.current = null;
      }
      
      console.error("❌ Transaction error:", err);
      const message = err?.message || String(err) || "Transaction failed";
      
      // Handle specific errors
      if (message.includes("FunctionNotFound")) {
        toast.error(
          <div className="p-3">
            <div className="font-bold text-red-100 mb-2">Function Not Found</div>
            <div className="text-red-200">
              Tried to call: <code className="text-sm">{PACKAGE_ID}::portfolio::create</code><br/>
              or: <code className="text-sm">{PACKAGE_ID}::portfolio::update</code><br/>
              Check your Move function names.
            </div>
          </div>
        );
      } else if (message.includes("Incorrect number of arguments")) {
        toast.error(
          <div className="p-3">
            <div className="font-bold text-red-100 mb-2">Argument Count Error</div>
            <div className="text-red-200">
              Check if your Move function expects 7 or 8 arguments.<br/>
              Update your React code to match.
            </div>
          </div>
        );
      } else if (/rejected|denied/i.test(message)) {
        toast.error("Transaction rejected by wallet");
      } else if (/insufficient/i.test(message)) {
        toast.error("Insufficient gas balance");
      } else {
        toast.error(`Transaction failed: ${message.slice(0, 100)}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Manual refresh button handler
  const handleManualRefresh = () => {
    setSearchAttempted(false);
    setIsLoadingPortfolio(true);
    findAndSetPortfolio();
  };

  // Handle manual portfolio ID entry
  const handleManualIdSubmit = () => {
    if (manualPortfolioId.startsWith("0x")) {
      setPortfolioObjectId(manualPortfolioId);
      setHasExistingPortfolio(true);
      localStorage.setItem('portfolio_object_id', manualPortfolioId);
      toast.success("Manual portfolio ID set!");
      setManualPortfolioId("");
    } else {
      toast.error("Please enter a valid object ID starting with 0x");
    }
  };

  // Clear stored portfolio ID
  const handleClearStorage = () => {
    localStorage.removeItem('portfolio_object_id');
    setPortfolioObjectId("");
    setHasExistingPortfolio(false);
    toast.info("Stored portfolio ID cleared. Please search again.");
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 shadow-2xl border border-gray-800">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            Portfolio Editor
          </h1>
          <p className="text-blue-200">Edit your portfolio and save it to the blockchain</p>
        </div>

       

        {/* Latest Transaction card */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-blue-300 mb-3">Latest Transaction</h2>
          <div className="p-4 rounded-lg border border-blue-800 bg-blue-900/10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="min-w-[140px] text-sm text-blue-200 font-semibold">Transaction ID:</div>
                <div className="flex-1">
                  {transactionDigest ? (
                    <div className="inline-flex items-center gap-3">
                      <code className="px-3 py-1 bg-[#071127] text-blue-200 rounded-md font-mono break-all">
                        {formatDigest(transactionDigest)}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(transactionDigest);
                          toast.info("Transaction ID copied");
                        }}
                        className="px-2 py-1 bg-blue-700 hover:bg-blue-600 rounded-md text-white text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400">No transactions yet</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="min-w-[140px] text-sm text-blue-200 font-semibold">Status:</div>
                <div>
                  {transactionDigest ? (
                    <span className="inline-flex items-center gap-2 bg-[#061223] px-3 py-1 rounded-md text-sm">
                      <span className="w-3 h-3 rounded-full bg-green-500" /> 
                      <span className="text-green-200">Success</span>
                    </span>
                  ) : (
                    <span className="text-gray-400">No transaction yet</span>
                  )}
                </div>
              </div>

              {/* <div className="flex items-center gap-4">
                <div className="min-w-[140px] text-sm text-blue-200 font-semibold">Data Source:</div>
                <div>
                  <span className="px-3 py-1 bg-[#071127] rounded-md text-sm text-blue-200 capitalize">
                    {transactionSource}
                  </span>
                </div>
              </div> */}

              {transactionDigest && (
                <div className="pt-2">
                  <a
                    href={`https://suiscan.xyz/testnet/tx/${transactionDigest}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 rounded-md text-white font-semibold"
                  >
                    View on Sui Scan
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-300 mb-2">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-blue-300 mb-2">Course/Degree</label>
              <input
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-blue-300 mb-2">School/University</label>
            <input
              name="school"
              value={formData.school}
              onChange={handleChange}
              className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-blue-300 mb-2">About Me</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none min-h-[120px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-300 mb-2">LinkedIn URL</label>
              <input
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-blue-300 mb-2">GitHub URL</label>
              <input
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-blue-300">Skills ({formData.skills.length}/5 required)</label>
              {formData.skills.length < 5 && (
                <button 
                  type="button" 
                  onClick={addSkill} 
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
                >
                  + Add Skill
                </button>
              )}
            </div>

            {formData.skills.map((skill, i) => (
              <div key={i} className="mb-2">
                <input
                  value={skill}
                  onChange={(e) => handleSkillChange(i, e.target.value)}
                  className="w-full p-3 bg-sui-dark border border-gray-700 rounded-lg text-blue-100 placeholder-blue-200 focus:border-blue-500 focus:outline-none"
                  placeholder={`Skill ${i + 1}`}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={saveToBlockchain}
                disabled={!account || isSaving || formData.skills.length !== 5}
                className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all ${
                  !account || isSaving || formData.skills.length !== 5
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : hasExistingPortfolio
                    ? "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl hover:shadow-2xl"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl"
                }`}
              >
                {isSaving 
                  ? "Processing..." 
                  : !account 
                  ? "🔗 Connect Wallet to Save"
                  : formData.skills.length !== 5
                  ? `Enter ${5 - formData.skills.length} more skills`
                  : hasExistingPortfolio
                  ? "Update Portfolio on Blockchain"
                  : "Create Portfolio (First Time)"}
              </button>
              
              <div className="text-sm text-blue-300 text-center max-w-lg">
                {hasExistingPortfolio ? (
                  <div>
                    <span className="text-green-300 font-semibold">✓ Portfolio exists on-chain</span>
                    <div className="text-xs mt-1 text-blue-200">
                      Changes will update the existing object:{" "}
                      <code className="text-xs">{portfolioObjectId?.slice(0, 8)}...{portfolioObjectId?.slice(-6)}</code>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-yellow-300 font-semibold">⚠️ No portfolio found</span>
                    <div className="text-xs mt-1 text-blue-200">
                      This will create a new portfolio object on the blockchain. This only needs to be done once.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminView;