"use client";

import { createTournament } from "@/src/lib/db/tournamentActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../common/Button";

const schema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters" }),
  description: z.string().optional(),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  registrationStart: z.string().min(1, { message: "Registration start is required" }),
  registrationEnd: z.string().min(1, { message: "Registration end is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  address: z.string().optional(),
  venueDetails: z.string().optional(),
  ageGroup: z.enum(["U12", "U14", "U16", "U18", "Adult"]),
  maxTeams: z.number().min(4, { message: "Minimum 4 teams" }).max(64, { message: "Maximum 64 teams" }),
  entryFee: z.number().min(0, { message: "Entry fee cannot be negative" }),
  prizePool: z.number().min(0, { message: "Prize pool cannot be negative" }),
  format: z.enum(["single_elimination", "double_elimination", "round_robin", "group_stage"]),
  gameDuration: z.number().min(5, { message: "Minimum 5 minutes" }).max(30, { message: "Maximum 30 minutes" }),
  contactEmail: z.string().email({ message: "Invalid email" }).optional().or(z.literal("")),
  contactPhone: z.string().optional(),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
).refine(
  (data) => new Date(data.registrationStart) < new Date(data.registrationEnd),
  {
    message: "Registration end must be after registration start",
    path: ["registrationEnd"],
  }
).refine(
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
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TournamentFormFields>({ 
    resolver: zodResolver(schema), 
    mode: "onChange",
    defaultValues: {
      ageGroup: "Adult",
      maxTeams: 16,
      entryFee: 0,
      prizePool: 0,
      format: "single_elimination",
      gameDuration: 10,
    }
  });

  const router = useRouter();
  const [rootMessage, setRootMessage] = useState<string | null>(null);

  const onSubmit: SubmitHandler<TournamentFormFields> = async () => {
    const formValues = getValues();

    const response = await createTournament(formValues);

    if (!response.success) {
      setRootMessage(response.message);
      return;
    }

    router.push("/tournaments");
  };

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-3xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h1 className="text-3xl font-bold text-center mb-8">Create New Tournament</h1>

            <form
              className="space-y-8"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              {/* Tournament Name & Age Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Tournament Name</span>
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    className={`input input-bordered ${errors.name && "input-error"} focus:input-primary`}
                    placeholder="Summer 3x3 Championship"
                  />
                  {errors.name && (
                    <span className="text-xs text-error mt-1">
                      {errors.name?.message}
                    </span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Age Group</span>
                  </label>
                  <select
                    {...register("ageGroup")}
                    className={`select select-bordered ${errors.ageGroup && "select-error"} focus:select-primary`}
                  >
                    <option value="U12">U12</option>
                    <option value="U14">U14</option>
                    <option value="U16">U16</option>
                    <option value="Adult">Adult</option>
                  </select>
                  {errors.ageGroup && (
                    <span className="text-xs text-error mt-1">
                      {errors.ageGroup?.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Schedule</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Tournament Start</span>
                    </label>
                    <input
                      {...register("startDate")}
                      type="date"
                      className={`input input-bordered ${errors.startDate && "input-error"} focus:input-primary`}
                    />
                    {errors.startDate && (
                      <span className="text-xs text-error mt-1">
                        {errors.startDate?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Tournament End</span>
                    </label>
                    <input
                      {...register("endDate")}
                      type="date"
                      className={`input input-bordered ${errors.endDate && "input-error"}  focus:input-primary`}
                    />
                    {errors.endDate && (
                      <span className="text-xs text-error mt-1">
                        {errors.endDate?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Registration Opens</span>
                    </label>
                    <input
                      {...register("registrationStart")}
                      type="datetime-local"
                      className={`input input-bordered ${errors.registrationStart && "input-error"} focus:input-primary`}
                    />
                    {errors.registrationStart && (
                      <span className="text-xs text-error mt-1">
                        {errors.registrationStart?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Registration Closes</span>
                    </label>
                    <input
                      {...register("registrationEnd")}
                      type="datetime-local"
                      className={`input input-bordered ${errors.registrationEnd && "input-error"} focus:input-primary`}
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
                <h3 className="text-lg font-semibold border-b pb-2">Location</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">City/Location</span>
                    </label>
                    <input
                      {...register("location")}
                      type="text"
                      className={`input input-bordered ${errors.location && "input-error"} focus:input-primary`}
                      placeholder="New York, NY"
                    />
                    {errors.location && (
                      <span className="text-xs text-error mt-1">
                        {errors.location?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Venue Address (Optional)</span>
                    </label>
                    <input
                      {...register("address")}
                      type="text"
                      className={`input input-bordered ${errors.address && "input-error"} focus:input-primary`}
                      placeholder="123 Sports Center Ave"
                    />
                    {errors.address && (
                      <span className="text-xs text-error mt-1">
                        {errors.address?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Tournament Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Max Teams</span>
                    </label>
                    <input
                      {...register("maxTeams", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered ${errors.maxTeams && "input-error"} focus:input-primary`}
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

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Format</span>
                    </label>
                    <select
                      {...register("format")}
                      className={`select select-bordered ${errors.format && "select-error"} focus:select-primary`}
                    >
                      <option value="single_elimination">Single Elimination</option>
                      <option value="double_elimination">Double Elimination</option>
                      <option value="round_robin">Round Robin</option>
                      <option value="group_stage">Group Stage</option>
                    </select>
                    {errors.format && (
                      <span className="text-xs text-error mt-1">
                        {errors.format?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Game Duration (min)</span>
                    </label>
                    <input
                      {...register("gameDuration", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered ${errors.gameDuration && "input-error"} focus:input-primary`}
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
              </div>

              {/* Financial */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Fees & Prizes (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Entry Fee ($)</span>
                    </label>
                    <input
                      {...register("entryFee", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered ${errors.entryFee && "input-error"} focus:input-primary`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.entryFee && (
                      <span className="text-xs text-error mt-1">
                        {errors.entryFee?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Prize Pool ($)</span>
                    </label>
                    <input
                      {...register("prizePool", { valueAsNumber: true })}
                      type="number"
                      className={`input input-bordered ${errors.prizePool && "input-error"} focus:input-primary`}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    {errors.prizePool && (
                      <span className="text-xs text-error mt-1">
                        {errors.prizePool?.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Contact Info (Optional)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Email</span>
                    </label>
                    <input
                      {...register("contactEmail")}
                      type="email"
                      className={`input input-bordered ${errors.contactEmail && "input-error"} focus:input-primary`}
                      placeholder="tournament@example.com"
                    />
                    {errors.contactEmail && (
                      <span className="text-xs text-error mt-1">
                        {errors.contactEmail?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Phone</span>
                    </label>
                    <input
                      {...register("contactPhone")}
                      type="tel"
                      className={`input input-bordered ${errors.contactPhone && "input-error"} focus:input-primary`}
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

              {/* Submit */}
              <div className="pt-6 border-t">
                <Button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={isSubmitting || Object.keys(errors).length > 0}
                >
                  {isSubmitting ? "Creating Tournament..." : "Create Tournament"}
                </Button>
                <button
                  
                >
                  
                </button>
              </div>

              {rootMessage && (
                <div className="alert alert-error">
                  <span>{rootMessage}</span>
                  <Button
                    className="btn btn-sm btn-ghost ml-2"
                    onClick={() => setRootMessage(null)}
                  >
                    ✕
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
    
  );
}