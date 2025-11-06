import TeamGrid from "@/src/components/teams/TeamGrid";
import { Users, Plus } from "lucide-react";
import Link from "next/link";

export default function page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              My Teams
            </h1>
          </div>
          <p className="text-lg text-base-content/70 mb-6">
            View and manage all the teams you're part of
          </p>

          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/teams/create"
              className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-5 w-5" />
              Create Team
            </Link>
            <Link
              href="/teams/join"
              className="btn btn-outline btn-secondary gap-2 hover:shadow-lg transition-all"
            >
              <Users className="h-5 w-5" />
              Join Team
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <TeamGrid />
        </div>
      </div>
    </div>
  );
}
