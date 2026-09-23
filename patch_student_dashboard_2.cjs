const fs = require('fs');
let code = fs.readFileSync('src/pages/dashboard/StudentDashboard.tsx', 'utf8');

const timetableRemoval = `
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-16 md:pb-0">
        <GlassCard className="p-5 bg-white/40 border-white/50">
`;

code = code.replace(/<section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 pb-16 md:pb-0">[\s\S]*?<GlassCard className="p-5 bg-white\/40 border-white\/50">\s*<h4 className="text-\[14px\] font-bold mb-4 text-gray-800 flex items-center gap-2">\s*<Award className="w-4 h-4 text-\[#A05C2B\]" \/>\s*Subject Overview/g, timetableRemoval.trim() + '\n          <h4 className="text-[14px] font-bold mb-4 text-gray-800 flex items-center gap-2">\n            <Award className="w-4 h-4 text-[#A05C2B]" />\n            Subject Overview');

fs.writeFileSync('src/pages/dashboard/StudentDashboard.tsx', code);
