import React, { useEffect, useRef, useState } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { toast, ToastId } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * AdminView - final tweaks
 *
 * Fixes:
 * - Error toast uses a compact custom layout with an "X" top-right that dismisses only that toast.
 * - Error message is sanitized to remove error codes / digits / parenthesized codes.
 * - Waiting and success toasts keep the same top-right X and blue-only typography.
 * - On mount and after tx, the admin form fields are populated from on-chain object (retries).
 */

const PACKAGE_ID =
  "0x1c9d4893b52e3673cbb1c568fe06743e40cfb70a876f6817870202a402ddc477";

const OWNER_ADDRESS = "0x967ebe2164e054b4954b3c75892ecef4666f5c271bd6b0436ee17c7f60fe422c";

const RETRY_COUNT = 8;
const RETRY_DELAY_MS = 1200;
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const formatDigest = (digest: string) =>
  digest ? `${digest.slice(0, 12)}...${digest.slice(-8)}` : "No transactions yet";

const AdminView: React.FC = () => {
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const [portfolioObjectId, setPortfolioObjectId] = useState<string>(
    localStorage.getItem("portfolioObjectId") || ""
  );
  const [transactionDigest, setTransactionDigest] = useState<string>(
    localStorage.getItem("lastTransactionDigest") || ""
  );
  const [transactionSource, setTransactionSource] = useState<"blockchain" | "local">(
    transactionDigest ? "blockchain" : "local"
  );

  const { data: portfolioObject, refetch: refetchPortfolio } = useSuiClientQuery(
    "getObject",
    { id: portfolioObjectId, options: { showContent: true, showType: true } },
    { enabled: !!portfolioObjectId && portfolioObjectId.startsWith("0x"), retry: 2 }
  );

  const { data: ownedObjects, refetch: refetchOwnedObjects } = useSuiClientQuery(
    "getOwnedObjects",
    { owner: OWNER_ADDRESS },
    { enabled: false, retry: 1 }
  );

  const [formData, setFormData] = useState({
    name: "LADY DIANE BAUZON CASILANG",
    course: "BS in Information Technology",
    school: "FEU Institute of Technology",
    about:
      "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
    linkedin: "https://www.linkedin.com/in/ldcasilang/",
    github: "https://github.com/ldcasilang",
    skills: ["Graphic Design", "UI/UX Design", "Project Management", "Full Stack Development", "Web Development"],
  });

  const [isSaving, setIsSaving] = useState(false);
  const mountedRef = useRef(true);

  // toast ids for specific dismissal
  const waitingToastRef = useRef<ToastId | null>(null);
  const successToastRef = useRef<ToastId | null>(null);
  const errorToastRef = useRef<ToastId | null>(null);

  // Apply fields helper
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

  // Robust fetch & apply object
  const fetchAndApplyObject = async (objectId: string | undefined) => {
    if (!objectId) return false;
    setPortfolioObjectId(objectId);

    for (let i = 0; i < RETRY_COUNT && mountedRef.current; i++) {
      try {
        const res: any = await refetchPortfolio?.();
        const content = res?.data?.content || res?.content || res?.data || null;
        const fields = content?.fields || null;
        if (fields && applyFields(fields)) return true;
      } catch {
        // ignore and retry
      }
      await sleep(RETRY_DELAY_MS);
    }

    // fallback owner discovery
    try {
      await refetchOwnedObjects?.();
    } catch {}

    // last attempt
    try {
      const res2: any = await refetchPortfolio?.();
      const content2 = res2?.data?.content || res2?.content || res2?.data || null;
      const fields2 = content2?.fields || null;
      if (fields2 && applyFields(fields2)) return true;
    } catch {}

    return false;
  };

  // When getObject returns, apply if present
  useEffect(() => {
    if (!portfolioObject) return;
    try {
      const content = portfolioObject?.data?.content || portfolioObject?.content || null;
      const fields = content?.fields || (content && content.data ? content.data.fields : null);
      applyFields(fields);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioObject]);

  // On mount: fetch stored object or discover by owner
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      if (portfolioObjectId) {
        await fetchAndApplyObject(portfolioObjectId);
      } else {
        try {
          const owned: any = await refetchOwnedObjects?.();
          const items = Array.isArray(owned?.data) ? owned.data : owned?.data?.data || owned?.data?.objects || owned?.data || [];
          if (Array.isArray(items)) {
            for (const it of items) {
              const type = it?.type || it?.data?.type || it?.object?.type;
              const objectId = it?.objectId || it?.object_id || it?.reference?.objectId || it?.id;
              if (type && String(type).includes("portfolio::Portfolio") && objectId) {
                try {
                  localStorage.setItem("portfolioObjectId", objectId);
                } catch {}
                await fetchAndApplyObject(objectId);
                break;
              }
            }
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // storage events (other tabs)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "portfolioObjectId" && e.newValue) {
        fetchAndApplyObject(e.newValue);
      }
      if (e.key === "lastTransactionDigest" && e.newValue) {
        setTransactionDigest(e.newValue);
        setTransactionSource("blockchain");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // form handlers
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

  // parsers
  const extractObjectIdFromResult = (result: any): string | null => {
    try {
      const events = result?.effects?.events || result?.events || [];
      for (const ev of events) {
        if (ev?.parsedJson && typeof ev.parsedJson === "object") {
          if (ev.parsedJson?.object_id) return ev.parsedJson.object_id;
          if (ev.parsedJson?.fields?.object_id) return ev.parsedJson.fields.object_id;
        } else if (ev?.bcs && typeof ev.bcs === "string") {
          try {
            const parsed = JSON.parse(ev.bcs);
            if (parsed?.object_id) return parsed.object_id;
            if (parsed?.fields?.object_id) return parsed.fields.object_id;
          } catch {}
        } else if (ev?.object_id) {
          return ev.object_id;
        }
      }

      const created = result?.effects?.created || result?.effects?.createdObjects || [];
      for (const obj of created) {
        const cand = obj?.reference?.objectId || obj?.objectId || obj?.object_id || obj?.id;
        if (cand && String(cand).startsWith("0x")) return cand;
      }

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

  const extractFieldsFromResultEvents = (result: any) => {
    try {
      const events = result?.effects?.events || result?.events || [];
      for (const ev of events) {
        if (ev?.parsedJson && typeof ev.parsedJson === "object") {
          const parsed = ev.parsedJson;
          const candidate = parsed?.fields || parsed;
          if (candidate?.name || candidate?.skills) {
            return {
              name: candidate.name,
              course: candidate.course,
              school: candidate.school,
              about: candidate.about,
              linkedin: candidate.linkedin_url || candidate.linkedin,
              github: candidate.github_url || candidate.github,
              skills: candidate.skills,
            };
          }
        } else if (ev?.bcs && typeof ev.bcs === "string") {
          try {
            const parsed = JSON.parse(ev.bcs);
            const candidate = parsed?.fields || parsed;
            if (candidate?.name || candidate?.skills) {
              return {
                name: candidate.name,
                course: candidate.course,
                school: candidate.school,
                about: candidate.about,
                linkedin: candidate.linkedin_url || candidate.linkedin,
                github: candidate.github_url || candidate.github,
                skills: candidate.skills,
              };
            }
          } catch {}
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  // sanitize error message: remove trailing parenthesis blocks, after-pipe text, and digits
  const sanitizeErrorMessage = (raw: string) => {
    if (!raw) return "Transaction failed";
    // remove pipe and anything after, remove parenthesized parts, then strip digits, extra spaces
    let s = String(raw);
    s = s.split("|")[0];
    s = s.replace(/\([^)]*\)/g, "");
    // remove sequences like "I7:-4005" (letters/digits/punctuation); remove remaining digits
    s = s.replace(/[0-9]/g, "");
    // collapse whitespace and punctuation artifacts
    s = s.replace(/\s{2,}/g, " ").trim();
    // ensure readable fallback
    if (!s) return "Transaction failed";
    return s;
  };

  // create waiting toast (increased spacing & blue-only text)
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

  const createSuccessToast = (txDigest: string) => {
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
            Transaction successful
          </div>
          <div style={{ color: "#90caf9", fontSize: 14, wordBreak: "break-all", marginBottom: 10 }}>{txDigest}</div>

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

  // create error toast (top-right X, sanitized message, no numeric codes)
  const createErrorToast = (rawMessage: string) => {
    const message = sanitizeAndShorten(rawMessage);
    const id = toast.error(
      <div style={{ position: "relative", padding: 14, maxWidth: 560, minHeight: 72 }}>
        <button
          aria-label="close"
          onClick={() => {
            toast.dismiss(id);
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: 18,
            cursor: "pointer",
            padding: 6,
            lineHeight: 1,
          }}
        >
          ×
        </button>

        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 15, marginBottom: 6 }}>Transaction failed</div>
          <div style={{ color: "#90caf9", fontSize: 14 }}>{message}</div>
        </div>
      </div>,
      { autoClose: 8000, closeButton: false }
    );
    errorToastRef.current = id;
    return id;
  };

  // sanitize and shorten error message: remove parenthetical codes, pipe parts, digits; trim.
  const sanitizeAndShorten = (raw: string) => {
    if (!raw) return "An error occurred";
    let s = String(raw);
    // Remove everything after pipe
    if (s.includes("|")) s = s.split("|")[0];
    // Remove parenthesized segments
    s = s.replace(/\([^)]*\)/g, "");
    // Remove numeric characters and sequences
    s = s.replace(/[0-9]/g, "");
    // Clean up stray punctuation (excessive punctuation)
    s = s.replace(/[:\-]+/g, " ").replace(/\s{2,}/g, " ").trim();
    if (!s) return "An error occurred";
    // Limit length
    if (s.length > 120) s = s.slice(0, 117).trim() + "...";
    return s;
  };

  // saveToBlockchain flow
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

    createWaitingToast();

    try {
      const result: any = await signAndExecute({
        transaction: tx,
        options: { showEffects: true, showEvents: true, gasBudget: 100000000 },
      });

      if (waitingToastRef.current) {
        toast.dismiss(waitingToastRef.current);
        waitingToastRef.current = null;
      }

      if (!result) throw new Error("No response from wallet / signAndExecute");
      const possibleError =
        result.error || result?.effects?.status?.error || result?.effects?.status?.error?.message;
      if (possibleError) {
        throw new Error(typeof possibleError === "string" ? possibleError : JSON.stringify(possibleError));
      }

      const txDigest = result.digest || result.txDigest;
      if (!txDigest) throw new Error("Transaction failed - no digest returned");

      const foundObjectId = extractObjectIdFromResult(result);
      const eventFields = extractFieldsFromResultEvents(result);

      try {
        localStorage.setItem("lastTransactionDigest", txDigest);
        setTransactionDigest(txDigest);
        setTransactionSource(foundObjectId ? "blockchain" : "local");
      } catch {}

      if (eventFields) applyFields(eventFields);

      if (foundObjectId) {
        try {
          localStorage.setItem("portfolioObjectId", foundObjectId);
        } catch {}
        await fetchAndApplyObject(foundObjectId);
      } else {
        try {
          await refetchOwnedObjects?.();
        } catch {}
      }

      createSuccessToast(txDigest);
    } catch (err: any) {
      // dismiss waiting if present
      if (waitingToastRef.current) {
        toast.dismiss(waitingToastRef.current);
        waitingToastRef.current = null;
      }
      console.error("Transaction error:", err);
      const raw = err?.message || String(err) || "Transaction failed";
      // show sanitized error toast (no numbers/codes)
      createErrorToast(raw);
    } finally {
      setIsSaving(false);
    }
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
                  <span className="inline-flex items-center gap-2 bg-[#061223] px-3 py-1 rounded-md text-sm">
                    <span className="w-3 h-3 rounded-full bg-blue-500" /> <span className="text-blue-200">Success</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="min-w-[140px] text-sm text-blue-200 font-semibold">Data Source:</div>
                <div>
                  <span className="px-3 py-1 bg-[#071127] rounded-md text-sm text-blue-200 capitalize">
                    {transactionSource}
                  </span>
                </div>
              </div>

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
                <button type="button" onClick={addSkill} className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white">
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
            <div className="flex justify-center">
              <button
                onClick={saveToBlockchain}
                disabled={!account || isSaving || formData.skills.length !== 5}
                className={`px-12 py-5 rounded-2xl font-bold text-xl transition-all ${
                  !account || isSaving || formData.skills.length !== 5
                    ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-xl hover:shadow-2xl"
                }`}
              >
                {isSaving ? "Saving to Blockchain..." : account ? (formData.skills.length === 5 ? "Save Changes to Blockchain" : `Enter ${5 - formData.skills.length} more skills`) : "Connect Wallet to Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminView;