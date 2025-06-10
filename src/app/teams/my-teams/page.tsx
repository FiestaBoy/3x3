import InfoSection from "@/src/components/common/InfoSection";
import TeamGrid from "@/src/components/teams/TeamGrid";

export default function page() {
  return (
    <InfoSection
      title="My Teams"
      subtitle="View and manage all the teams you're part of"
      className="min-h-screen"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <TeamGrid />
      </div>
    </InfoSection>
  );
}
