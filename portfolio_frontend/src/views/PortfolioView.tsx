import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit"
import { useEffect, useState } from "react"

// Default portfolio data
const defaultPortfolioData = {
  name: "LADY DIANE BAUZON CASILANG",
  course: "BS in Information Technology",
  school: "FEU Institute of Technology",
  about: "I am a fourth-year IT student and freelance designer who integrates technical troubleshooting with creative insight to deliver innovative, efficient solutions.",
  skills: [
    "Graphic Design",
    "UI / UX Design",
    "Project Management",
    "Full Stack Development",
    "Web & App Development"
  ],
  linkedin: "https://www.linkedin.com/in/ldcasilang/",
  github: "https://github.com/ldcasilang"
}

// Your published Move package ID (replace with your actual package ID)
// This is the Object ID you get when you publish: sui client publish --gas-budget 10000000
const PUBLISHED_PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE" // Replace with your actual package ID

const PortfolioView = () => {
  const account = useCurrentAccount()
  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData)
  const [views, setViews] = useState(500)
  const [projectId, setProjectId] = useState(PUBLISHED_PACKAGE_ID)

  // Fetch SUI balance
  const { data: balanceData } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    }
  )

  // Try to fetch package info if we have a package ID
  const { data: packageData } = useSuiClientQuery(
    "getObject",
    {
      id: PUBLISHED_PACKAGE_ID,
      options: {
        showType: true,
        showOwner: true,
        showContent: true,
      },
    },
    {
      enabled: !!PUBLISHED_PACKAGE_ID && PUBLISHED_PACKAGE_ID !== "0xYOUR_PACKAGE_ID_HERE",
      retry: false,
    }
  )

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://counter.websiteout.com/js/36/0/0/0"
    script.async = true

    const counterDiv = document.getElementById("web-counter")
    if (counterDiv && !counterDiv.hasChildNodes()) {
      counterDiv.appendChild(script)
    }

    return () => {
      script.remove()
    }
  }, [])

  useEffect(() => {
    // Load data from localStorage first
    const savedData = localStorage.getItem('portfolioData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setPortfolioData(prev => ({
          ...prev,
          ...data,
          name: data.name?.toUpperCase() || prev.name,
          // Keep LinkedIn and GitHub URLs from defaults if not saved
          linkedin: data.linkedin || prev.linkedin,
          github: data.github || prev.github
        }))
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    // Increment views on load
    setViews(prev => prev + 1)

    // Check if package is published by looking at the response
    if (packageData && packageData.error) {
      // Package not found or invalid
      setProjectId("Not Published Yet")
    } else if (packageData) {
      // Package exists on chain
      console.log("Package found:", packageData)
    }
  }, [packageData])

  // Format package ID for display
  const formatProjectId = (id: string) => {
    if (!id || id === "0xYOUR_PACKAGE_ID_HERE") {
      return "Not Published Yet"
    }
    if (id === "Not Published Yet") return id
    // Show first 8 and last 6 characters for long IDs
    return `${id.slice(0, 10)}...${id.slice(-6)}`
  }

  // Convert MIST to SUI
  const getSuiBalance = () => {
    if (!balanceData) return "0"
    return (Number(balanceData.totalBalance) / 1_000_000_000).toFixed(2)
  }

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
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/180x180?text=Profile'
              }}
            />
          </div>

          <div className="hero-content">
            <small>Hello! My name is</small>
            <h1 className="gradient-name">{portfolioData.name}</h1>
            <p><span className="degree">{portfolioData.course}, {portfolioData.school}</span></p>

            <div className="socials">
              <a 
                href={portfolioData.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
                title="Visit my LinkedIn profile"
              >
                <i className="fa-brands fa-linkedin"></i> LinkedIn
              </a>
              <a 
                href={portfolioData.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
                title="Visit my GitHub profile"
              >
                <i className="fa-brands fa-github"></i> GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ABOUT + SKILLS SECTION */}
      <section className="solid-section">
        <h2 className="section-title">About Me</h2>
        <p>
          {portfolioData.about}
        </p>

        <h2 className="section-title">Skills</h2>
        <div className="skills">
          {portfolioData.skills.map((skill, index) => (
            <div key={index} className="skill">{skill}</div>
          ))}
        </div>
      </section>

      {/* MOVE SMART CONTRACTS SECTION */}
      <div className="move-wrapper">
        {/* Card */}
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

        {/* Footer-like info below the card */}
        <div className="move-footer">
          <p>
            Portfolio project published during Move Smart Contracts Code Camp<br />
            by DEVCON Philippines & SUI Foundation
          </p>
        </div>
      </div>

      {/* NEW FOOTER WITH LOGOS AND PROJECT ID */}
      <div className="custom-footer">
        <div className="footer-container">
          <div className="footer-logos">
            <img src="/devcon.png" alt="DEVCON" className="logo-img" />
            <img src="/sui.png" alt="SUI" className="logo-img" />
          </div>
          
          {/* Project ID and View Count moved to the right */}
          <div className="footer-right-section">
            <div className="footer-info-container">
              {/* Project ID Box - Shows actual Package ID */}
              <div className="info-box">
                <div className="info-label">PROJECT ID:</div>
                <div className="info-value" title={projectId}>
                  {formatProjectId(projectId)}
                </div>
                {projectId && projectId !== "Not Published Yet" && projectId !== "0xYOUR_PACKAGE_ID_HERE" && (
                  <div className="info-subtext">
                    <a 
                      href={`https://suiscan.xyz/mainnet/object/${projectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="view-on-explorer"
                    >
                      View on Explorer
                    </a>
                  </div>
                )}
              </div>
              
              {/* View Count Box */}
              <div className="info-box">
                <div className="info-label">VIEW COUNT:</div>
                <div className="info-value">
                  <div id="web-counter"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Connect Wallet Prompt - Only show if NOT connected */}
      {!account && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900/90 backdrop-blur-sm p-4 rounded-2xl border border-sui-blue shadow-2xl max-w-sm">
            <div className="flex items-start gap-3">
              <div className="text-sui-blue text-xl">
                <i className="fas fa-edit"></i>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">Edit Your Portfolio</h4>
                <p className="text-gray-300 text-sm mb-3">
                  Connect your Sui wallet to customize your portfolio on the blockchain
                </p>
                {projectId === "Not Published Yet" && (
                  <div className="mt-2 p-2 bg-yellow-900/30 rounded border border-yellow-700">
                    <p className="text-xs text-yellow-300">
                      <i className="fas fa-exclamation-triangle mr-1"></i>
                      Publish your Move package to get a real Project ID
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Socials styling */
        .socials {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
          flex-wrap: wrap;
        }
        
        .social-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          background: #0b1b3a;
          color: #93c5fd;
          text-decoration: none;
          border: 1px solid #1e40af;
          transition: 0.3s;
          font-weight: 500;
          cursor: pointer;
        }
        
        .social-btn:hover {
          background: #1e40af;
          color: #fff;
          text-decoration: none;
        }
        
        /* FontAwesome icons styling */
        .social-btn i {
          font-size: 1.1rem;
        }

        /* Footer Container */
        .footer-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          flex-wrap: wrap;
          gap: 20px;
        }

        /* Right Section - Project ID & View Count */
        .footer-right-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-left: auto;
        }

        /* Footer Info Container */
        .footer-info-container {
          display: flex;
          gap: 20px;
          justify-content: flex-end;
          align-items: flex-start;
        }

        /* Info Box Styling */
        .info-box {
          background: rgba(11, 27, 58, 0.8);
          border: 1px solid #1e40af;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 180px;
          text-align: center;
          position: relative;
        }

        .info-label {
          font-size: 0.8rem;
          color: #93c5fd;
          font-weight: 600;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          font-size: 0.9rem;
          color: white;
          font-family: monospace;
          word-break: break-all;
          cursor: default;
        }

        .info-subtext {
          margin-top: 6px;
          font-size: 0.7rem;
        }

        .view-on-explorer {
          color: #60a5fa;
          text-decoration: none;
          font-size: 0.75rem;
        }

        .view-on-explorer:hover {
          text-decoration: underline;
        }

        /* Counter widget styling */
        #web-counter {
          font-size: 0.9rem;
          color: white;
          font-family: monospace;
          display: inline-block;
        }

        #web-counter img {
          max-height: 20px;
          border: none !important;
          background: transparent !important;
        }

        /* Move footer text styling */
        .move-footer {
          text-align: center;
          margin-top: 30px;
          padding: 15px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .move-footer p {
          margin: 0;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .footer-container {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .footer-right-section {
            margin-left: 0;
            align-items: center;
            width: 100%;
          }
          
          .footer-info-container {
            justify-content: center;
            flex-wrap: wrap;
          }
          
          .socials {
            justify-content: center;
            gap: 15px;
          }
        }
        
        @media (max-width: 400px) {
          .socials {
            flex-direction: column;
            align-items: center;
            gap: 12px;
          }
          
          .social-btn {
            width: 200px;
            justify-content: center;
          }
          
          .footer-info-container {
            flex-direction: column;
            align-items: center;
          }
          
          .info-box {
            width: 100%;
            max-width: 300px;
          }
        }
      `}</style>
    </div>
  )
}

export default PortfolioView