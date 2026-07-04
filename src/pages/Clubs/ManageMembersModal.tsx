import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, ChevronLeft, ChevronRight, Users, UserPlus } from 'lucide-react';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberships: any[];
  myRole: string;
  handleAction: (membershipId: number, status: string) => void;
  handleRoleChange: (membershipId: number, newRole: string) => void;
  onAddMemberClick?: () => void;
}

const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ 
  isOpen, onClose, memberships, myRole, handleAction, handleRoleChange, onAddMemberClick 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const approved = memberships.filter(m => m.status === 'approved');

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return approved;
    const query = searchQuery.toLowerCase();
    return approved.filter(m => {
      const nameMatch = m.user?.name?.toLowerCase().includes(query);
      const srnMatch = m.user?.srn?.toLowerCase().includes(query);
      return nameMatch || srnMatch;
    });
  }, [approved, searchQuery]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page if we are out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-border bg-background/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Manage Club Members
            </h2>
            <p className="text-sm text-text-muted mt-1">Total Members: {approved.length}</p>
          </div>
          <div className="flex items-center gap-3">
            {['admin', 'ceo', 'head', 'domain_head'].includes(myRole) && onAddMemberClick && (
              <button
                onClick={onAddMemberClick}
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium flex items-center gap-2 transition-colors focus-visible:outline-none shadow-lg shadow-primary/20 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            )}
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text transition-colors p-2 rounded-lg hover:bg-white/5"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-border shrink-0 bg-surface">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search members by name or SRN..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text placeholder:text-text-muted"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 flex-grow bg-surface">
          {filteredMembers.length === 0 ? (
            <div className="text-center text-text-muted py-12">
              {searchQuery ? 'No members match your search.' : 'No members found.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedMembers.map(m => (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-background border border-border rounded-xl gap-4 hover:border-primary/50 transition-colors">
                  <div>
                    <div className="font-semibold text-text flex items-center gap-2">
                      {m.user ? m.user.name : `User ID: ${m.user_id}`}
                      {['head', 'domain_head'].includes(m.role) && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                          {m.role === 'head' ? 'Club Head' : 'Domain Head'}
                        </span>
                      )}
                    </div>
                    {m.user && (
                      <div className="text-xs text-text-muted mt-1 uppercase tracking-wide">
                        {m.user.srn}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      disabled={myRole === 'domain_head' && ['head', 'domain_head'].includes(m.role)}
                      className="bg-surface border border-border text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary text-text-muted disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="member">Member</option>
                      {(myRole === 'head' || myRole === 'admin') && (
                        <>
                          <option value="domain_head">Domain Head</option>
                          <option value="head">Club Head</option>
                        </>
                      )}
                      {myRole === 'domain_head' && m.role === 'domain_head' && (
                        <option value="domain_head">Domain Head</option>
                      )}
                    </select>

                    {(
                      myRole === 'admin' || 
                      myRole === 'head' || 
                      (myRole === 'domain_head' && !['head', 'domain_head'].includes(m.role))
                    ) && (
                      <button 
                        onClick={() => handleAction(m.id, 'rejected')}
                        className="text-sm text-danger hover:underline font-medium px-2 py-1 rounded-lg hover:bg-danger/10 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border shrink-0 bg-background/50 flex items-center justify-between">
            <div className="text-sm text-text-muted">
              Showing <span className="font-medium text-text">{startIndex + 1}</span> to <span className="font-medium text-text">{Math.min(startIndex + itemsPerPage, filteredMembers.length)}</span> of <span className="font-medium text-text">{filteredMembers.length}</span> members
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border text-text hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-sm font-medium px-4">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border text-text hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMembersModal;
