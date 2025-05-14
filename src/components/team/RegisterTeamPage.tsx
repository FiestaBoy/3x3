import InfoSection from "../common/InfoSection";
import RegisterForm from "./RegisterForm";

export default function RegisterTeamPage() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center">
      <InfoSection
        title="Ready to Play?"
        subtitle="Name your squad and claim your court."
      >
        <div className="card w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body flex justify-center items-center">
            <h1 className="text-2xl font-bold mb-3">Team details</h1>
            <RegisterForm/>
          </div>
        </div>
      </InfoSection>
    </div>
  );
}
