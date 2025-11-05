import ProfilePage from "@/src/components/profile/ProfilePage";
import { getUserProfile } from "@/src/lib/db/userSettings";
import { redirect } from "next/navigation";

export default async function Page() {
  const response = await getUserProfile();

  if (!response.success || !response.user) {
    redirect("/auth/login");
  }

  return <ProfilePage user={response.user} />;
}
