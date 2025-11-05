"use client";

import { useState } from "react";
import HostedTournamentDetailsModal from "./HostedTournamentDetailsModal";

interface Tournament {
  tournament_id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  age_group: string;
  max_teams: number;
  format: string;
  registration_start: string;
  registration_end: string;
  status?: string;
  registered_teams?: number;
  is_private?: boolean;
  join_code?: string;
}

interface HostedTournamentCardProps {
  tournament: Tournament;
}

export default function HostedTournamentCard({ tournament }: HostedTournamentCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = () => {
    const now = new Date();
    const tournamentStart = new Date(tournament.start_date);
    const tournamentEnd = new Date(tournament.end_date);

    if (now < tournamentStart) {
      return <span className="badge badge-info">Upcoming</span>;
    } else if (now >= tournamentStart && now <= tournamentEnd) {
      return <span className="badge badge-success">Live</span>;
    } else {
      return <span className="badge badge-neutral">Completed</span>;
    }
  };

  const formatTournamentFormat = (format: string) => {
    if (!format) return "N/A";
    return format
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-secondary hover:border-secondary/70 h-full">
        <div className="card-body flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <h2 className="card-title text-xl text-secondary">{tournament.name}</h2>
            {getStatusBadge()}
          </div>

          <div className="flex gap-2 flex-wrap">
            {tournament.is_private === 1 && (
              <div className="badge badge-secondary gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Private
              </div>
            )}
            <div className="badge badge-outline badge-lg">Organizer</div>
          </div>

          {tournament.description && (
            <p className="text-sm text-base-content/70 line-clamp-2">
              {tournament.description}
            </p>
          )}

          <div className="space-y-2 text-sm flex-grow">
            <div className="flex items-center gap-2 text-base-content/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="break-words">
                {formatDate(tournament.start_date)} - {formatDate(tournament.end_date)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-base-content/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0 text-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span><strong>{tournament.registered_teams || 0}</strong>/{tournament.max_teams} teams</span>
            </div>
          </div>

          <div className="divider my-0"></div>

          <div className="flex justify-between items-center">
            <span className="badge badge-outline badge-lg whitespace-nowrap">
              {formatTournamentFormat(tournament.format)}
            </span>
            <span className="badge badge-ghost">{tournament.age_group}</span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-secondary w-full shadow-lg hover:shadow-xl transition-all gap-2 mt-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage Tournament
          </button>
        </div>
      </div>

      <HostedTournamentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tournamentId={tournament.tournament_id}
        tournament={tournament}
      />
    </>
  );
}