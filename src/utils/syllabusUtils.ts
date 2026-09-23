export interface SyllabusItem {
  id: string;
  classId: string;
  className?: string;
  sectionId?: string;
  section?: string | 'ALL';
  subject: string;
  tags: string[];
}

export function filterAvailableSubjects(
  allSubjects: string[],
  existingSyllabus: SyllabusItem[] = [],
  currentClassId: string,
  currentSectionId: string
): string[] {
  // A subject is "used" if it exists in the syllabus for the specific class AND section
  // OR if it's set for "ALL" sections of that class.
  return allSubjects.filter(sub => {
    return !existingSyllabus.some(s => 
      s.subject === sub && 
      s.classId === currentClassId && 
      (s.sectionId === currentSectionId || s.section === 'ALL' || s.sectionId === 'ALL')
    );
  });
}

export function hasDuplicateSyllabus(
  existingSyllabus: SyllabusItem[] = [],
  subject: string,
  classId: string,
  sectionId: string
): boolean {
  return existingSyllabus.some(s => 
    s.subject === subject && 
    s.classId === classId && 
    (s.sectionId === sectionId || s.sectionId === 'ALL' || s.section === 'ALL')
  );
}

export function groupSyllabusBySubject(syllabus: SyllabusItem[] = []): SyllabusItem[] {
  // If the same subject exists for ALL, prefer the ALL entry.
  const grouped: Record<string, SyllabusItem> = {};
  
  syllabus.forEach(item => {
    const key = `${item.classId}-${item.subject}`;
    if (!grouped[key]) {
      grouped[key] = item;
    } else {
      // If we already have an entry, check if this one is 'ALL'
      if (item.sectionId === 'ALL' || item.section === 'ALL') {
        grouped[key] = item; // override with the ALL card
      }
    }
  });
  
  return Object.values(grouped);
}
