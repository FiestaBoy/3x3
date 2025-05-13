import Link from "next/link"

export default function WelcomeCard() {
    return (
        <div className="hero bg-base-200 pt-16 md:pt-24">
                <div className="hero-content text-center">
                  <div className="max-w-md">
                    <h1 className="text-4xl sm:text-5xl font-bold">Welcome to 3x3</h1>
                    <p className="py-6 text-lg">
                      Your ultimate platform for organizing and participating in 3x3
                      basketball tournaments.
                    </p>
                    <Link href={"/auth/signup"}>
                      <button className="btn btn-secondary btn-wide">
                        Get Started
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
    )
}