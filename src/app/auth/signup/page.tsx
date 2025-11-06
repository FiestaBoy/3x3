import { Form } from "../../../components/auth/SignupForm";
import { Trophy, Users } from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-12 w-12 text-secondary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Join 3x3
            </h1>
          </div>
          <p className="text-lg text-base-content/70">
            Create your account to organize tournaments, build teams, and
            compete
          </p>
        </div>
        <div className="card w-full shadow-2xl bg-base-100 border border-base-300 hover:shadow-3xl transition-all">
          <div className="card-body">
            <div className="text-center mb-6">
              <h2 className="font-bold text-2xl">Create Your Account</h2>
            </div>
            <Form />
          </div>
        </div>
      </div>
    </div>
  );
}
