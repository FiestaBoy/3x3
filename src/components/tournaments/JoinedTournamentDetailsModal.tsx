"use client";

import { useState } from "react";
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
  LogOut,
} from "lucide-react";
import { withdrawFromTournament } from "@/src/lib/db/tournamentActions";

interface JoinedTournamentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
  tournament: any;
}

export default function JoinedTournamentDetailsModal({
  isOpen,
  onClose,
  tournamentId,
  tournament,
}: JoinedTournamentDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "bracket" | "schedule">("details");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw from this tournament? This action cannot be undone.")) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await withdrawFromTournament(tournamentId);

      if (result.success) {
        showMessage("success", result.message);
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1500);
      } else {
        showMessage("error", result.message);
      }
    } catch (error) {
      showMessage("error", "Failed to withdraw from tournament");
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

  const canWithdraw = () => {
    const now = new Date();
    const tournamentStart = new Date(tournament.start_date);
    return now < tournamentStart;
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="font-bold text-2xl mb-2">{tournament.name}</h3>
            {tournament.team_name && (
              <span className="badge badge-primary">Registered as: {tournament.team_name}</span>
            )}
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
            Details
          </button>
          <button
            className={`tab ${activeTab === "bracket" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("bracket")}
          >
            Bracket
          </button>
          <button
            className={`tab ${activeTab === "schedule" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("schedule")}
          >
            Schedule
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <DetailsTab tournament={tournament} formatDate={formatDate} formatDateTime={formatDateTime} formatTournamentFormat={formatTournamentFormat} />
        )}

        {activeTab === "bracket" && (
          <BracketTab />
        )}

        {activeTab === "schedule" && (
          <ScheduleTab />
        )}

        {/* Action Buttons */}
        <div className="modal-action">
          {canWithdraw() && (
            <button 
              className="btn btn-error" 
              onClick={handleWithdraw}
              disabled={isLoading}
            >
              <LogOut size={16} />
              Withdraw Team
            </button>
          )}
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
      {tournament.description && (
        <div>
          <h4 className="font-semibold mb-2">About This Tournament</h4>
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
          label="Teams"
          value={`${tournament.registered_teams || 0} / ${tournament.max_teams}`}
        />
      </div>

      {tournament.venue_details && (
        <div className="bg-base-200 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Venue Information</h4>
          <p className="text-sm text-base-content/70">{tournament.venue_details}</p>
        </div>
      )}

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

function BracketTab() {
  return (
    <div className="bg-base-200 p-8 rounded-lg text-center">
      <Trophy size={48} className="mx-auto mb-4 text-base-content/50" />
      <h4 className="font-semibold mb-2">Tournament Bracket</h4>
      <p className="text-sm text-base-content/70">
        The bracket will be available once the tournament starts and matches are scheduled.
      </p>
    </div>
  );
}

function ScheduleTab() {
  return (
    <div className="bg-base-200 p-8 rounded-lg text-center">
      <Calendar size={48} className="mx-auto mb-4 text-base-content/50" />
      <h4 className="font-semibold mb-2">Match Schedule</h4>
      <p className="text-sm text-base-content/70">
        Your team's match schedule will appear here once matches are scheduled by the organizer.
      </p>
    </div>
  );
}