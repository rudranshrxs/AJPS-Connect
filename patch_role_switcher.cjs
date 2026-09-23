const fs = require('fs');
let code = fs.readFileSync('src/components/layout/RoleSwitcher.tsx', 'utf8');

const importReplacement = `import React, { useState, useEffect } from 'react';
import { Search, UserCircle, Shield, GraduationCap, Briefcase, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User, Role } from '../../types';
import { getSystemDate } from '../../utils/dateUtils';
`;
code = code.replace(/import React, \{ useState, useEffect \} from 'react';\n*import \{ Search, UserCircle, Shield, GraduationCap, Briefcase, X, RefreshCw \} from 'lucide-react';\n*import \{ useAuth \} from '\.\.\/\.\.\/context\/AuthContext';\n*import \{ User, Role \} from '\.\.\/\.\.\/types';/, importReplacement.trim());

const searchBoxReplacement = `
              <button
                onClick={handleResetToAdmin}
                className="w-full flex items-center justify-center gap-2 bg-[#1F2937] hover:bg-gray-800 text-white py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors"
              >
                <Shield className="w-4 h-4" /> Reset to Admin
              </button>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search 240+ students and 30+ teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/80 border border-white rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    title="Simulate System Date"
                    defaultValue={getSystemDate().toISOString().split('T')[0]}
                    onChange={(e) => {
                      localStorage.setItem('simulatedDate', e.target.value);
                      window.location.reload();
                    }}
                    className="w-full sm:w-auto bg-white/80 border border-white rounded-2xl px-4 py-3 text-sm font-bold text-[#A05C2B] focus:outline-none focus:ring-2 focus:ring-[#A05C2B]/30 shadow-sm cursor-pointer"
                  />
                </div>
              </div>
`;

code = code.replace(/<button\s*onClick=\{handleResetToAdmin\}[\s\S]*?<\/button>\s*<div className="relative">\s*<Search[\s\S]*?<\/div>/, searchBoxReplacement.trim());

fs.writeFileSync('src/components/layout/RoleSwitcher.tsx', code);
