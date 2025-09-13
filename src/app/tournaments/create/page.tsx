// app/tournaments/create/page.tsx
import CreateTournamentForm from "@/src/components/tournaments/CreateTournamentForm";
import { getUserSession } from "@/src/lib/db/helpers";
import { redirect } from "next/navigation";


export default async function CreateTournamentPage() {
  // Check if user is logged in and has organizer permissions
  try {
    const session = await getUserSession();
    
    // Optional: Check if user has organizer role
    // if (session.role !== 'organizer' && session.role !== 'admin') {
    //   redirect('/tournaments?error=unauthorized');
    // }
    
  } catch (error) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <CreateTournamentForm />
    </div>
  );
}