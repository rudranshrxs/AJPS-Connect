export const formatClassString = (className: string | undefined, sectionName: string | undefined, format: 'long' | 'short' | 'shorter' = 'long'): string => {
    if (!className) return 'Unknown Class';
    if (!sectionName) {
        if (format === 'long' || format === 'short') return `Class ${className}`;
        return className;
    }
    
    // Some sections are stored as just 'A' or 'B', some might be IDs like 's1'.
    // If it's a known format or just a string, we assume sectionName is the human readable part.
    // If a sectionName is missing, we shouldn't show it.
    
    switch (format) {
        case 'long':
            return `Class ${className} Section ${sectionName}`;
        case 'short':
            return `Class ${className} '${sectionName}'`;
        case 'shorter':
            return `${className} - ${sectionName}`;
        default:
            return `${className} - ${sectionName}`;
    }
};
