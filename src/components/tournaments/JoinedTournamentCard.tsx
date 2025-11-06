"use client";

import { useState } from "react";
import JoinedTournamentDetailsModal from "./JoinedTournamentDetailsModal";

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
  team_name?: string;
}

interface JoinedTournamentCardProps {
  tournament: Tournament;
}

export default function JoinedTournamentCard({
  tournament,
}: JoinedTournamentCardProps) {
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
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200 border-2 border-primary hover:border-primary/70">
        <div className="card-body gap-3">
          <div className="flex justify-between items-start">
            <h2 className="card-title text-xl text-primary">
              {tournament.name}
            </h2>
            {getStatusBadge()}
          </div>

          {tournament.team_name && (
            <div className="badge badge-primary badge-lg gap-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Registered as: {tournament.team_name}
            </div>
          )}

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
          </div>

          <div className="divider my-0"></div>

          <div className="flex justify-between items-center">
            <span className="badge badge-outline badge-lg">
              {formatTournamentFormat(tournament.format)}
            </span>
            <span className="badge badge-ghost">{tournament.age_group}</span>
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            View Tournament
          </button>
        </div>
      </div>

      <JoinedTournamentDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tournamentId={tournament.tournament_id}
        tournament={tournament}
      />
    </>
  );
}
