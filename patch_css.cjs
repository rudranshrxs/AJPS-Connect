const fs = require('fs');

const css = `

/* ── Responsive Sizing Updates ─────────────────────────────────────────── */

/* 1. Main Dashboard */
.dashboard-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  background-color: #E5E0D8;
}

.dashboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1024px) {
  .dashboard-container {
    width: min(95vw, 1200px);
    height: min(92vh, 850px);
    border-radius: clamp(20px, 2vw, 30px);
    display: grid;
    grid-template-columns: clamp(190px, 20vw, 240px) 1fr;
    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  }
}

/* 2. Sidebar */
.sidebar-responsive {
  width: 100% !important;
  padding: clamp(12px, 1.5vw, 20px) !important;
}

/* 11. Sidebar Logo */
.sidebar-logo {
  width: clamp(75px, 9vw, 112px) !important;
  height: auto !important;
  aspect-ratio: 1 !important;
}
.sidebar-school-name { font-size: clamp(16px, 1.8vw, 21px) !important; }
.sidebar-public-school { font-size: clamp(11px, 1.2vw, 16px) !important; }

/* 12. Sidebar Nav Items */
.sidebar-nav-item {
  width: 100% !important;
  height: clamp(34px, 3.5vw, 42px) !important;
  padding: 0 clamp(9px, 1.3vw, 15px) !important;
  gap: clamp(8px, 1vw, 12px) !important;
  font-size: clamp(11px, 1.1vw, 14px) !important;
}
.sidebar-nav-item svg {
  width: clamp(16px, 1.6vw, 19px) !important;
  height: clamp(16px, 1.6vw, 19px) !important;
}

/* 3. Hero Banner */
.hero-responsive {
  width: 100% !important;
  height: auto !important;
  aspect-ratio: 1.95 / 1 !important;
  max-height: clamp(300px, 38vw, 370px) !important;
  border-radius: clamp(16px, 1.8vw, 22px) !important;
}
@media (max-width: 768px) {
  .hero-responsive {
    aspect-ratio: auto !important;
    min-height: clamp(230px, 65vw, 300px) !important;
    border-radius: 16px !important;
  }
}

/* 4. Hero Text */
.hero-greeting { font-size: clamp(11px, 1.15vw, 14px) !important; }
.hero-name { font-size: clamp(21px, 2.2vw, 30px) !important; }
.hero-subtitle { font-size: clamp(10px, 1vw, 13px) !important; }
.hero-content {
  position: absolute !important;
  top: clamp(70px, 15vw, 145px) !important;
  left: clamp(18px, 2.2vw, 30px) !important;
  bottom: auto !important;
}

/* 5. Date Card */
.date-card-responsive {
  width: clamp(115px, 13vw, 150px) !important;
  height: clamp(65px, 8vw, 82px) !important;
  right: clamp(12px, 2vw, 24px) !important;
  top: 42% !important;
  border-radius: clamp(13px, 1.5vw, 19px) !important;
  padding: clamp(10px, 1.2vw, 16px) !important;
  transform: translateY(-50%) !important;
}

/* 6. Four Stat Cards */
.stats-grid-responsive {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: clamp(6px, 1vw, 12px) !important;
  width: 100% !important;
  position: absolute !important;
  left: clamp(12px, 2vw, 20px) !important;
  right: clamp(12px, 2vw, 20px) !important;
  bottom: clamp(12px, 2vw, 20px) !important;
  margin-top: 0 !important;
  padding: 0 !important;
  box-sizing: border-box;
}
@media (max-width: 768px) {
  .stats-grid-responsive {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: clamp(6px, 2vw, 9px) !important;
    position: relative !important;
    left: auto !important;
    right: auto !important;
    bottom: auto !important;
    margin-top: -30px !important;
    padding: 0 16px !important;
  }
}
.stat-card {
  height: clamp(88px, 10vw, 115px) !important;
  padding: clamp(10px, 1.3vw, 17px) !important;
  border-radius: clamp(14px, 1.5vw, 19px) !important;
}
@media (max-width: 768px) {
  .stat-card {
    height: clamp(65px, 20vw, 82px) !important;
    padding: clamp(8px, 3vw, 13px) !important;
  }
}
.stat-title { font-size: clamp(10px, 1vw, 13px) !important; }
@media (max-width: 768px) { .stat-title { font-size: clamp(9px, 3vw, 12px) !important; } }

.stat-number { font-size: clamp(18px, 1.9vw, 25px) !important; }
@media (max-width: 768px) { .stat-number { font-size: clamp(17px, 5vw, 23px) !important; } }

.stat-label { font-size: clamp(9px, 0.9vw, 12px) !important; }

.stat-icon-circle {
  width: clamp(28px, 3vw, 38px) !important;
  height: clamp(28px, 3vw, 38px) !important;
}
@media (max-width: 768px) {
  .stat-icon-circle {
    width: clamp(25px, 8vw, 35px) !important;
    height: clamp(25px, 8vw, 35px) !important;
  }
}

/* 8. Glass Card */
.glass-card-responsive {
  width: 100% !important;
  max-width: none !important;
  padding: clamp(10px, 1.3vw, 18px) !important;
  border-radius: clamp(13px, 1.5vw, 20px) !important;
  background: rgba(255,255,255,0.72) !important;
  backdrop-filter: blur(clamp(8px, 1.2vw, 16px)) !important;
  border: 1px solid rgba(255,255,255,0.85) !important;
}

/* 9. Events + Notices */
.events-notices-grid {
  display: grid !important;
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  gap: clamp(10px, 1.5vw, 16px) !important;
  width: 100% !important;
}
.events-notices-card {
  width: 100% !important;
  min-height: clamp(220px, 25vw, 270px) !important;
}
@media (max-width: 768px) {
  .events-notices-grid {
    grid-template-columns: 1fr !important;
  }
  .events-notices-card {
    height: auto !important;
    min-height: 0 !important;
    padding: clamp(10px, 3vw, 15px) !important;
  }
}

/* 10. Subject Overview */
.subject-overview-responsive {
  width: 100% !important;
}
.subject-grid {
  display: grid !important;
  grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
  gap: clamp(5px, 1vw, 10px) !important;
}
.subject-card {
  min-width: 0 !important;
  padding: clamp(7px, 1vw, 12px) !important;
}
@media (max-width: 768px) {
  .subject-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

/* 13. Top Buttons */
.top-btn-responsive {
  width: clamp(38px, 4vw, 48px) !important;
  height: clamp(38px, 4vw, 48px) !important;
  border-radius: clamp(11px, 1.3vw, 15px) !important;
  gap: clamp(5px, 0.8vw, 9px) !important;
}
.top-btn-responsive svg {
  width: clamp(16px, 1.7vw, 21px) !important;
  height: clamp(16px, 1.7vw, 21px) !important;
}

/* 14. Mobile Breakpoint */
@media (max-width: 768px) {
  .main-content-responsive {
    width: 100% !important;
    padding: clamp(10px, 4vw, 16px) !important;
  }
}

/* 17. Mobile Header */
.mobile-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
}
.mobile-header-logo {
  width: clamp(34px, 10vw, 44px) !important;
  height: auto !important;
}
.mobile-header-title {
  font-size: clamp(11px, 3.5vw, 15px) !important;
}
.mobile-header-subtitle {
  font-size: clamp(7px, 2.2vw, 10px) !important;
}

/* 18. Mobile Bottom Nav */
.mobile-bottom-nav {
  width: calc(100% - clamp(20px, 8vw, 32px)) !important;
  height: clamp(56px, 17vw, 68px) !important;
  position: fixed !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  bottom: clamp(8px, 3vw, 15px) !important;
  border-radius: clamp(18px, 6vw, 24px) !important;
  display: grid !important;
  grid-template-columns: repeat(5, 1fr) !important;
}
`;

fs.appendFileSync('src/index.css', css);
console.log('Appended to src/index.css');
