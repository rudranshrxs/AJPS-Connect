export const formatClassString = (className: string | undefined, sectionName: string | undefined, format: 'long' | 'short' | 'shorter' = 'long'): string => {
    if (!className) return 'Unknown Class';
    
    // Map Nursery to N
    const displayClass = className.toLowerCase() === 'nursery' ? 'N' : className;

    if (!sectionName) {
        if (format === 'long' || format === 'short') return `Class ${displayClass}`;
        return displayClass;
    }
    
    switch (format) {
        case 'long':
            return `Class ${displayClass} Section ${sectionName}`;
        case 'short':
            return `Class ${displayClass} Section ${sectionName}`;
        case 'shorter':
            return `${displayClass} ${sectionName}`;
        default:
            return `${displayClass} - ${sectionName}`;
    }
};
