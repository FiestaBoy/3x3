"use client";

import { useState } from "react";
import {
  X,
  UserPlus,
  Trash2,
  Crown,
  User,
  Calendar,
  MapPin,
  Users,
  Copy,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  TeamMember,
  Tournament,
  TeamDetails,
  removeMemberFromTeam,
  promoteMemberToCaptain,
  leaveTeam,
  regenerateJoinCode,
  deleteTeam,
} from "@/src/lib/db/teamActions";
import Link from "next/link";

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamDetails: TeamDetails;
  userRole: "captain" | "player";
  onTeamUpdate?: () => void;
}

export default function TeamManagementModal({
  isOpen,
  onClose,
  teamDetails,
  userRole,
  onTeamUpdate,
}: TeamManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"members" | "tournaments">(
    "members",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [localTeamDetails, setLocalTeamDetails] = useState(teamDetails);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      const result = await removeMemberFromTeam(localTeamDetails.id, memberId);

      if (result.success) {
        setLocalTeamDetails((prev) => ({
          ...prev,
          members: prev.members.filter((member) => member.id !== memberId),
        }));
        showMessage("success", result.message);
        onTeamUpdate?.();
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to remove member");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      const result = await promoteMemberToCaptain(
        localTeamDetails.id,
        memberId,
      );

      if (result.success) {
        setLocalTeamDetails((prev) => ({
          ...prev,
          members: prev.members.map((member) =>
            member.id === memberId
              ? { ...member, role: "captain" as const }
              : member.role === "captain"
                ? { ...member, role: "player" as const }
                : member,
          ),
        }));
        showMessage("success", result.message);
        onTeamUpdate?.();
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to promote member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setIsLoading(true);
    try {
      const result = await leaveTeam(localTeamDetails.id);

      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => {
          onClose();
          onTeamUpdate?.();
        }, 1500);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to leave team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    setIsLoading(true);
    try {
      const result = await deleteTeam(localTeamDetails.id);

      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => {
          onClose();
          onTeamUpdate?.();
        }, 1500);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to delete team");
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRegenerateJoinCode = async () => {
    setIsLoading(true);
    try {
      const result = await regenerateJoinCode(localTeamDetails.id);

      if (result.success && result.joinCode) {
        setLocalTeamDetails((prev) => ({
          ...prev,
          joinCode: result.joinCode,
        }));
        showMessage("success", result.message);
        onTeamUpdate?.();
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to regenerate join code");
    } finally {
      setIsLoading(false);
    }
  };

  const copyJoinCode = async () => {
    try {
      await navigator.clipboard.writeText(localTeamDetails.joinCode);
      showMessage("success", "Join code copied to clipboard!");
    } catch (error) {
      showMessage("error", "Failed to copy join code");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">
            {userRole === "captain" ? "Manage Team" : "Team Details"}
          </h3>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Alert */}
        {message && (
          <div
            className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-4`}
          >
            <span>{message.text}</span>
          </div>
        )}

        {/* Team Info */}
        <div className="bg-base-200 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-semibold mb-2">
                {localTeamDetails.name}
              </h4>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="badge badge-outline">
                  Age Group: {localTeamDetails.ageGroup}
                </span>
                <span className="badge badge-outline">
                  <Users size={14} className="mr-1" />
                  {localTeamDetails.members.length}/
                  {localTeamDetails.maxMembers} Members
                </span>
                <div className="flex items-center gap-2">
                  <span>Join Code: </span>
                  <code
                    className="bg-base-300 px-2 py-1 rounded cursor-pointer hover:bg-base-100 flex items-center gap-1"
                    onClick={copyJoinCode}
                  >
                    {localTeamDetails.joinCode}
                    <Copy size={12} />
                  </code>
                  {userRole === "captain" && (
                    <button
                      className="btn btn-xs btn-outline"
                      onClick={handleRegenerateJoinCode}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <RefreshCw size={12} />
                      )}
                      Regenerate
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Delete Team Button */}
            {userRole === "captain" && (
              <button
                className="btn btn-error btn-outline btn-sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isLoading}
              >
                <Trash2 size={16} />
                Delete Team
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <button
            className={`tab ${activeTab === "members" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("members")}
          >
            Team Members ({localTeamDetails.members.length})
          </button>
          <button
            className={`tab ${activeTab === "tournaments" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("tournaments")}
          >
            Tournaments ({localTeamDetails.tournaments.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "members" ? (
          <MembersTab
            members={localTeamDetails.members}
            userRole={userRole}
            onRemoveMember={handleRemoveMember}
            onPromoteMember={handlePromoteMember}
            isLoading={isLoading}
          />
        ) : (
          <TournamentsTab tournaments={localTeamDetails.tournaments} />
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          {userRole === "player" && (
            <button
              className="btn btn-error btn-outline"
              onClick={handleLeaveTeam}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : null}
              Leave Team
            </button>
          )}
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-error" />
              <h3 className="font-bold text-lg">Delete Team</h3>
            </div>
            <p className="py-4">
              Are you sure you want to delete{" "}
              <strong>{localTeamDetails.name}</strong>? This action cannot be
              undone and will:
            </p>
            <ul className="list-disc list-inside text-sm text-base-content/70 mb-4 space-y-1">
              <li>Remove all team members</li>
              <li>Unregister the team from all tournaments</li>
              <li>Permanently delete all team data</li>
            </ul>
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={handleDeleteTeam}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : null}
                Yes, Delete Team
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MembersTabProps {
  members: TeamMember[];
  userRole: "captain" | "player";
  onRemoveMember: (memberId: number) => void;
  onPromoteMember: (memberId: number) => void;
  isLoading: boolean;
}

function MembersTab({
  members,
  userRole,
  onRemoveMember,
  onPromoteMember,
  isLoading,
}: MembersTabProps) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-3 bg-base-200 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium">
                {member.firstName} {member.lastName}
              </p>
              <div className="flex items-center gap-2 text-sm text-base-content/70">
                {member.role === "captain" ? (
                  <Crown size={14} className="text-yellow-500" />
                ) : (
                  <User size={14} />
                )}
                <span className="capitalize">{member.role}</span>
                <span>•</span>
                <span>
                  Joined {new Date(member.joinedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {userRole === "captain" && member.role !== "captain" && (
            <div className="flex gap-2">
              <button
                className="btn btn-xs btn-outline"
                onClick={() => onPromoteMember(member.id)}
                title="Promote to Captain"
                disabled={isLoading}
              >
                <Crown size={14} />
              </button>
              <button
                className="btn btn-xs btn-error btn-outline"
                onClick={() => onRemoveMember(member.id)}
                title="Remove Member"
                disabled={isLoading}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      ))}

      {userRole === "captain" && (
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

interface TournamentsTabProps {
  tournaments: Tournament[];
}

function TournamentsTab({ tournaments }: TournamentsTabProps) {
  const getStatusColor = (status: Tournament["status"]) => {
    switch (status) {
      case "upcoming":
        return "badge-info";
      case "ongoing":
        return "badge-success";
      case "completed":
        return "badge-neutral";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="space-y-4">
      {tournaments.length === 0 ? (
        <div className="text-center py-8 text-base-content/70">
          <Calendar size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tournaments registered yet. <Link className="text-primary" href={"/tournaments"}>Join one!</Link></p>
        </div>
      ) : (
        tournaments.map((tournament) => (
          <div key={tournament.id} className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="card-title text-base">{tournament.name}</h5>
                  <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString()} -{" "}
                      {new Date(tournament.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-base-content/70 mt-1">
                    <MapPin size={14} />
                    <span>{tournament.location}</span>
                  </div>
                </div>
                <span
                  className={`badge ${getStatusColor(tournament.status)} badge-sm`}
                >
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
