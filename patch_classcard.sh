sed -i 's/export function ClassCard({ schoolClass }: ClassCardProps) {/export const ClassCard: React.FC<ClassCardProps> = ({ schoolClass }) => {/' src/components/classes/ClassCard.tsx
