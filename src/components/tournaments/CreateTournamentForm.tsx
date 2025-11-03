"use client";

import { createTournament } from "@/src/lib/db/tournamentActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    name: z
      .string()
      .min(3, { message: "Tournament name must be at least 3 characters" }),
    description: z.string().optional(),
    startDate: z.string().min(1, { message: "Start date is required" }),
    endDate: z.string().min(1, { message: "End date is required" }),
    registrationStart: z
      .string()
      .min(1, { message: "Registration start is required" }),
    registrationEnd: z
      .string()
      .min(1, { message: "Registration end is required" }),
    location: z.string().min(1, { message: "Location is required" }),
    address: z.string().optional(),
    venueDetails: z.string().optional(),
    ageGroup: z.enum(["U12", "U14", "U16", "U18", "Adult"]),
    maxTeams: z
      .number()
      .min(4, { message: "Minimum 4 teams" })
      .max(64, { message: "Maximum 64 teams" }),
    format: z.enum([
      "single_elimination",
      "double_elimination",
      "round_robin",
      "group_stage",
    ]),
    gameDuration: z
      .number()
      .min(5, { message: "Minimum 5 minutes" })
      .max(30, { message: "Maximum 30 minutes" }),
    isPrivate: z.boolean(),
    contactEmail: z
      .string()
      .email({ message: "Invalid email" })
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().optional(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  })
  .refine(
    (data) => new Date(data.registrationStart) < new Date(data.registrationEnd),
    {
      message: "Registration end must be after registration start",
      path: ["registrationEnd"],
    }
  )
  .refine(
    (data) => new Date(data.registrationEnd) <= new Date(data.startDate),
    {
      message: "Registration must close before tournament starts",
      path: ["registrationEnd"],
    }
  );

export type TournamentFormFields = z.infer<typeof schema>;

export default function CreateTournamentForm() {
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormFields>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      ageGroup: "Adult",
      maxTeams: 16,
      isPrivate: false,
      format: "single_elimination",
      gameDuration: 10,
    },
  });

  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const onSubmit: SubmitHandler<TournamentFormFields> = async () => {
    const formValues = getValues();

    const response = await createTournament(formValues);

    if (!response.success) {
      showMessage("error", response.message);
      return;
    }

    showMessage("success", "Tournament created successfully!");
    setTimeout(() => {
      router.push("/tournaments");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center py-8">
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold">
                Create New Tournament
              </h1>
              <p className="text-sm text-muted-foreground mt-2">
                Set up your 3x3 basketball tournament with custom rules and
                schedule
              </p>
            </div>

            {/* Message Alert */}
            {message && (
              <div
                className={`alert ${message.type === "success" ? "alert-success" : "alert-error"} mb-4`}
              >
                <span>{message.text}</span>
              </div>
            )}

            <form
              className="space-y-6"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Basic Information
                </h3>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Tournament Name
                    </span>
                    <span className="label-text-alt text-xs text-muted-foreground">
                      Required
                    </span>
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className={`input input-bordered w-full ${errors.name ? "input-error" : ""} focus:input-primary`}
                    placeholder="e.g., Summer 3x3 Championship"
                  />
                  {errors.name && (
                    <span className="text-xs text-error mt-1">
                      {errors.name?.message}
                    </span>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Description
                    </span>
                    <span className="label-text-alt text-xs text-muted-foreground">
                      Optional
                    </span>
                  </label>
                  <textarea
                    {...register("description")}
                    className={`textarea textarea-bordered w-full ${errors.description ? "textarea-error" : ""} focus:textarea-primary`}
                    placeholder="Describe your tournament, prizes, or special rules..."
                    rows={3}
                  />
                  {errors.description && (
                    <span className="text-xs text-error mt-1">
                      {errors.description?.message}
                    </span>
                  )}
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">Age Group</span>
                  </label>
                  <select
                    {...register("ageGroup")}
                    className={`select select-bordered w-full ${errors.ageGroup ? "select-error" : ""} focus:select-primary`}
                  >
                    <option value="U12">U12 (Under 12)</option>
                    <option value="U14">U14 (Under 14)</option>
                    <option value="U16">U16 (Under 16)</option>
                    <option value="U18">U18 (Under 18)</option>
                    <option value="Adult">Adult</option>
                  </select>
                  {errors.ageGroup && (
                    <span className="text-xs text-error mt-1">
                      {errors.ageGroup?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Schedule
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Tournament Start Date
                      </span>
                    </label>
                    <input
                      {...register("startDate")}
                      type="date"
                      className={`input input-bordered w-full ${errors.startDate ? "input-error" : ""} focus:input-primary`}
                    />
                    {errors.startDate && (
                      <span className="text-xs text-error mt-1">
                        {errors.startDate?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Tournament End Date
                      </span>
                    </label>
                    <input
                      {...register("endDate")}
                      type="date"
                      className={`input input-bordered w-full ${errors.endDate ? "input-error" : ""} focus:input-primary`}
                    />
                    {errors.endDate && (
                      <span className="text-xs text-error mt-1">
                        {errors.endDate?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Registration Opens
                      </span>
                    </label>
                    <input
                      {...register("registrationStart")}
                      type="datetime-local"
                      className={`input input-bordered w-full ${errors.registrationStart ? "input-error" : ""} focus:input-primary`}
                    />
                    {errors.registrationStart && (
                      <span className="text-xs text-error mt-1">
                        {errors.registrationStart?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Registration Closes
                      </span>
                    </label>
                    <input
                      {...register("registrationEnd")}
                      type="datetime-local"
                      className={`input input-bordered w-full ${errors.registrationEnd ? "input-error" : ""} focus:input-primary`}
                    />
                    {errors.registrationEnd && (
                      <span className="text-xs text-error mt-1">
                        {errors.registrationEnd?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Location
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        City/Location
                      </span>
                      <span className="label-text-alt text-xs text-muted-foreground">
                        Required
                      </span>
                    </label>
                    <input
                      {...register("location")}
                      type="text"
                      className={`input input-bordered w-full ${errors.location ? "input-error" : ""} focus:input-primary`}
                      placeholder="e.g., New York, NY"
                    />
                    {errors.location && (
                      <span className="text-xs text-error mt-1">
                        {errors.location?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Venue Address
                      </span>
                      <span className="label-text-alt text-xs text-muted-foreground">
                        Optional
                      </span>
                    </label>
                    <input
                      {...register("address")}
                      type="text"
                      className={`input input-bordered w-full ${errors.address ? "input-error" : ""} focus:input-primary`}
                      placeholder="123 Sports Center Ave"
                    />
                    {errors.address && (
                      <span className="text-xs text-error mt-1">
                        {errors.address?.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Venue Details
                    </span>
                    <span className="label-text-alt text-xs text-muted-foreground">
                      Optional
                    </span>
                  </label>
                  <textarea
                    {...register("venueDetails")}
                    className={`textarea textarea-bordered w-full ${errors.venueDetails ? "textarea-error" : ""} focus:textarea-primary`}
                    placeholder="Parking info, court details, facilities..."
                    rows={2}
                  />
                  {errors.venueDetails && (
                    <span className="text-xs text-error mt-1">
                      {errors.venueDetails?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Tournament Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Tournament Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Max Teams
                      </span>
                    </label>
                    <input
                      {...register("maxTeams", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered w-full ${errors.maxTeams ? "input-error" : ""} focus:input-primary`}
                      placeholder="16"
                      min="4"
                      max="64"
                    />
                    {errors.maxTeams && (
                      <span className="text-xs text-error mt-1">
                        {errors.maxTeams?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">Format</span>
                    </label>
                    <select
                      {...register("format")}
                      className={`select select-bordered w-full ${errors.format ? "select-error" : ""} focus:select-primary`}
                    >
                      <option value="single_elimination">
                        Single Elimination
                      </option>
                      <option value="double_elimination">
                        Double Elimination
                      </option>
                      <option value="round_robin">Round Robin</option>
                      <option value="group_stage">Group Stage</option>
                    </select>
                    {errors.format && (
                      <span className="text-xs text-error mt-1">
                        {errors.format?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Game Duration (min)
                      </span>
                    </label>
                    <input
                      {...register("gameDuration", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered w-full ${errors.gameDuration ? "input-error" : ""} focus:input-primary`}
                      placeholder="10"
                      min="5"
                      max="30"
                    />
                    {errors.gameDuration && (
                      <span className="text-xs text-error mt-1">
                        {errors.gameDuration?.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      {...register("isPrivate")}
                      className="toggle toggle-primary"
                    />
                    <div className="flex flex-col">
                      <span className="label-text font-semibold">
                        Private Tournament
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Only users with a join code can register
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">
                  Contact Information
                  <span className="text-xs font-normal text-muted-foreground ml-2">
                    (Optional)
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">Email</span>
                    </label>
                    <input
                      {...register("contactEmail")}
                      type="email"
                      className={`input input-bordered w-full ${errors.contactEmail ? "input-error" : ""} focus:input-primary`}
                      placeholder="tournament@example.com"
                    />
                    {errors.contactEmail && (
                      <span className="text-xs text-error mt-1">
                        {errors.contactEmail?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text font-semibold">Phone</span>
                    </label>
                    <input
                      {...register("contactPhone")}
                      type="tel"
                      className={`input input-bordered w-full ${errors.contactPhone ? "input-error" : ""} focus:input-primary`}
                      placeholder="(555) 123-4567"
                    />
                    {errors.contactPhone && (
                      <span className="text-xs text-error mt-1">
                        {errors.contactPhone?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-4">
                <button
                  type="submit"
                  className="btn btn-primary w-full max-w-md"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Creating Tournament...
                    </>
                  ) : (
                    "Create Tournament"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}