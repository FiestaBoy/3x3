import JoinForm from "@/src/components/teams/JoinForm";
import { Users, UserPlus } from "lucide-react";

export default function page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UserPlus className="h-12 w-12 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join a Team
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Enter the join code to become part of your squad
          </p>
        </div>
        <div className="card w-full shadow-2xl bg-base-100 border border-base-300 hover:shadow-3xl transition-all">
          <div className="card-body">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-bold text-2xl text-center">
                Enter Join Code
              </h2>
            </div>
            <JoinForm />
          </div>
        </div>
      </div>
    </div>
  );
}
