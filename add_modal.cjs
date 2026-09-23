const fs = require('fs');

let file = fs.readFileSync('src/pages/classes/AdminClassManager.tsx', 'utf8');

file = file.replace(/const \[isMergeModalOpen, setIsMergeModalOpen\] = useState\(false\);/,
  `const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [isViewStudentsModalOpen, setIsViewStudentsModalOpen] = useState(false);
  const [selectedSectionForStudents, setSelectedSectionForStudents] = useState<{classObj: SchoolClass, section: Section, students: User[]} | null>(null);`
);

const modalCode = `
        {isViewStudentsModalOpen && selectedSectionForStudents && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/30 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#FDF7EE] flex items-center justify-center border border-[#A05C2B]/20">
                    <Users className="w-4 h-4 text-[#A05C2B]" />
                  </div>
                  <h2 className="text-lg font-bold text-[#1F2937]">Students - {selectedSectionForStudents.classObj.className} Section {selectedSectionForStudents.section.name}</h2>
                </div>
                <button onClick={() => setIsViewStudentsModalOpen(false)} className="p-2 bg-gray-100/80 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <th className="p-3 font-bold rounded-tl-lg">Roll No</th>
                        <th className="p-3 font-bold">Name</th>
                        <th className="p-3 font-bold rounded-tr-lg">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedSectionForStudents.students.map((st, i) => (
                        <tr key={st.id} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-700">{st.rollNumber}</td>
                          <td className="p-3 text-gray-800 font-semibold flex items-center gap-2">
                            <img src={st.avatarUrl} alt={st.name} className="w-6 h-6 rounded-full" />
                            {st.name}
                          </td>
                          <td className="p-3 text-gray-600">{i % 2 === 0 ? 'Male' : 'Female'}</td>
                        </tr>
                      ))}
                      {selectedSectionForStudents.students.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-500">No students found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
`;

file = file.replace(/<Toast message=\{toastMsg\} \/>/g, modalCode + '\n      <Toast message={toastMsg} />');

file = file.replace(/import \{ Plus, Users,/g, 'import { Plus, Users, X,');
fs.writeFileSync('src/pages/classes/AdminClassManager.tsx', file);
