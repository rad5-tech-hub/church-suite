import { ReactNode } from 'react';
import { Button } from './ui/button';

interface PageHeaderProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 flex-wrap">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-700">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-700">{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 && <span>/</span>}
            </div>
          ))}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">{title}</h1>
          <p className="text-sm md:text-base text-gray-600 max-w-3xl">{description}</p>
        </div>
        {action && (
          <Button onClick={action.onClick} className="flex-shrink-0 text-sm">
            {action.icon}
            <span className="hidden sm:inline">{action.label}</span>
            <span className="sm:hidden">{action.icon ? '' : action.label}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
