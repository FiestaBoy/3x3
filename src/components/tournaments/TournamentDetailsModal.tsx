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
  AlertCircle,
} from "lucide-react";
import { getCaptainTeamNames } from "@/src/lib/db/helpers";
import { joinPublicTournament } from "@/src/lib/db/tournamentActions";

interface TournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournament: any;
}

export default function TournamentDetailsModal({
  isOpen,
  onClose,
  tournamentId,
  tournament,
}: TournamentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "register">("details");
  const [teams, setTeams] = useState<{ team_id: string; name: string }[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === "register") {
      loadTeams();
    }
  }, [isOpen, activeTab]);

  const loadTeams = async () => {
    try {
      const captainTeams = await getCaptainTeamNames();
      setTeams(captainTeams);
      if (captainTeams.length > 0) {
        setSelectedTeamId(captainTeams[0].team_id);
      }
    } catch (error) {
      console.error("Failed to load teams:", error);
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRegister = async () => {
    if (!selectedTeamId) {
      showMessage("error", "Please select a team");
      return;
    }

    setIsLoading(true);
    try {
      const result = await joinPublicTournament(tournamentId, selectedTeamId);

      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to register team");
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

  const getRegistrationStatus = () => {
    const now = new Date();
    const regStart = new Date(tournament.registration_start);
    const regEnd = new Date(tournament.registration_end);

    if (now < regStart) {
      return { text: "Registration opens soon", color: "badge-info", canRegister: false };
    } else if (now >= regStart && now <= regEnd) {
      return { text: "Registration Open", color: "badge-success", canRegister: true };
    } else {
      return { text: "Registration Closed", color: "badge-error", canRegister: false };
    }
  };

  const formatTournamentFormat = (format: string) => {
    if (!format) return "N/A";
    return format
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const registrationStatus = getRegistrationStatus();

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-2xl mb-2">{tournament.name}</h3>
            <span className={`badge ${registrationStatus.color}`}>
              {registrationStatus.text}
            </span>
          </div>
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

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <button
            className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Tournament Details
          </button>
          <button
            className={`tab ${activeTab === "register" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("register")}
            disabled={!registrationStatus.canRegister}
          >
            Register Team
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" ? (
          <DetailsTab tournament={tournament} formatDate={formatDate} formatDateTime={formatDateTime} formatTournamentFormat={formatTournamentFormat} />
        ) : (
          <RegisterTab
            teams={teams}
            selectedTeamId={selectedTeamId}
            setSelectedTeamId={setSelectedTeamId}
            onRegister={handleRegister}
            isLoading={isLoading}
            tournament={tournament}
          />
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isLoading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface DetailsTabProps {
  tournament: any;
  formatDate: (date: string) => string;
  formatDateTime: (date: string) => string;
  formatTournamentFormat: (format: string) => string;
}

function DetailsTab({ tournament, formatDate, formatDateTime, formatTournamentFormat }: DetailsTabProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {tournament.description && (
        <div>
          <h4 className="font-semibold mb-2">About This Tournament</h4>
          <p className="text-sm text-base-content/70">{tournament.description}</p>
        </div>
      )}

      {/* Key Info Grid */}
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
          label="Teams"
          value={`${tournament.registered_teams || 0} / ${tournament.max_teams}`}
        />
      </div>

      {/* Registration Period */}
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

      {/* Venue Details */}
      {tournament.venue_details && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Venue Information</h4>
          <p className="text-sm text-base-content/70">{tournament.venue_details}</p>
        </div>
      )}

      {/* Contact Info */}
      {(tournament.contact_email || tournament.contact_phone) && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Contact Organizer</h4>
          <div className="space-y-2">
            {tournament.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={16} className="text-base-content/70" />
                <a href={`mailto:${tournament.contact_email}`} className="link link-primary">
                  {tournament.contact_email}
                </a>
              </div>
            )}
            {tournament.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={16} className="text-base-content/70" />
                <a href={`tel:${tournament.contact_phone}`} className="link link-primary">
                  {tournament.contact_phone}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
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
      <p className="font-semibold">{value}</p>
      {subtitle && <p className="text-xs text-base-content/70 mt-1">{subtitle}</p>}
    </div>
  );
}

interface RegisterTabProps {
  teams: { team_id: string; name: string }[];
  selectedTeamId: string;
  setSelectedTeamId: (id: string) => void;
  onRegister: () => void;
  isLoading: boolean;
  tournament: any;
}

function RegisterTab({
  teams,
  selectedTeamId,
  setSelectedTeamId,
  onRegister,
  isLoading,
  tournament,
}: RegisterTabProps) {
  const spotsLeft = tournament.max_teams - (tournament.registered_teams || 0);

  return (
    <div className="space-y-6">
      {/* Warning/Info Alert */}
      <div className="alert alert-info">
        <AlertCircle size={20} />
        <div>
          <h4 className="font-semibold">Registration Requirements</h4>
          <ul className="text-sm mt-1 list-disc list-inside">
            <li>You must be the team captain to register</li>
            <li>Your team's age group must match the tournament</li>
            <li>Only {spotsLeft} spots remaining</li>
          </ul>
        </div>
      </div>

      {/* Team Selection */}
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold">Select Your Team</span>
          <span className="label-text-alt">{teams.length} team(s) available</span>
        </label>

        {teams.length > 0 ? (
          <select
            className="select select-bordered w-full focus:select-primary"
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            disabled={isLoading}
          >
            {teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>
                {team.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="bg-base-200 p-6 rounded-lg text-center">
            <Users size={48} className="mx-auto mb-3 text-base-content/50" />
            <p className="font-medium mb-2">No Teams Available</p>
            <p className="text-sm text-base-content/70 mb-4">
              You need to be a team captain to register
            </p>
            <a href="/teams/create" className="btn btn-primary btn-sm">
              Create a Team
            </a>
          </div>
        )}
      </div>

      {/* Register Button */}
      {teams.length > 0 && (
        <button
          className="btn btn-primary w-full"
          onClick={onRegister}
          disabled={isLoading || !selectedTeamId}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Registering...
            </>
          ) : (
            "Register Team for Tournament"
          )}
        </button>
      )}
    </div>
  );
}