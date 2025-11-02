"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { joinTeam } from "@/src/lib/db/joinTeam";
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
      className="flex flex-col gap-4 w-full"
    >
      <div>
        <input
          {...register("joinCode")}
          className={`input ${errors["joinCode"] && "input-error"} focus:input-primary`}
          type="text"
          placeholder="Join Code"
        />
        {errors["joinCode"] && (
          <span className="text-xs text-error">
            {errors["joinCode"].message}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="btn self-center"
        disabled={isSubmitting || Object.keys(errors).length > 0}
      >
        {isSubmitting ? "Submitting..." : "Join"}
      </button>
    </form>
  );
}
