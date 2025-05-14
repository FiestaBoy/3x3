import { Form } from "../../../components/auth/SignupForm";

export default function Page() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex-col">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Sign up now!</h1>
          <p className="py-6">
            Join 3x3 to create, manage, and participate in tournaments and
            events.
          </p>
        </div>
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body">
            <div className="justify-center items-center flex flex-col">
              <h1 className="font-bold text-2xl mb-3">Enter your details</h1>
              <Form />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
