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

// Your published Move package ID
const PUBLISHED_PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE"

const PortfolioView = () => {
  const account = useCurrentAccount()
  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData)
  const [viewCount, setViewCount] = useState<number>(0)
  const [loadingViews, setLoadingViews] = useState(true)
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

  // Try to fetch package info
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

  // Clean view counter starting at 0
  useEffect(() => {
    const updateViewCount = () => {
      // Clear any old data
      const OLD_KEYS = [
        'portfolioViewCount',
        'portfolio_views',
        'portfolio_visit_session',
        'portfolioViews'
      ]
      
      OLD_KEYS.forEach(key => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
      
      // Use new storage key
      const STORAGE_KEY = 'ldcasilang_view_count'
      const SESSION_KEY = 'ldcasilang_session'
      
      // Check if first visit in this session
      const hasVisited = sessionStorage.getItem(SESSION_KEY)
      
      if (!hasVisited) {
        // First visit - increment
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0')
        const newCount = currentCount + 1
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, newCount.toString())
        
        // Mark session
        sessionStorage.setItem(SESSION_KEY, 'true')
        
        // Update state
        setViewCount(newCount)
      } else {
        // Refresh - just get current count
        const currentCount = parseInt(localStorage.getItem(STORAGE_KEY) || '0')
        setViewCount(currentCount)
      }
      
      setLoadingViews(false)
    }
    
    updateViewCount()
  }, [])

  useEffect(() => {
    // Load data from localStorage
    const savedData = localStorage.getItem('portfolioData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setPortfolioData(prev => ({
          ...prev,
          ...data,
          name: data.name?.toUpperCase() || prev.name,
          linkedin: data.linkedin || prev.linkedin,
          github: data.github || prev.github
        }))
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    // Check package
    if (packageData && packageData.error) {
      setProjectId("Not Published Yet")
    }
  }, [packageData])

  // Format project ID
  const formatProjectId = (id: string) => {
    if (!id || id === "0xYOUR_PACKAGE_ID_HERE") {
      return "Not Published Yet"
    }
    if (id === "Not Published Yet") return id
    return `${id.slice(0, 10)}...${id.slice(-6)}`
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
              >
                <i className="fa-brands fa-linkedin"></i> LinkedIn
              </a>
              <a 
                href={portfolioData.github}
                target="_blank"
                rel="noopener noreferrer"
                className="social-btn"
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
        <div className="move-card">
          <div className="move-title">
            <img src="/sui-logo.png" alt="Move Logo" className="move-logo" />
            <strong>Move Smart Contracts</strong>
          </div>

          <p>
            Move smart contracts are programs written in the Move language and deployed on blockchains like Sui, enabling secure asset management and high scalability.
          </p>

          <a href="https://www.sui.io/move" target="_blank" className="learn-more-btn" rel="noopener noreferrer">
            Learn More About Sui →
          </a>
        </div>

        <div className="move-footer">
          <p>
           
          </p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="custom-footer">
        <div className="footer-container">
          <div className="footer-logos">
            <img src="/devcon.png" alt="DEVCON" className="logo-img" />
            <img src="/sui.png" alt="SUI" className="logo-img" />
          </div>
          
          <div className="footer-right-section">
            <div className="footer-info-container">
              {/* Project ID */}
              <div className="info-box">
                <div className="info-label">PROJECT ID:</div>
                <div className="info-value" title={projectId}>
                  {formatProjectId(projectId)}
                </div>
              </div>
              
              {/* VIEW COUNT - Clean and working */}
              <div className="info-box">
                <div className="info-label">VIEW COUNT:</div>
                <div className="info-value">
                  {loadingViews ? (
                    <span className="loading">...</span>
                  ) : (
                    viewCount.toLocaleString()
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Socials */
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
        }
        
        .social-btn:hover {
          background: #1e40af;
          color: #fff;
        }
        
        .social-btn i {
          font-size: 1.1rem;
        }

        /* Footer */
        .footer-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
          flex-wrap: wrap;
          gap: 20px;
        }

        .footer-right-section {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-left: auto;
        }

        .footer-info-container {
          display: flex;
          gap: 20px;
          justify-content: flex-end;
          align-items: flex-start;
        }

        /* Info Boxes */
        .info-box {
          background: rgba(11, 27, 58, 0.9);
          border: 1px solid #1e40af;
          border-radius: 8px;
          padding: 12px 16px;
          min-width: 180px;
          text-align: center;
        }

        .info-label {
          font-size: 0.8rem;
          color: #93c5fd;
          font-weight: 600;
          margin-bottom: 6px;
          text-transform: uppercase;
        }

        .info-value {
          font-size: 0.95rem;
          color: white;
          font-family: monospace;
          font-weight: 500;
        }

        .loading {
          color: #93c5fd;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

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
        
        /* Responsive */
        @media (max-width: 768px) {
          .footer-container {
            flex-direction: column;
            align-items: center;
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
          }
        }
        
        @media (max-width: 400px) {
          .socials {
            flex-direction: column;
            align-items: center;
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