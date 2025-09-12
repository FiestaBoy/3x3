// components/teams/TeamCard.tsx
"use client";

import { useState } from 'react';
import { TeamInfo } from "@/src/lib/db/getMyTeams";
import Button from "../common/Button";
import TeamManagementModal from './TeamManagementModal';
import { getTeamDetails, TeamDetails } from '@/src/lib/db/teamActions';

export default function TeamCard(team: TeamInfo) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const openModal = async () => {
    setIsModalOpen(true);
    setLoading(true);
    
    try {
      const details = await getTeamDetails(team.teamId);
      console.log('=== TEAM CARD DEBUG ===');
      console.log('Team details received:', details);
      console.log('Members in details:', details?.members);
      console.log('Members count:', details?.members?.length);
      console.log('=====================');
      setTeamDetails(details);
    } catch (error) {
      console.error('Error fetching team details:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTeamDetails(null);
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl transform transition-all duration-300 hover:scale-105 ease-in-out">
        <div className="card-body items-center text-center">
          <h3 className="card-title text-xl font-semibold">{team.name}</h3>
          <p className="text-base-content/80">Age Group: {team.ageGroup}</p>
          <p className="text-base-content/80">Your Role: {team.role}</p>
          <p className="text-base-content/80">Join Code: {team.joinCode}</p>
          <Button className="btn btn-primary" onClick={openModal}>
            {team.role === "captain" ? "Manage Team" : "View Team"}
          </Button>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-none h-[90vh] overflow-y-auto">
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