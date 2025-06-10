import Form from "../../../components/auth/LoginForm";

export default function page() {
  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content flex flex-col">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Login to 3x3</h1>
          <p className="py-6">Welcome back!</p>
        </div>
        <div className="card shrink-0 w-full max-w-sm shadow-2xl bg-base-100">
          <div className="card-body">
            <div className="justify-center items-center flex flex-col">
              <h1 className="font-bold text-2xl mb-3">
                Enter your credentials
              </h1>
              <Form />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
