"use client";

import { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  Trophy,
  Mail,
  Phone,
  Copy,
  Settings,
  PlayCircle,
  RefreshCw,
  Clipboard,
  Save,
  AlertTriangle,
  Trash2,
  Edit3,
  Lock,
  Unlock,
  UserX
} from "lucide-react";
import { getTournamentTeams, regenerateTournamentJoinCode, deleteTournament, updateTournamentSettings, removeTournamentTeam } from "@/src/lib/db/tournamentActions";
import ScheduleMatchesModal from "./ScheduleMatchesModal";
import BracketVisualization from "./BracketVisualization";
import MatchManagement from "./MatchManagement";
import { getTournamentSchedule } from "@/src/lib/db/matchScheduler";
import StandingsDisplay from "./StandingsDisplay";
import { getTournamentStandings } from "@/src/lib/db/tournamentActions";

interface HostedTournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournament: any;
}

export default function HostedTournamentDetailsModal({
  isOpen,
  onClose,
  tournamentId,
  tournament,
}: HostedTournamentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "standings" | "matches" | "bracket" | "settings">("overview");
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentJoinCode, setCurrentJoinCode] = useState(tournament.join_code);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [scheduleGenerated, setScheduleGenerated] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activeTab === "standings") {
      loadStandings();
    }
  }, [isOpen, activeTab, scheduleGenerated]);

  const loadStandings = async () => {
    setIsLoading(true);
    try {
      const result = await getTournamentStandings(tournamentId);
      if (result.success) {
        setStandings(result.standings);
      }
    } catch (error) {
      console.error("Failed to load standings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && (activeTab === "bracket" || activeTab === "matches")) {
      loadMatches();
    }
  }, [isOpen, activeTab, scheduleGenerated]);

  const loadMatches = async () => {
    setIsLoading(true);
    try {
      const result = await getTournamentSchedule(tournamentId);
      if (result.success) {
        setMatches(result.matches);
        setScheduleGenerated(result.matches.length > 0);
      }
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "teams") {
      loadTeams();
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    setCurrentJoinCode(tournament.join_code);
  }, [tournament.join_code]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const result = await getTournamentTeams(tournamentId);
      if (result.success) {
        setTeams(result.teams);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCopyJoinCode = async () => {
    if (currentJoinCode) {
      await navigator.clipboard.writeText(currentJoinCode);
      setCopied(true);
      showMessage("success", "Join code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerateJoinCode = async () => {
    setIsLoading(true);
    try {
      const result = await regenerateTournamentJoinCode(tournamentId);
      if (result.success && result.joinCode) {
        setCurrentJoinCode(result.joinCode);
        showMessage("success", "Join code regenerated successfully!");
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to regenerate join code");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTournamentFormat = (format: string) => {
    if (!format) return "N/A";
    return format
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold text-2xl mb-2">{tournament.name}</h3>
              <div className="flex gap-2">
                {tournament.is_private === 1 && (
                  <span className="badge badge-secondary">Private Tournament</span>
                )}
                <span className="badge badge-outline">Organizer View</span>
              </div>
            </div>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          {/* Join Code for Private Tournaments */}
          {tournament.is_private === 1 && currentJoinCode && (
            <div className="alert mb-4 bg-primary/10 border border-primary">
              <div className="flex-1">
                <div className="text-sm font-semibold mb-2">Tournament Join Code</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-lg font-mono bg-base-100 px-4 py-2 rounded border-2 border-primary">
                    {currentJoinCode}
                  </code>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleCopyJoinCode}
                    disabled={isLoading}
                  >
                    <Copy size={16} />
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={handleRegenerateJoinCode}
                    disabled={isLoading}
                  >
                    <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message Alert */}
          {message && (
            <div
              className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-4`}
            >
              <span>{message.text}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="tabs tabs-bordered mb-4 overflow-x-auto">
            <button
              className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <Calendar size={16} className="mr-2" />
              Overview
            </button>
            <button
              className={`tab ${activeTab === "teams" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("teams")}
            >
              <Users size={16} className="mr-2" />
              Teams ({tournament.registered_teams || 0})
            </button>
            <button
              className={`tab ${activeTab === "standings" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("standings")}
            >
              <Trophy size={16} className="mr-2" />
              Standings
            </button>
            <button
              className={`tab ${activeTab === "matches" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("matches")}
            >
              <Clipboard size={16} className="mr-2" />
              Match Management
            </button>
            <button
              className={`tab ${activeTab === "bracket" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("bracket")}
            >
              <Trophy size={16} className="mr-2" />
              Bracket View
            </button>
            <button
              className={`tab ${activeTab === "settings" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("settings")}
            >
              <Settings size={16} className="mr-2" />
              Settings
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <OverviewTab 
              tournament={tournament} 
              formatDate={formatDate} 
              formatDateTime={formatDateTime} 
              formatTournamentFormat={formatTournamentFormat} 
            />
          )}

          {activeTab === "teams" && (
            <TeamsTab teams={teams} isLoading={isLoading} tournamentId={tournamentId} onUpdate={loadTeams} />
          )}

          {activeTab === "standings" && (
            <StandingsDisplay 
              teams={standings} 
              isLoading={isLoading}
              format={tournament.format}
            />
          )}

          {activeTab === "matches" && (
            <MatchesTab 
              tournament={tournament}
              matches={matches}
              scheduleGenerated={scheduleGenerated}
              onScheduleClick={() => setShowScheduleModal(true)}
              onUpdate={loadMatches}
              isLoading={isLoading}
            />
          )}

          {activeTab === "bracket" && (
            <BracketTab 
              tournament={tournament} 
              matches={matches}
              scheduleGenerated={scheduleGenerated}
              onScheduleClick={() => setShowScheduleModal(true)}
              isLoading={isLoading}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab 
              tournament={tournament} 
              onClose={onClose}
              onUpdate={() => {
                // Reload tournament data
                window.location.reload();
              }}
            />
          )}

          {/* Action Buttons */}
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleMatchesModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          tournamentId={tournamentId}
          tournament={tournament}
          onScheduleGenerated={() => {
            setScheduleGenerated(true);
            loadMatches();
          }}
        />
      )}
    </>
  );
}

interface OverviewTabProps {
  tournament: any;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  formatTournamentFormat: (format: string) => string;
}

function OverviewTab({ tournament, formatDate, formatDateTime, formatTournamentFormat }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {tournament.description && (
        <div>
          <h4 className="font-semibold mb-2">Tournament Description</h4>
          <p className="text-sm text-base-content/70">{tournament.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={<Calendar size={20} />}
          label="Tournament Dates"
          value={`${formatDate(tournament.start_date)} - ${formatDate(tournament.end_date)}`}
        />
        <InfoCard
          icon={<MapPin size={20} />}
          label="Location"
          value={tournament.location}
          subtitle={tournament.address}
        />
        <InfoCard
          icon={<Users size={20} />}
          label="Age Group"
          value={tournament.age_group}
        />
        <InfoCard
          icon={<Trophy size={20} />}
          label="Format"
          value={formatTournamentFormat(tournament.format)}
        />
        <InfoCard
          icon={<Clock size={20} />}
          label="Game Duration"
          value={`${tournament.game_duration} minutes`}
        />
        <InfoCard
          icon={<Users size={20} />}
          label="Teams Registered"
          value={`${tournament.registered_teams || 0} / ${tournament.max_teams}`}
        />
      </div>

      <div className="bg-base-200 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Calendar size={18} />
          Registration Period
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-base-content/70">Opens:</span>
            <span className="font-medium">{formatDateTime(tournament.registration_start)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/70">Closes:</span>
            <span className="font-medium">{formatDateTime(tournament.registration_end)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
}

function InfoCard({ icon, label, value, subtitle }: InfoCardProps) {
  return (
    <div className="bg-base-200 p-4 rounded-lg">
      <div className="flex items-center gap-2 text-base-content/70 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className="font-semibold break-words">{value}</p>
      {subtitle && <p className="text-xs text-base-content/70 mt-1">{subtitle}</p>}
    </div>
  );
}

interface TeamsTabProps {
  teams: any[];
  isLoading: boolean;
  tournamentId: string;
  onUpdate: () => void;
}

function TeamsTab({ teams, isLoading, tournamentId, onUpdate }: TeamsTabProps) {
  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveTeam = async (teamId: string, teamName: string) => {
    if (confirmRemove !== teamId) {
      setConfirmRemove(teamId);
      return;
    }

    setRemovingTeamId(teamId);
    try {
      const result = await removeTournamentTeam(tournamentId, teamId);
      
      if (result.success) {
        showMessage("success", `${teamName} has been removed from the tournament`);
        setConfirmRemove(null);
        onUpdate();
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to remove team");
    } finally {
      setRemovingTeamId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="bg-base-200 p-8 rounded-lg text-center">
        <Users size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">No Teams Registered Yet</h4>
        <p className="text-sm text-base-content/70">
          Teams will appear here once they register for your tournament.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`alert ${
            message.type === "success" ? "alert-success" : "alert-error"
          }`}
        >
          <span>{message.text}</span>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h4 className="font-semibold">Registered Teams</h4>
        <span className="badge badge-lg">{teams.length} Teams</span>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team Name</th>
              <th>Age Group</th>
              <th>Captain</th>
              <th>Members</th>
              <th>Registered</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => (
              <tr key={team.team_id}>
                <td>{index + 1}</td>
                <td className="font-semibold">{team.name}</td>
                <td>
                  <span className="badge badge-outline">{team.age_group}</span>
                </td>
                <td>{team.captain_name}</td>
                <td>{team.member_count || 0}</td>
                <td className="text-sm text-base-content/70">
                  {new Date(team.registered_at).toLocaleDateString()}
                </td>
                <td className="text-right">
                  {confirmRemove === team.team_id ? (
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => setConfirmRemove(null)}
                        disabled={removingTeamId === team.team_id}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => handleRemoveTeam(team.team_id, team.name)}
                        disabled={removingTeamId === team.team_id}
                      >
                        {removingTeamId === team.team_id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <UserX size={12} />
                            Confirm
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-xs btn-ghost btn-error"
                      onClick={() => setConfirmRemove(team.team_id)}
                      disabled={removingTeamId !== null}
                      title="Remove team from tournament"
                    >
                      <UserX size={14} />
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="alert alert-warning">
        <AlertTriangle size={20} />
        <div>
          <p className="text-sm">
            <strong>Note:</strong> Teams can only be removed before they start playing matches.
            Removing a team will cancel all their scheduled games.
          </p>
        </div>
      </div>
    </div>
  );
}

interface MatchesTabProps {
  tournament: any;
  matches: any[];
  scheduleGenerated: boolean;
  onScheduleClick: () => void;
  onUpdate: () => void;
  isLoading: boolean;
}

function MatchesTab({ tournament, matches, scheduleGenerated, onScheduleClick, onUpdate, isLoading }: MatchesTabProps) {
  const canStartTournament = () => {
    const registeredTeams = tournament.registered_teams || 0;
    return registeredTeams >= 4;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!scheduleGenerated) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <PlayCircle size={20} />
          <div>
            <h4 className="font-semibold">Match Scheduling Required</h4>
            <p className="text-sm">
              {canStartTournament()
                ? "Generate the tournament schedule to start managing matches."
                : `Need at least 4 teams to start. Currently: ${tournament.registered_teams || 0} teams.`}
            </p>
          </div>
        </div>

        <div className="bg-base-200 p-8 rounded-lg text-center">
          <Clipboard size={48} className="mx-auto mb-4 text-base-content/50" />
          <h4 className="font-semibold mb-2">Match Management</h4>
          <p className="text-sm text-base-content/70 mb-4">
            Enter match results, track progress, and manage the tournament flow.
          </p>
          <button
            className="btn btn-primary"
            disabled={!canStartTournament()}
            onClick={onScheduleClick}
          >
            <PlayCircle size={16} />
            Generate Schedule
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg">Match Management</h4>
          <p className="text-sm text-base-content/70">
            Enter results to progress the tournament bracket
          </p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={onScheduleClick}>
          <Settings size={16} />
          Regenerate Schedule
        </button>
      </div>

      <MatchManagement matches={matches} onUpdate={onUpdate} />
    </div>
  );
}

interface BracketTabProps {
  tournament: any;
  matches: any[];
  scheduleGenerated: boolean;
  onScheduleClick: () => void;
  isLoading: boolean;
}

function BracketTab({ tournament, matches, scheduleGenerated, onScheduleClick, isLoading }: BracketTabProps) {
  const canStartTournament = () => {
    const registeredTeams = tournament.registered_teams || 0;
    return registeredTeams >= 4;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!scheduleGenerated) {
    return (
      <div className="space-y-6">
        <div className="alert alert-info">
          <PlayCircle size={20} />
          <div>
            <h4 className="font-semibold">Match Scheduling</h4>
            <p className="text-sm">
              {canStartTournament()
                ? "You can now schedule matches and generate the tournament bracket."
                : `Need at least 4 teams to start. Currently: ${tournament.registered_teams || 0} teams.`}
            </p>
          </div>
        </div>

        <div className="bg-base-200 p-8 rounded-lg text-center">
          <Trophy size={48} className="mx-auto mb-4 text-base-content/50" />
          <h4 className="font-semibold mb-2">Tournament Bracket & Match Scheduling</h4>
          <p className="text-sm text-base-content/70 mb-4">
            Generate a complete tournament schedule with automatic bracket creation and time assignments.
          </p>
          <button
            className="btn btn-primary"
            disabled={!canStartTournament()}
            onClick={onScheduleClick}
          >
            <PlayCircle size={16} />
            Schedule Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg">Tournament Bracket</h4>
          <p className="text-sm text-base-content/70">
            Visual representation of the tournament progression
          </p>
        </div>
        <button className="btn btn-sm btn-outline" onClick={onScheduleClick}>
          <Settings size={16} />
          Regenerate
        </button>
      </div>

      <BracketVisualization matches={matches} tournament={tournament} />
    </div>
  );
}

interface SettingsTabProps {
  tournament: any;
  onClose: () => void;
  onUpdate: () => void;
}

function SettingsTab({ tournament, onClose, onUpdate }: SettingsTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: tournament.name || "",
    description: tournament.description || "",
    startDate: tournament.start_date?.split("T")[0] || "",
    endDate: tournament.end_date?.split("T")[0] || "",
    registrationStart: tournament.registration_start?.split("T")[0] || "",
    registrationEnd: tournament.registration_end?.split("T")[0] || "",
    location: tournament.location || "",
    address: tournament.address || "",
    venueDetails: tournament.venue_details || "",
    ageGroup: tournament.age_group || "",
    maxTeams: tournament.max_teams || 8,
    format: tournament.format || "single_elimination",
    gameDuration: tournament.game_duration || 10,
    contactEmail: tournament.contact_email || "",
    contactPhone: tournament.contact_phone || "",
    isPrivate: tournament.is_private === 1,
  });

  const hasSchedule = tournament.registered_teams > 0; // Basic check
  const canEdit = !hasSchedule;

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!canEdit) {
      showMessage("error", "Cannot edit tournament after schedule is generated");
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateTournamentSettings(tournament.tournament_id, formData);

      if (result.success) {
        showMessage("success", result.message);
        setIsEditing(false);
        onUpdate();
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to update tournament settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteTournament(tournament.tournament_id);

      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        showMessage("error", result.message);
        setShowDeleteConfirm(false);
      }
    } catch (error) {
      showMessage("error", "Failed to delete tournament");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: tournament.name || "",
      description: tournament.description || "",
      startDate: tournament.start_date?.split("T")[0] || "",
      endDate: tournament.end_date?.split("T")[0] || "",
      registrationStart: tournament.registration_start?.split("T")[0] || "",
      registrationEnd: tournament.registration_end?.split("T")[0] || "",
      location: tournament.location || "",
      address: tournament.address || "",
      venueDetails: tournament.venue_details || "",
      ageGroup: tournament.age_group || "",
      maxTeams: tournament.max_teams || 8,
      format: tournament.format || "single_elimination",
      gameDuration: tournament.game_duration || 10,
      contactEmail: tournament.contact_email || "",
      contactPhone: tournament.contact_phone || "",
      isPrivate: tournament.is_private === 1,
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-semibold text-lg">Tournament Settings</h4>
          <p className="text-sm text-base-content/70">
            {canEdit
              ? "Modify tournament configuration before generating schedule"
              : "Settings locked after schedule generation"}
          </p>
        </div>
        {!isEditing && canEdit && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={16} />
            Edit Settings
          </button>
        )}
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
        >
          <span>{message.text}</span>
        </div>
      )}

      {/* Lock Warning */}
      {!canEdit && (
        <div className="alert alert-warning">
          <Lock size={20} />
          <div>
            <h4 className="font-semibold">Settings Locked</h4>
            <p className="text-sm">
              Tournament settings cannot be modified after the schedule has been generated
              or teams have registered.
            </p>
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h5 className="card-title text-base flex items-center gap-2">
            <Trophy size={18} />
            Basic Information
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Tournament Name</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">{formData.name}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Age Group</span>
              </label>
              {isEditing ? (
                <select
                  className="select select-bordered"
                  value={formData.ageGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, ageGroup: e.target.value })
                  }
                >
                  <option value="U12">U12</option>
                  <option value="U14">U14</option>
                  <option value="U16">U16</option>
                  <option value="Adult">Adult</option>
                </select>
              ) : (
                <p className="text-sm font-semibold">{formData.ageGroup}</p>
              )}
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              {isEditing ? (
                <textarea
                  className="textarea textarea-bordered h-24"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Tournament description..."
                />
              ) : (
                <p className="text-sm text-base-content/70">
                  {formData.description || "No description"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tournament Format */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h5 className="card-title text-base flex items-center gap-2">
            <Trophy size={18} />
            Tournament Format
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Format Type</span>
              </label>
              {isEditing ? (
                <select
                  className="select select-bordered"
                  value={formData.format}
                  onChange={(e) =>
                    setFormData({ ...formData, format: e.target.value })
                  }
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="double_elimination">Double Elimination</option>
                  <option value="round_robin">Round Robin</option>
                  <option value="group_stage">Group Stage + Knockout</option>
                </select>
              ) : (
                <p className="text-sm font-semibold">
                  {formData.format
                    .split("_")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Max Teams</span>
              </label>
              {isEditing ? (
                <input
                  type="number"
                  className="input input-bordered"
                  value={formData.maxTeams}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxTeams: parseInt(e.target.value) || 8,
                    })
                  }
                  min="4"
                  max="64"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {formData.maxTeams} teams
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Game Duration</span>
              </label>
              {isEditing ? (
                <input
                  type="number"
                  className="input input-bordered"
                  value={formData.gameDuration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gameDuration: parseInt(e.target.value) || 10,
                    })
                  }
                  min="5"
                  max="60"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {formData.gameDuration} minutes
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Privacy</span>
              </label>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={formData.isPrivate}
                    onChange={(e) =>
                      setFormData({ ...formData, isPrivate: e.target.checked })
                    }
                  />
                  <span className="text-sm">
                    {formData.isPrivate ? (
                      <>
                        <Lock size={14} className="inline mr-1" />
                        Private (Requires Join Code)
                      </>
                    ) : (
                      <>
                        <Unlock size={14} className="inline mr-1" />
                        Public
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <p className="text-sm font-semibold">
                  {formData.isPrivate ? (
                    <>
                      <Lock size={14} className="inline mr-1" />
                      Private
                    </>
                  ) : (
                    <>
                      <Unlock size={14} className="inline mr-1" />
                      Public
                    </>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dates & Schedule */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h5 className="card-title text-base flex items-center gap-2">
            <Calendar size={18} />
            Dates & Schedule
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Start Date</span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">
                  {new Date(formData.startDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">End Date</span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">
                  {new Date(formData.endDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Registration Opens
                </span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.registrationStart}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationStart: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">
                  {new Date(formData.registrationStart).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Registration Closes
                </span>
              </label>
              {isEditing ? (
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.registrationEnd}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      registrationEnd: e.target.value,
                    })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">
                  {new Date(formData.registrationEnd).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location & Venue */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h5 className="card-title text-base flex items-center gap-2">
            <MapPin size={18} />
            Location & Venue
          </h5>

          <div className="grid grid-cols-1 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">City/Location</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              ) : (
                <p className="text-sm font-semibold">{formData.location}</p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Venue Address</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Full address"
                />
              ) : (
                <p className="text-sm text-base-content/70">
                  {formData.address || "No address provided"}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Venue Details</span>
              </label>
              {isEditing ? (
                <textarea
                  className="textarea textarea-bordered h-20"
                  value={formData.venueDetails}
                  onChange={(e) =>
                    setFormData({ ...formData, venueDetails: e.target.value })
                  }
                  placeholder="Parking info, directions, etc..."
                />
              ) : (
                <p className="text-sm text-base-content/70">
                  {formData.venueDetails || "No venue details provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h5 className="card-title text-base flex items-center gap-2">
            <Mail size={18} />
            Contact Information
          </h5>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Contact Email</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="organizer@example.com"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {formData.contactEmail || "Not provided"}
                </p>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Contact Phone</span>
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  className="input input-bordered"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                />
              ) : (
                <p className="text-sm font-semibold">
                  {formData.contactPhone || "Not provided"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex gap-2 justify-end">
          <button
            className="btn btn-ghost"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card bg-error/10 border border-error">
        <div className="card-body">
          <h5 className="card-title text-base text-error flex items-center gap-2">
            <AlertTriangle size={18} />
            Danger Zone
          </h5>

          <p className="text-sm text-base-content/70 mb-4">
            Permanently delete this tournament. This action cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              className="btn btn-error btn-sm w-fit"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={!canEdit}
            >
              <Trash2 size={16} />
              Delete Tournament
            </button>
          ) : (
            <div className="space-y-3">
              <div className="alert alert-error">
                <AlertTriangle size={20} />
                <div>
                  <p className="font-semibold">Are you absolutely sure?</p>
                  <p className="text-sm">
                    This will permanently delete the tournament and all associated data.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error btn-sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Yes, Delete Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}