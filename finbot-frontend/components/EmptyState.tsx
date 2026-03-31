import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data available",
  description = "Get started by adding some items.",
  actionLabel,
  actionHref,
  onAction,
  icon: Icon
}) => {
  const IconComponent = Icon || PackageOpen;
  
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-card/50">
      <div className="bg-primary/10 p-4 rounded-full mb-4">
        <IconComponent size={32} className="text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6">{description}</p>
      
      {actionLabel && (
        actionHref ? (
          <Link 
            href={actionHref}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} />
            {actionLabel}
          </Link>
        ) : (
          <button 
            onClick={onAction}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={16} />
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
};

export default EmptyState;
