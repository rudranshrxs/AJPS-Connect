const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  for (let r of replacements) {
    content = content.replace(r.search, r.replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched', path.basename(filePath));
}

// 1. MainLayout.tsx
replaceInFile('src/components/layout/MainLayout.tsx', [
  {
    search: '<div className="flex h-screen w-full bg-[#FAF7F2] text-[#111827] font-sans overflow-hidden relative">',
    replace: '<div className="dashboard-wrapper">\\n      <div className="dashboard-container bg-[#FAF7F2] text-[#111827] font-sans overflow-hidden relative">'
  },
  {
    search: '      <div className="flex-1 flex flex-col relative z-10 overflow-hidden">',
    replace: '      <div className="flex-1 flex flex-col relative z-10 overflow-hidden main-content-responsive">'
  },
  {
    search: '<header className="md:hidden sticky top-0 z-50 flex items-center justify-between p-3 bg-[#FAF7F2] w-full border-b border-[#EDE8DF] shrink-0">',
    replace: '<header className="md:hidden sticky top-0 z-50 mobile-header p-3 bg-[#FAF7F2] w-full border-b border-[#EDE8DF] shrink-0">'
  },
  {
    search: '<img src="/Logo.png" alt="Logo" className="w-[36px] h-[36px] object-contain shrink-0" />',
    replace: '<img src="/Logo.png" alt="Logo" className="mobile-header-logo object-contain shrink-0" />'
  },
  {
    search: '<span className="text-[11px] font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">AMAR JYOTI</span>',
    replace: '<span className="mobile-header-title font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">AMAR JYOTI</span>'
  },
  {
    search: '<span className="text-[11px] font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">PUBLIC SCHOOL</span>',
    replace: '<span className="mobile-header-subtitle font-[700] text-[#8B5E2E] leading-tight tracking-[0.03em] truncate">PUBLIC SCHOOL</span>'
  },
  {
    search: 'className="relative w-[34px] h-[34px] bg-[#FFFFFF] rounded-[8px] flex items-center justify-center text-[#8B5E2E] shadow-sm border border-[#EDE8DF]"',
    replace: 'className="relative top-btn-responsive bg-[#FFFFFF] flex items-center justify-center text-[#8B5E2E] shadow-sm border border-[#EDE8DF]"'
  },
  {
    search: 'className="w-[34px] h-[34px] bg-[#FFFFFF] rounded-[8px] flex items-center justify-center shadow-sm overflow-hidden border border-[#EDE8DF]"',
    replace: 'className="top-btn-responsive bg-[#FFFFFF] flex items-center justify-center shadow-sm overflow-hidden border border-[#EDE8DF]"'
  },
  {
    search: '<div className="md:hidden fixed bottom-4 left-0 right-0 mx-auto w-[calc(100%-2rem)] max-w-md z-50">\\n        <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-2xl rounded-full flex flex-nowrap justify-around items-center p-2">',
    replace: '<div className="md:hidden fixed bottom-4 left-0 right-0 mx-auto w-full z-50 flex justify-center">\\n        <div className="bg-white/70 backdrop-blur-lg border border-white/40 shadow-2xl mobile-bottom-nav">'
  },
  {
    search: '</main>\\n      </div>\\n\\n      <NotificationDrawer',
    replace: '</main>\\n      </div>\\n      </div>\\n\\n      <NotificationDrawer'
  }
]);

// 2. Sidebar.tsx
replaceInFile('src/components/layout/Sidebar.tsx', [
  {
    search: '<aside className="w-[240px] h-full bg-[#FAF7F2] border-r border-[#EDE8DF] flex flex-col shrink-0 hidden md:flex transition-all duration-300">',
    replace: '<aside className="sidebar-responsive h-full bg-[#FAF7F2] border-r border-[#EDE8DF] flex flex-col shrink-0 hidden md:flex transition-all duration-300">'
  },
  {
    search: '<img src="/Logo.png" alt="Amar Jyoti Public School" className="w-[34px] h-[34px] object-contain" />',
    replace: '<img src="/Logo.png" alt="Amar Jyoti Public School" className="sidebar-logo object-contain" />'
  },
  {
    search: '<span className="text-[14px] font-[900] text-[#8B5E2E] tracking-[0.05em] leading-tight">AMAR JYOTI</span>',
    replace: '<span className="sidebar-school-name font-[900] text-[#8B5E2E] tracking-[0.05em] leading-tight">AMAR JYOTI</span>'
  },
  {
    search: '<span className="text-[13px] font-[900] text-[#8B5E2E] leading-tight">PUBLIC SCHOOL</span>',
    replace: '<span className="sidebar-public-school font-[900] text-[#8B5E2E] leading-tight">PUBLIC SCHOOL</span>'
  },
  {
    search: '`flex items-center px-6 h-[44px] gap-[10px] transition-all duration-300 ${',
    replace: '`sidebar-nav-item flex items-center transition-all duration-300 ${'
  },
  {
    search: 'className="flex items-center px-6 h-[44px] gap-[10px] transition-all duration-300 bg-transparent border-l-[3px] border-transparent text-[#6B5E4E] font-[400] hover:bg-black/5 w-full"',
    replace: 'className="sidebar-nav-item flex items-center transition-all duration-300 bg-transparent border-l-[3px] border-transparent text-[#6B5E4E] font-[400] hover:bg-black/5 w-full"'
  }
]);

// 3. Dashboards - General Replacements Function
function patchDashboard(filePath) {
  replaceInFile(filePath, [
    {
      search: '<div className="relative w-full h-[260px] md:h-[280px] rounded-[16px] overflow-hidden shrink-0">',
      replace: '<div className="hero-responsive relative overflow-hidden shrink-0">'
    },
    {
      search: 'className="absolute bottom-[24px] left-[24px] z-10 pointer-events-none"',
      replace: 'className="hero-content z-10 pointer-events-none"'
    },
    {
      search: '<p className="text-[14px] font-[400] text-white mb-1">Good Morning,</p>',
      replace: '<p className="hero-greeting font-[400] text-white mb-1">Good Morning,</p>'
    },
    {
      search: 'className="text-[28px] font-[700] text-white leading-tight"',
      replace: 'className="hero-name font-[700] text-white leading-tight"'
    },
    {
      search: 'className="text-[13px] text-white/80 mt-0.5"',
      replace: 'className="hero-subtitle text-white/80 mt-0.5"'
    },
    {
      search: '<div className="hidden md:flex absolute right-[24px] top-1/2 -translate-y-1/2 z-20 bg-[rgba(255,255,255,0.20)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.30)] rounded-[14px] px-[18px] py-[12px] text-white flex flex-col gap-0.5 shadow-lg pointer-events-none">',
      replace: '<div className="hidden md:flex absolute z-20 date-card-responsive glass-card-responsive text-white flex-col gap-0.5 shadow-lg pointer-events-none">'
    },
    {
      search: 'className="w-[40px] h-[40px] rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.25)] text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition cursor-pointer pointer-events-auto"',
      replace: 'className="top-btn-responsive rounded-full bg-[rgba(255,255,255,0.15)] backdrop-blur-[12px] border border-[rgba(255,255,255,0.25)] text-white flex items-center justify-center shrink-0 hover:bg-white/20 transition cursor-pointer pointer-events-auto"'
    },
    {
      search: 'className="w-[40px] h-[40px] rounded-full overflow-hidden border-[2px] border-white shrink-0 shadow-sm cursor-pointer pointer-events-auto"',
      replace: 'className="top-btn-responsive rounded-full overflow-hidden border-[2px] border-white shrink-0 shadow-sm cursor-pointer pointer-events-auto"'
    },
    {
      search: '<div className="w-full grid grid-cols-2 lg:grid-cols-4 gap-[12px] mt-[-48px] relative z-10 px-4 md:px-6">',
      replace: '<div className="stats-grid-responsive z-10">'
    },
    {
      search: '<div className="grid grid-cols-2 md:grid-cols-4 gap-[12px] mt-[-48px] relative z-10 px-4 md:px-6">',
      replace: '<div className="stats-grid-responsive z-10">'
    }
  ]);
}

patchDashboard('src/pages/dashboard/StudentDashboard.tsx');
patchDashboard('src/pages/dashboard/TeacherDashboard.tsx');
patchDashboard('src/pages/dashboard/AdminDashboard.tsx');

// Stat cards specific replacements
function patchStatCards(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/className="text-\[11px\] font-\[500\] text-\[#[A-F0-9]+\] uppercase tracking-\[0\.04em\]"/g, 'className="stat-label font-[500] text-[#6B5E4E] uppercase tracking-[0.04em]"');
  content = content.replace(/className="text-\[10px\] font-\[500\] text-\[#[A-F0-9]+\] uppercase tracking-\[0\.04em\] whitespace-nowrap overflow-hidden text-ellipsis"/g, 'className="stat-label font-[500] text-[#6B5E4E] uppercase tracking-[0.04em] whitespace-nowrap overflow-hidden text-ellipsis"');
  content = content.replace(/className="text-\[28px\] font-\[700\] text-\[#1A1208\]"/g, 'className="stat-number font-[700] text-[#1A1208]"');
  content = content.replace(/className="text-\[26px\] font-\[700\] text-\[#1A1208\] mt-\[5px\] mb-\[2px\] leading-none"/g, 'className="stat-number font-[700] text-[#1A1208] mt-[5px] mb-[2px] leading-none"');
  content = content.replace(/className="text-\[12px\] text-\[#[A-F0-9]+\]"/g, 'className="stat-title text-[#22C55E]"');
  content = content.replace(/className="text-\[11px\] font-\[500\] text-\[#[A-F0-9]+\]"/g, 'className="stat-title text-[#22C55E]"');
  
  content = content.replace(/className="bg-\[#FFFFFF\] rounded-\[16px\] shadow-\[0_4px_24px_rgba\(0,0,0,0\.08\)\] border-t-\[3px\] border-\[#[A-F0-9]+\] p-\[14px\] flex flex-col gap-2 min-w-0 overflow-hidden relative"/g, 'className="stat-card bg-[#FFFFFF] shadow-[0_4px_24px_rgba(0,0,0,0.08)] border-t-[3px] border-[#3B82F6] flex flex-col gap-2 min-w-0 overflow-hidden relative"');
  content = content.replace(/className="bg-\[#FFFFFF\] rounded-\[16px\] shadow-\[0_4px_24px_rgba\(0,0,0,0\.08\)\] p-\[14px\] min-w-0 overflow-hidden flex justify-between cursor-pointer border-t-\[3px\] border-\[#[A-F0-9]+\]"/g, 'className="stat-card bg-[#FFFFFF] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-[14px] min-w-0 overflow-hidden flex justify-between cursor-pointer border-t-[3px] border-[#3B82F6]"');
  content = content.replace(/className="bg-\[#FFFFFF\] rounded-\[16px\] shadow-\[0_4px_24px_rgba\(0,0,0,0\.08\)\] p-\[14px\] min-w-0 overflow-hidden flex justify-between border-t-\[3px\] border-\[#[A-F0-9]+\]"/g, 'className="stat-card bg-[#FFFFFF] shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-[14px] min-w-0 overflow-hidden flex justify-between border-t-[3px] border-[#3B82F6]"');
  
  content = content.replace(/className="w-\[44px\] h-\[44px\] rounded-\[10px\]/g, 'className="stat-icon-circle rounded-[10px]');
  fs.writeFileSync(filePath, content, 'utf8');
}

patchStatCards('src/pages/dashboard/StudentDashboard.tsx');
patchStatCards('src/pages/dashboard/TeacherDashboard.tsx');
patchStatCards('src/pages/dashboard/AdminDashboard.tsx');

// Events + Notices
function patchEventsNotices(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/<section className="flex flex-col lg:flex-row gap-\[14px\] mt-\[16px\] mb-\[16px\] px-4 md:px-6">/g, '<section className="events-notices-grid px-4 md:px-6">');
  content = content.replace(/<section className="grid grid-cols-1 md:grid-cols-2 gap-\[14px\] px-\[20px\] pt-\[16px\] pb-16 md:pb-0">/g, '<section className="events-notices-grid px-[20px] pt-[16px] pb-16 md:pb-0">');
  content = content.replace(/className="flex-1 bg-\[#FFFFFF\] border border-\[#EDE8DF\] rounded-\[12px\] p-\[16px\]"/g, 'className="events-notices-card flex-1 bg-[#FFFFFF] border border-[#EDE8DF] rounded-[12px] p-[16px]"');
  content = content.replace(/className="bg-\[#FFFFFF\] border border-\[#EDE8DF\] rounded-\[12px\] p-\[16px\]"/g, 'className="events-notices-card bg-[#FFFFFF] border border-[#EDE8DF] rounded-[12px] p-[16px]"');
  fs.writeFileSync(filePath, content, 'utf8');
}

patchEventsNotices('src/pages/dashboard/StudentDashboard.tsx');
patchEventsNotices('src/pages/dashboard/TeacherDashboard.tsx');
patchEventsNotices('src/pages/dashboard/AdminDashboard.tsx');

// Subject Overview in StudentDashboard
function patchSubjects() {
  let content = fs.readFileSync('src/pages/dashboard/StudentDashboard.tsx', 'utf8');
  content = content.replace(/<div className="bg-\[#FFFFFF\] border border-\[#EDE8DF\] rounded-\[12px\] p-\[16px\] lg:max-w-\[675px\] lg:mx-auto">/g, '<div className="bg-[#FFFFFF] border border-[#EDE8DF] rounded-[12px] p-[16px] subject-overview-responsive">');
  content = content.replace(/<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">/g, '<div className="subject-grid mt-4">');
  content = content.replace(/<div key=\{i\} className="flex flex-col p-3 border border-\[#EDE8DF\] rounded-\[10px\] bg-\[#FAF7F2\]">/g, '<div key={i} className="subject-card flex flex-col border border-[#EDE8DF] rounded-[10px] bg-[#FAF7F2]">');
  fs.writeFileSync('src/pages/dashboard/StudentDashboard.tsx', content, 'utf8');
}
patchSubjects();

console.log('React components patched.');
