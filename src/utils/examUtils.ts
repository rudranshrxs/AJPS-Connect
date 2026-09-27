import { Exam, Datesheet } from '../context/academicContext';
import { getSystemDate } from './dateUtils';

export function getExamStatusText(exam: Exam, allDatesStr: string[], isClassResultPublished: boolean = false): string {
  if (isClassResultPublished || exam.isPublished || exam.status === 'published' || exam.status === 'declared') {
    return 'Result Declared';
  }
  if (!allDatesStr || allDatesStr.length === 0) {
    return 'Upcoming';
  }
  
  const todayStr = getSystemDate().toISOString().split('T')[0];
  const firstDateStr = allDatesStr[0];
  const lastDateStr = allDatesStr[allDatesStr.length - 1];

  if (todayStr < firstDateStr) return 'Upcoming';
  if (todayStr > lastDateStr) return 'Commenced';
  return 'Ongoing';
}
