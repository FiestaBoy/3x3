// components/teams/TeamManagementModal.tsx
"use client";

import { useState, useTransition } from 'react';
import { X, UserPlus, Trash2, Crown, User, Calendar, MapPin, Users, Copy, RefreshCw } from 'lucide-react';
import { TeamMember, Tournament, TeamDetails, removeMemberFromTeam, promoteMemberToCaptain, leaveTeam, regenerateJoinCode } from '@/src/lib/db/teamActions';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamDetails: TeamDetails;
  userRole: 'captain' | 'player';
}

export default function TeamManagementModal({ 
  isOpen, 
  onClose, 
  teamDetails,
  userRole 
}: TeamManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'tournaments'>('members');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Debug logging
  console.log('TeamManagementModal props:', { teamDetails, userRole, isOpen });

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    
    startTransition(async () => {
      const result = await removeMemberFromTeam(teamDetails.id, memberId);
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    });
  };

  const handlePromoteMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to promote this member to captain? You will become a regular player.')) return;
    
    startTransition(async () => {
      const result = await promoteMemberToCaptain(teamDetails.id, memberId);
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    });
  };

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    
    startTransition(async () => {
      const result = await leaveTeam(teamDetails.id);
      if (result.success) {
        showMessage('success', result.message);
        setTimeout(() => onClose(), 1500);
      } else {
        showMessage('error', result.message);
      }
    });
  };

  const handleRegenerateJoinCode = async () => {
    if (!confirm('Are you sure you want to regenerate the join code? The old code will no longer work.')) return;
    
    startTransition(async () => {
      const result = await regenerateJoinCode(teamDetails.id);
      if (result.success) {
        showMessage('success', result.message);
      } else {
        showMessage('error', result.message);
      }
    });
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(teamDetails.joinCode);
      showMessage('success', 'Join code copied to clipboard!');
    } catch (error) {
      showMessage('error', 'Failed to copy join code');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">
            {userRole === 'captain' ? 'Manage Team' : 'Team Details'}
          </h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost" 
            onClick={onClose}
            disabled={isPending}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
            <span>{message.text}</span>
          </div>
        )}

        {/* Team Info */}
        <div className="bg-base-200 p-4 rounded-lg mb-6">
          <h4 className="text-xl font-semibold mb-2">{teamDetails.name}</h4>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="badge badge-outline">Age Group: {teamDetails.ageGroup}</span>
            <span className="badge badge-outline">
              <Users size={14} className="mr-1" />
              {teamDetails.members.length}/{teamDetails.maxMembers} Members
            </span>
            <div className="flex items-center gap-2">
              <span>Join Code: </span>
              <code 
                className="bg-base-300 px-2 py-1 rounded cursor-pointer hover:bg-base-100 flex items-center gap-1"
                onClick={copyJoinCode}
              >
                {teamDetails.joinCode}
                <Copy size={12} />
              </code>
              {userRole === 'captain' && (
                <button 
                  className="btn btn-xs btn-outline"
                  onClick={handleRegenerateJoinCode}
                  disabled={isPending}
                >
                  <RefreshCw size={12} />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <button 
            className={`tab ${activeTab === 'members' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            Team Members ({teamDetails.members.length})
          </button>
          <button 
            className={`tab ${activeTab === 'tournaments' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            Tournaments ({teamDetails.tournaments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'members' ? (
          <MembersTab 
            members={teamDetails.members}
            userRole={userRole}
            onRemoveMember={handleRemoveMember}
            onPromoteMember={handlePromoteMember}
            isPending={isPending}
          />
        ) : (
          <TournamentsTab tournaments={teamDetails.tournaments} />
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          {userRole === 'player' && (
            <button 
              className="btn btn-error btn-outline"
              onClick={handleLeaveTeam}
              disabled={isPending}
            >
              {isPending ? <span className="loading loading-spinner loading-sm"></span> : null}
              Leave Team
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose} disabled={isPending}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// MembersTab component
interface MembersTabProps {
  members: TeamMember[];
  userRole: 'captain' | 'player';
  onRemoveMember: (memberId: number) => void;
  onPromoteMember: (memberId: number) => void;
  isPending: boolean;
}

function MembersTab({ members, userRole, onRemoveMember, onPromoteMember, isPending }: MembersTabProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div 
          key={member.id} 
          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="text-sm">
                  {member.firstName[0]}{member.lastName[0]}
                </span>
              </div>
            </div>
            <div>
              <p className="font-medium">{member.firstName} {member.lastName}</p>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                {member.role === 'captain' ? (
                  <Crown size={14} className="text-yellow-500" />
                ) : (
                  <User size={14} />
                )}
                <span className="capitalize">{member.role}</span>
                <span>•</span>
                <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {userRole === 'captain' && member.role !== 'captain' && (
            <div className="flex gap-2">
              <button 
                className="btn btn-xs btn-outline"
                onClick={() => onPromoteMember(member.id)}
                title="Promote to Captain"
                disabled={isPending}
              >
                <Crown size={14} />
              </button>
              <button 
                className="btn btn-xs btn-error btn-outline"
                onClick={() => onRemoveMember(member.id)}
                title="Remove Member"
                disabled={isPending}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {userRole === 'captain' && (
        <div className="border-2 border-dashed border-base-300 rounded-lg p-4 text-center">
          <UserPlus size={24} className="mx-auto mb-2 text-base-content/50" />
          <p className="text-sm text-base-content/70 mb-2">
            Share your join code to add more members
          </p>
        </div>
      )}
    </div>
  );
}

// TournamentsTab component
interface TournamentsTabProps {
  tournaments: Tournament[];
}

function TournamentsTab({ tournaments }: TournamentsTabProps) {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming': return 'badge-info';
      case 'ongoing': return 'badge-success';
      case 'completed': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  };

  return (
    <div className="space-y-4">
      {tournaments.length === 0 ? (
        <div className="text-center py-8 text-base-content/70">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tournaments registered yet</p>
        </div>
      ) : (
        tournaments.map((tournament) => (
          <div 
            key={tournament.id} 
            className="card bg-base-200 shadow-sm"
          >
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="card-title text-base">{tournament.name}</h5>
                  <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString()} - {' '}
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
                    <MapPin size={14} />
                    <span>{tournament.location}</span>
                  </div>
                </div>
                <span className={`badge ${getStatusColor(tournament.status)} badge-sm`}>
                  {tournament.status}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}