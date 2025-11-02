"use client";

import { useState } from "react";
import { TeamInfo } from "@/src/lib/db/getMyTeams";
import Button from "../common/Button";
import TeamManagementModal from "./TeamManagementModal";
import { getTeamDetails, TeamDetails } from "@/src/lib/db/teamActions";
import { Users, Copy, Crown, User } from "lucide-react";

export default function TeamCard(team: TeamInfo) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const openModal = async () => {
    setIsModalOpen(true);
    setLoading(true);
    try {
      const details = await getTeamDetails(team.teamId);
      setTeamDetails(details);
    } catch (error) {
      console.error("Error fetching team details:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTeamDetails(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(team.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-200">
        <div className="card-body gap-3">
          <div className="flex items-center justify-between">
            <h3 className="card-title text-lg font-semibold">{team.name}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/60">Join Code:</span>
            <code
              className="bg-base-200 px-2 py-1 rounded text-xs flex items-center gap-1 cursor-pointer hover:bg-base-300"
              onClick={handleCopy}
              title="Copy join code"
            >
              {team.joinCode}
              <Copy size={12} className={copied ? "text-success" : ""} />
              {copied && (
                <span className="text-success text-xs ml-1">Copied!</span>
              )}
            </code>
          </div>
          <Button className="btn-primary w-full mt-2" onClick={openModal}>
            {team.role === "captain" ? "Manage Team" : "View Team"}
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-4xl h-[90vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
              </div>
            ) : teamDetails ? (
              <TeamManagementModal
                isOpen={isModalOpen}
                onClose={closeModal}
                teamDetails={teamDetails}
                userRole={team.role}
                onTeamUpdate={async () => await getTeamDetails(team.teamId)}
              />
            ) : (
              <div className="text-center py-8">
                <p>Failed to load team details</p>
                <button className="btn btn-ghost mt-4" onClick={closeModal}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
