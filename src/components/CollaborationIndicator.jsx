import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from "@/components/ui/badge";
import { Users, Eye, Edit } from 'lucide-react';

export default function CollaborationIndicator({ contextType, contextId }) {
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: activeUsers = [] } = useQuery({
    queryKey: ['collab-users', contextType, contextId],
    queryFn: async () => {
      const all = await base44.entities.UserActivity.filter({ 
        context_type: contextType, 
        context_id: contextId 
      });
      const now = new Date();
      return all.filter(u => {
        const lastSeen = new Date(u.last_seen || u.updated_date);
        return (now - lastSeen) < 30000 && u.user_email !== currentUser?.email;
      });
    },
    refetchInterval: 20000,
    staleTime: 15000,
    enabled: !!contextId && !!currentUser,
  });

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
      <Users className="w-4 h-4 text-green-600" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-green-900">
          {activeUsers.length} {activeUsers.length === 1 ? 'pessoa' : 'pessoas'} online
        </p>
        <div className="flex flex-wrap gap-1 mt-1">
          {activeUsers.map(user => (
            <Badge key={user.id} variant="outline" className="text-xs">
              {user.action === 'editing' ? <Edit className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
              {user.user_name?.split(' ')[0]}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}