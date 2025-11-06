import CreateTournamentForm from "@/src/components/tournaments/CreateTournamentForm";
import { Sparkles } from "lucide-react";

export default async function CreateTournamentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Tournament
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Set up your basketball tournament with custom rules and schedules
          </p>
        </div>

        <CreateTournamentForm />
      </div>
    </div>
  );
}
