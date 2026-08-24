interface MetricCardProps {
    label: string;
    value: string;
    description?: string;
  }
  
  
  export default function MetricCard({
    label,
    value,
    description,
  }: MetricCardProps) {
  
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
  
        <p className="text-sm font-medium text-gray-500">
          {label}
        </p>
  
        <p className="mt-2 text-3xl font-semibold text-gray-900">
          {value}
        </p>
  
        {description && (
          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        )}
  
      </div>
    );
  }