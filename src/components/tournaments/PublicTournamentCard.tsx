"use client";

import { useState } from "react";
import TournamentDetailsModal from "./PublicTournamentDetailsModal";

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
}

interface TournamentCardProps {
  tournament: Tournament;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
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
    const regStart = new Date(tournament.registration_start);
    const regEnd = new Date(tournament.registration_end);
    const tournamentStart = new Date(tournament.start_date);

    if (now < regStart) {
      return <span className="badge badge-info">Coming Soon</span>;
    } else if (now >= regStart && now <= regEnd) {
      return <span className="badge badge-success">Open Registration</span>;
    } else if (now > regEnd && now < tournamentStart) {
      return <span className="badge badge-warning">Registration Closed</span>;
    } else {
      return <span className="badge badge-neutral">In Progress</span>;
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
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 border border-base-300 hover:border-primary/50">
        <div className="card-body gap-3">
          <div className="flex justify-between items-start">
            <h2 className="card-title text-xl">{tournament.name}</h2>
            {getStatusBadge()}
          </div>

          {tournament.description && (
            <p className="text-sm text-base-content/70 line-clamp-2">
              {tournament.description}
            </p>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-base-content/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary flex-shrink-0"
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
                {formatDate(tournament.start_date)} -{" "}
                {formatDate(tournament.end_date)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-base-content/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="truncate">{tournament.location}</span>
            </div>

            <div className="flex items-center gap-2 text-base-content/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-primary flex-shrink-0"
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
              <span>
                {tournament.age_group} •{" "}
                <strong>{tournament.registered_teams || 0}</strong>/
                {tournament.max_teams} teams
              </span>
            </div>
          </div>

          <div className="divider my-0"></div>

          <div className="flex justify-between items-center">
            <span className="badge badge-outline badge-lg">
              {formatTournamentFormat(tournament.format)}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all gap-2 mt-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            View Details
          </button>
        </div>
      </div>

      <TournamentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tournamentId={tournament.tournament_id}
        tournament={tournament}
      />
    </>
  );
}
