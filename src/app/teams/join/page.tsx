import JoinForm from "@/src/components/teams/JoinForm";

export default function page() {
    return (
    <div className="hero min-h-screen bg-base-200">
          <div className="hero-content flex flex-col">
            <div className="text-center">
              <h1 className="text-5xl font-bold">Join a Team</h1>
              <p className="py-6">Enter a join code to become part of your squad</p>
            </div>
            <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
              <div className="card-body">
                <div className="justify-center items-center flex flex-col">
                  <h1 className="font-bold text-2xl mb-3">
                    Enter the code
                  </h1>
                  <JoinForm />
                </div>
              </div>
            </div>
          </div>
        </div>
    )
}
