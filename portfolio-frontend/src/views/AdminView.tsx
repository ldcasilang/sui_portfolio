import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AdminView = () => {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [formData, setFormData] = useState({
    name: "LADY DIANE BAUZON CASILANG",
    course: "BS in Information Technology",
    school: "FEU Institute of Technology",
    about: "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
    linkedin: "#",
    github: "#",
    skills: ["Graphic Design", "UI / UX Design", "Project Management", "Full Stack Development", "Web & App Development"]
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [portfolioObjectId, setPortfolioObjectId] = useState("");
  
  // ⚠️ IMPORTANT: Replace with YOUR actual package ID after publishing!
//   const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
const PACKAGE_ID = "0x2a80d0d55a1ec4c912e3e20e681f91b8aad5c385bdcb831e744173ac6d1a1210";


  useEffect(() => {
    // Load saved data from localStorage
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          ...data,
          skills: data.skills || prev.skills
        }));
      } catch (error) {
        console.error("Error loading saved data:", error);
      }
    }
    
    // Load portfolio object ID if exists
    const savedObjectId = localStorage.getItem('portfolioObjectId');
    if (savedObjectId) {
      setPortfolioObjectId(savedObjectId);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  // Save to Blockchain - only way to save data
  const saveToBlockchain = async () => {
    if (!account) {
      toast.error("⚠️ Connect your Sui wallet to save changes");
      return;
    }

    if (!PACKAGE_ID || PACKAGE_ID === "0x2a80d0d55a1ec4c912e3e20e681f91b8aad5c385bdcb831e744173ac6d1a1210") {
      toast.error("❌ Contract not deployed. Update PACKAGE_ID in code.");
      return;
    }

    setIsSaving(true);

    try {
      const tx = new Transaction();
      
      if (portfolioObjectId) {
        // UPDATE existing portfolio
        tx.moveCall({
          target: `${PACKAGE_ID}::portfolio::update`,
          arguments: [
            tx.object(portfolioObjectId),
            tx.pure(formData.name),
            tx.pure(formData.course),
            tx.pure(formData.school),
            tx.pure(formData.about),
            tx.pure(formData.linkedin),
            tx.pure(formData.github),
            tx.pure(formData.skills),
          ],
        });
      } else {
        // CREATE new portfolio
        tx.moveCall({
          target: `${PACKAGE_ID}::portfolio::create`,
          arguments: [
            tx.pure(formData.name),
            tx.pure(formData.course),
            tx.pure(formData.school),
            tx.pure(formData.about),
            tx.pure(formData.linkedin),
            tx.pure(formData.github),
            tx.pure(formData.skills),
          ],
        });
      }

      const result = await signAndExecute({
        transaction: tx,
        options: { showEffects: true }
      });

      // Save to localStorage
      localStorage.setItem('portfolioData', JSON.stringify(formData));
      
      // Save object ID if created
      if (!portfolioObjectId && result.effects?.created) {
        const portfolioObj = result.effects.created.find(obj => 
          obj.objectType.includes("Portfolio")
        );
        if (portfolioObj) {
          localStorage.setItem('portfolioObjectId', portfolioObj.reference.objectId);
          setPortfolioObjectId(portfolioObj.reference.objectId);
        }
      }
      
      toast.success(
        <div>
          <p>✅ Portfolio saved to blockchain!</p>
          <a 
            href={`https://suiexplorer.com/txblock/${result.digest}?network=testnet`}
            target="_blank"
            className="text-blue-300 underline text-sm"
          >
            View Transaction
          </a>
        </div>
      );
      
    } catch (error: any) {
      console.error("Transaction error:", error);
      
      if (error.message?.includes("Insufficient gas")) {
        toast.error(
          <div>
            <p>💰 Insufficient SUI for gas fees</p>
            <p className="text-sm text-gray-300 mt-1">
              Get free test coins from:{" "}
              <a 
                href="https://docs.sui.io/testnet/faucet" 
                target="_blank"
                className="text-blue-400 underline"
              >
                Sui Faucet
              </a>
            </p>
          </div>
        );
      } else if (error.message?.includes("rejected")) {
        toast.error("❌ Transaction rejected by wallet");
      } else {
        toast.error("❌ Failed to save: " + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 shadow-2xl border border-gray-800">
        
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-sui-blue to-white bg-clip-text text-transparent">
            Portfolio Editor
          </h1>
          <p className="text-gray-400">
            All changes are saved directly to the Sui blockchain
          </p>
          
          {!account && (
            <div className="mt-4 p-4 bg-yellow-900/30 rounded-xl border border-yellow-800">
              <p className="text-yellow-300">⚠️ Connect your Sui wallet to save changes</p>
            </div>
          )}
        </div>

        {/* Form Fields */}
        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
          
          {/* Full Name - SINGLE ROW */}
          <div>
            <label className="block text-blue-400 mb-2 text-lg">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-5 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none text-lg"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Course/Degree and School/University - SAME ROW */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-400 mb-2">Course/Degree *</label>
              <input
                type="text"
                name="course"
                value={formData.course}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                placeholder="e.g., BS in Information Technology"
                required
              />
            </div>
            
            <div>
              <label className="block text-blue-400 mb-2">School/University *</label>
              <input
                type="text"
                name="school"
                value={formData.school}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                placeholder="e.g., FEU Institute of Technology"
                required
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-blue-400 mb-2">LinkedIn URL</label>
              <input
                type="url"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            
            <div>
              <label className="block text-blue-400 mb-2">GitHub URL</label>
              <input
                type="url"
                name="github"
                value={formData.github}
                onChange={handleChange}
                className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                placeholder="https://github.com/username"
              />
            </div>
          </div>

          {/* About Me */}
          <div>
            <label className="block text-blue-400 mb-2">About Me *</label>
            <textarea
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="w-full p-4 bg-sui-dark border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none min-h-[150px]"
              placeholder="Write about yourself..."
              required
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-blue-400 mb-2">Skills</label>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {formData.skills.map((skill, index) => (
                <input
                  key={index}
                  type="text"
                  value={skill}
                  onChange={(e) => handleSkillChange(index, e.target.value)}
                  className="w-full p-3 bg-sui-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-sui-blue focus:outline-none"
                  placeholder={`Skill ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Save Changes Button - BLUE BUTTON, NO ICON */}
          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex justify-center">
              <button
                onClick={saveToBlockchain}
                disabled={!account || isSaving}
                className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${
                  !account || isSaving
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving to Blockchain...
                  </span>
                ) : account ? (
                  'Save Changes'
                ) : (
                  'Connect Wallet to Save'
                )}
              </button>
            </div>
            
            {!account && (
              <p className="text-center text-gray-400 text-sm mt-3">
                Connect your wallet using the button at the top right
              </p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-6 p-6 bg-gray-900/50 rounded-xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4 text-green-400">How Blockchain Saving Works:</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-green-900 rounded-full flex items-center justify-center text-xs">1</div>
                <p className="text-white">Connect your Sui wallet (top right button)</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-blue-900 rounded-full flex items-center justify-center text-xs">2</div>
                <p className="text-white">Fill in all your portfolio details above</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-purple-900 rounded-full flex items-center justify-center text-xs">3</div>
                <p className="text-white">Click "Save Changes" button below</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 bg-emerald-900 rounded-full flex items-center justify-center text-xs">4</div>
                <p className="text-white">Approve transaction and pay gas fee in your wallet</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400">
                ℹ️ Gas fees are minimal (less than 0.01 SUI). If you don't have SUI, get free test coins from the{" "}
                <a 
                  href="https://docs.sui.io/testnet/faucet" 
                  target="_blank"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  Sui Faucet
                </a>.
              </p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminView;