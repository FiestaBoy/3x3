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
} from "lucide-react";
import { getTournamentTeams, regenerateTournamentJoinCode } from "@/src/lib/db/tournamentActions";

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
  const [activeTab, setActiveTab] = useState<"overview" | "teams" | "bracket" | "settings">("overview");
  const [teams, setTeams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [currentJoinCode, setCurrentJoinCode] = useState(tournament.join_code);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl">
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
        <div className="tabs tabs-bordered mb-4">
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
            className={`tab ${activeTab === "bracket" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("bracket")}
          >
            <Trophy size={16} className="mr-2" />
            Bracket & Matches
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
          <OverviewTab tournament={tournament} formatDate={formatDate} formatDateTime={formatDateTime} formatTournamentFormat={formatTournamentFormat} />
        )}

        {activeTab === "teams" && (
          <TeamsTab teams={teams} isLoading={isLoading} />
        )}

        {activeTab === "bracket" && (
          <BracketTab tournament={tournament} />
        )}

        {activeTab === "settings" && (
          <SettingsTab tournament={tournament} />
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
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
}

function TeamsTab({ teams, isLoading }: TeamsTabProps) {
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BracketTabProps {
  tournament: any;
}

function BracketTab({ tournament }: BracketTabProps) {
  const canStartTournament = () => {
    const registeredTeams = tournament.registered_teams || 0;
    return registeredTeams >= 4;
  };

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
          Match scheduling and bracket management will be available here.
        </p>
        <button
          className="btn btn-primary"
          disabled={!canStartTournament()}
        >
          <PlayCircle size={16} />
          Schedule Matches
        </button>
      </div>
    </div>
  );
}

interface SettingsTabProps {
  tournament: any;
}

function SettingsTab({ tournament }: SettingsTabProps) {
  return (
    <div className="space-y-6">
      <div className="alert alert-warning">
        <Settings size={20} />
        <div>
          <h4 className="font-semibold">Tournament Settings</h4>
          <p className="text-sm">
            Tournament settings and management options will be available here.
          </p>
        </div>
      </div>

      <div className="bg-base-200 p-8 rounded-lg text-center">
        <Settings size={48} className="mx-auto mb-4 text-base-content/50" />
        <h4 className="font-semibold mb-2">Settings Coming Soon</h4>
        <p className="text-sm text-base-content/70">
          Edit tournament details, manage registrations, and configure advanced settings.
        </p>
      </div>
    </div>
  );
}