"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { joinTeam } from "@/src/lib/db/teams/joinTeam";
import { useRouter } from "next/navigation";

const schema = z.object({
  joinCode: z.string(),
});

export type FormFields = z.infer<typeof schema>;

export default function JoinForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema), mode: "onSubmit" });

  const onSubmit: SubmitHandler<FormFields> = async () => {
    const formValues = getValues();

    const response = await joinTeam(formValues.joinCode);

    if (!response.success) {
      setError("joinCode", { message: response.message });
      return;
    }

    router.push("/teams/my-teams");
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col w-full items-center justify-center gap-1">
        <input
          {...register("joinCode")}
          className={`input input-bordered ${errors["joinCode"] && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
          type="text"
          placeholder="Enter team join code"
        />
        {errors["joinCode"] && (
          <span className="text-xs text-error font-medium">
            {errors["joinCode"].message}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all"
        disabled={isSubmitting || Object.keys(errors).length > 0}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Joining...
          </>
        ) : (
          "Join Team"
        )}
      </button>
    </form>
  );
}
