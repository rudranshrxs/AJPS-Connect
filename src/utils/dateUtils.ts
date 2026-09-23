export const getSystemDate = (): Date => {
  const simDate = localStorage.getItem('simulatedDate');
  const simTime = localStorage.getItem('simulatedTime');
  
  if (simDate) {
    if (simTime) {
      // Create a date with both date and time (e.g. '2026-09-18T10:30:00')
      return new Date(`${simDate}T${simTime}:00`);
    }
    return new Date(simDate);
  }
  
  return new Date();
};
