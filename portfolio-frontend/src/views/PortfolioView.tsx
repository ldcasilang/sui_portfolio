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
  linkedin: "#",
  github: "#"
}

const PortfolioView = () => {
  const account = useCurrentAccount()
  const [portfolioData, setPortfolioData] = useState(defaultPortfolioData)
  const [views, setViews] = useState(500)

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

  useEffect(() => {
    // Load data from localStorage first
    const savedData = localStorage.getItem('portfolioData')
    if (savedData) {
      try {
        const data = JSON.parse(savedData)
        setPortfolioData(prev => ({
          ...prev,
          ...data,
          name: data.name?.toUpperCase() || prev.name
        }))
      } catch (error) {
        console.error("Error loading saved data:", error)
      }
    }

    // Increment views on load
    setViews(prev => prev + 1)
  }, [])

  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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

            {/* REMOVED: Wallet Info section below socials */}
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
          <div className="project-id">
            PROJECT ID:<br />
            {account ? formatAddress(account.address) : "Connect wallet to see ID"}
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
                
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Socials styling matching the HTML example */
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
          margin-right: 10px;
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
        
        /* FontAwesome icons styling */
        .social-btn i {
          font-size: 1.1rem;
        }
        
        @media (max-width: 900px) {
          .socials {
            justify-content: center;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
          
          .social-btn {
            margin-right: 0;
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
        }
      `}</style>
    </div>
  )
}

export default PortfolioView