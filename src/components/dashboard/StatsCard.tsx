interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  isLoading?: boolean;
}

export default function StatsCard({ title, value, description, isLoading = false }: StatsCardProps) {
  return (
    <div className="bg-[#2a2a2a] rounded-lg p-6 shadow-md">
      <h3 className="text-gray-400 text-sm font-medium mb-2">{title}</h3>
      {isLoading ? (
        <div className="h-8 bg-gray-700 animate-pulse rounded w-20"></div>
      ) : (
        <p className="text-white text-2xl font-bold">{value}</p>
      )}
      {description && <p className="text-gray-400 text-xs mt-2">{description}</p>}
    </div>
  );
} 