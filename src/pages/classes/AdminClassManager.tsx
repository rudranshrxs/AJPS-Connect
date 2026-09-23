import React, { useState } from 'react';
import { ClassWindow, SchoolClass, Section } from '../../components/classes/ClassWindow';
import { useSuccess } from '../../context/SuccessContext';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// Re-export types so existing imports (MergeSectionModal, etc.) still work
export type { SchoolClass, Section };

export function AdminClassManager() {
  const { triggerSuccess, triggerError } = useSuccess();

  const handleAddClass = () => {
    const classes: SchoolClass[] = JSON.parse(localStorage.getItem('ajps_classes') || '[]');
    const classNum = classes.length + 1;
    if (classNum > 12) {
      triggerError("Maximum classes reached (12)");
      return;
    }
    const newClass: SchoolClass = {
      id: `Class ${classNum}`,
      className: `Class ${classNum}`,
      sections: [{ id: 'A', name: 'A' }]
    };
    const updated = [...classes, newClass];
    localStorage.setItem('ajps_classes', JSON.stringify(updated));
    triggerSuccess(`Class ${classNum} added successfully.`);
    // ClassWindow will pick up changes via its own loadData
    window.dispatchEvent(new Event('new-notification'));
  };

  return (
    <ErrorBoundary name="AdminClassManager">
      <ClassWindow onAddClass={handleAddClass} />
    </ErrorBoundary>
  );
}
