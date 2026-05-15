import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { QUICK_ACTIONS } from '@/lib/ModoVendedor';

export default function QuickActionsBar() {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-2 min-w-max px-1">
        {QUICK_ACTIONS.map(({ label, page, icon, color }) => (
          <Link key={page + label} to={createPageUrl(page)}>
            <div
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl shrink-0 active:opacity-70 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, minWidth: 64 }}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-bold text-center leading-tight" style={{ color }}>{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}