"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { SubmitHandler, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

const schema = z.object({
  joinCode: z.string(),
  teamId: z.string().min(1),
});

export type FormFields = z.infer<typeof schema>;

type Team = { team_id: string; name: string };
type Props = {
  teams: Team[];
  joinAction: (payload: { joinCode: string; teamId: string }) => Promise<any>;
};

export default function JoinTournamentForm({ teams, joinAction }: Props) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema), mode: "onSubmit" });

  useEffect(() => {
    if (teams && teams.length > 0) {
      setValue("teamId", teams[0].team_id);
    }
  }, [teams, setValue]);

  const onSubmit: SubmitHandler<FormFields> = async () => {
    const { joinCode, teamId } = getValues();

    const response = await joinAction({ joinCode, teamId });

    if (!response?.success) {
      if (response?.field === "team") {
        setError("teamId", { message: response.message });
      } else {
        setError("joinCode", { message: response.message });
      }
      return;
    }

    router.push("/tournaments");
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6 w-full"
    >
      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold text-base">
            Tournament Join Code
          </span>
        </label>

        <input
          {...register("joinCode")}
          aria-label="Tournament Join Code"
          className={`input input-bordered w-full ${errors["joinCode"] ? "input-error" : ""} focus:input-primary transition-all hover:border-primary/50`}
          type="text"
          placeholder="Enter 6-character code"
        />

        {errors["joinCode"] && (
          <span className="text-xs text-error mt-1 font-medium">
            {errors["joinCode"].message}
          </span>
        )}
      </div>

      <div className="form-control w-full">
        <label className="label">
          <span className="label-text font-semibold text-base">
            Select Team
          </span>
        </label>

        <select
          {...register("teamId")}
          className={`select select-bordered w-full ${errors["teamId"] ? "input-error" : ""} focus:input-primary transition-all hover:border-primary/50`}
          defaultValue=""
        >
          <option value="" disabled>
            {teams.length === 0 ? "No teams available" : "Choose a team"}
          </option>
          {teams.map((t) => (
            <option key={t.team_id} value={t.team_id}>
              {t.name}
            </option>
          ))}
        </select>

        {errors["teamId"] && (
          <span className="text-xs text-error mt-1 font-medium">
            {errors["teamId"].message}
          </span>
        )}
      </div>

      <button
        type="submit"
        className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all"
        disabled={isSubmitting || teams.length === 0}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Registering...
          </>
        ) : (
          "Register Team"
        )}
      </button>

      {teams.length === 0 && (
        <div className="alert alert-warning shadow-lg">
          <span>
            You need to create a team first before joining tournaments.
          </span>
        </div>
      )}
    </form>
  );
}
