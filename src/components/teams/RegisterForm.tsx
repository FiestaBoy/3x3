"use client";

import { createTeam } from "@/src/lib/db/createTeam";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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

  const router = useRouter();

  const onSubmit = async () => {
    console.log(getValues());

    const formValues = getValues();

    const response = await createTeam(formValues);

    console.log(response)

    if (!response) return

    if (!response?.success ) {
      setError(response?.field, {message: response?.message})
    }
  };

  return (
    <form
      className="flex flex-col gap-4 w-full items-center"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="w-72 flex flex-col gap-0.75">
        <input
          {...register("name")}
          type="text"
          className={`input ${errors["name"] && "input-error"} focus:input-primary`}
          placeholder="Team name"
        />
        {errors["name"] && (
          <span className="text-xs text-error">{errors["name"]?.message}</span>
        )}
      </div>
      <div className="w-72 flex flex-col gap-0.75">
        <select
          {...register("ageGroup")}
          className={`select ${errors["ageGroup"] && "input-error"} focus:input-primary`}
          defaultValue={"Select an age group"}
        >
          <option disabled={true}>Select an age group</option>
          <option>U12</option>
          <option>U14</option>
          <option>U16</option>
          <option>Adult</option>
        </select>
        {errors["ageGroup"] && (
          <span className="text-xs text-error">
            {errors["ageGroup"]?.message}
          </span>
        )}
      </div>
      <button
        type="submit"
        className="btn self-center"
        disabled={isSubmitting || Object.keys(errors).length > 0}
      >
        {isSubmitting ? "Submitting..." : "Register"}
      </button>
    </form>
  );
}
