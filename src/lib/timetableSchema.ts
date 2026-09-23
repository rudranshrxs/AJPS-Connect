/**
 * Timetable Engine & Admin Settings Schema
 * 
 * Yeh file PWA aur Driver App dono ke beech Firebase communication ke liye "Source of Truth" hai.
 * Firebase Database: Firestore
 * 
 * Collection: `admin_settings`
 * Document ID: `timetable_engine`
 */

export interface TimetableEngineData {
  // Morning Shift (School Start)
  assembly_start_time: string; // Format: "HH:mm" (e.g., "08:00")
  first_period_end_time: string; // Format: "HH:mm" (e.g., "09:00")
  
  // Evening Shift (School End)
  school_end_time: string; // Format: "HH:mm" (e.g., "14:00")
  
  // Holidays List
  holidays: {
    date: string; // Format: "YYYY-MM-DD"
    reason: string;
  }[];
  
  // Driver Location Tracking Rules (For reference)
  // - Morning Tracking: (assembly_start_time - 2 hours) TO (first_period_end_time)
  // - Evening Tracking: (school_end_time - 5 minutes) TO (school_end_time + 3 hours)
  // - Tracking is skipped if the current date exists in the `holidays` array.
}

/**
 * Helper function to parse time strings safely
 */
export const parseTime = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
};
