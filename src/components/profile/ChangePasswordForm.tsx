"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { changePassword } from "@/src/lib/db/users/userSettings";
import { CheckCircle, Lock } from "lucide-react";

const schema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    newPassword: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

type FormFields = z.infer<typeof schema>;

export default function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const onSubmit = async (data: FormFields) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const response = await changePassword({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });

    if (!response.success) {
      if (response.field && response.field !== "root") {
        setError(response.field as keyof FormFields, {
          message: response.message,
        });
      } else {
        setErrorMessage(response.message);
      }
      return;
    }

    setSuccessMessage("Password changed successfully!");
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
      noValidate
    >
      <div className="alert alert-info shadow-lg mb-4">
        <Lock className="w-5 h-5" />
        <span className="text-sm">
          Password must be at least 8 characters long
        </span>
      </div>

      <div className="w-full space-y-1">
        <label className="label">
          <span className="label-text font-semibold">Current Password</span>
        </label>
        <input
          {...register("currentPassword")}
          type="password"
          className={`input input-bordered w-full ${errors.currentPassword && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
          placeholder="Enter current password"
        />
        {errors.currentPassword && (
          <span className="text-xs text-error font-medium block text-left">
            {errors.currentPassword.message}
          </span>
        )}
      </div>

      <div className="w-full space-y-1">
        <label className="label">
          <span className="label-text font-semibold">New Password</span>
        </label>
        <input
          {...register("newPassword")}
          type="password"
          className={`input input-bordered w-full ${errors.newPassword && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
          placeholder="Enter new password"
        />
        {errors.newPassword && (
          <span className="text-xs text-error font-medium block text-left">
            {errors.newPassword.message}
          </span>
        )}
      </div>

      <div className="w-full space-y-1">
        <label className="label">
          <span className="label-text font-semibold">Confirm New Password</span>
        </label>
        <input
          {...register("confirmPassword")}
          type="password"
          className={`input input-bordered w-full ${errors.confirmPassword && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
          placeholder="Confirm new password"
        />
        {errors.confirmPassword && (
          <span className="text-xs text-error font-medium block text-left">
            {errors.confirmPassword.message}
          </span>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success shadow-lg">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error shadow-lg">
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all mt-4"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            Changing password...
          </>
        ) : (
          "Change Password"
        )}
      </button>
    </form>
  );
}
