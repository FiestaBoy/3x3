"use client";

import { createTeam } from "@/src/lib/db/createTeam";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  name: z
    .string()
    .min(2, { message: "Must be 2 to 30 characters" })
    .max(30, { message: "Must be 2 to 30 characters" }),
  ageGroup: z.enum(["U12", "U14", "U16", "Adult"], {
    message: "Select an age group",
  }),
});

export type FormFields = z.infer<typeof schema>;

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema), mode: "onChange" });

  const [rootMessage, setRootMessage] = useState<string | null>(null);

  const router = useRouter();

  const onSubmit = async () => {
    const formValues = getValues();

    const response = await createTeam(formValues);

    if (!response?.success) {
      if (response.field === "root") {
        setRootMessage(response.message);
        return;
      }
      setError(response?.field, { message: response?.message });
      return;
    }

    router.push("/teams/my-teams");
  };

  return (
    <>
      <form
        className="flex flex-col gap-5 w-full"
        noValidate
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex flex-col gap-1">
          <input
            {...register("name")}
            type="text"
            className={`input input-bordered ${errors["name"] && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
            placeholder="Team name"
          />
          {errors["name"] && (
            <span className="text-xs text-error font-medium">
              {errors["name"]?.message}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <select
            {...register("ageGroup")}
            className={`select select-bordered ${errors["ageGroup"] && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
            defaultValue={"Select an age group"}
          >
            <option disabled={true}>Select an age group</option>
            <option>U12</option>
            <option>U14</option>
            <option>U16</option>
            <option>Adult</option>
          </select>
          {errors["ageGroup"] && (
            <span className="text-xs text-error font-medium">
              {errors["ageGroup"]?.message}
            </span>
          )}
        </div>
        <button
          type="submit"
          className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all mt-2"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating team...
            </>
          ) : (
            "Create Team"
          )}
        </button>
      </form>
      {rootMessage && (
        <div className="alert alert-error shadow-lg mt-4">
          <span>{rootMessage}</span>
          <button
            className="btn btn-sm btn-ghost hover:bg-error/20"
            onClick={() => setRootMessage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
