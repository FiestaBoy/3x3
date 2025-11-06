"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { updateUserProfile } from "@/src/lib/db/users/userSettings";
import { CheckCircle } from "lucide-react";

const schema = z.object({
  firstName: z
    .string()
    .min(2, { message: "Must be 2 to 50 characters" })
    .max(50, { message: "Must be 2 to 50 characters" }),
  lastName: z
    .string()
    .min(2, { message: "Must be 2 to 50 characters" })
    .max(50, { message: "Must be 2 to 50 characters" }),
  birthday: z.string().refine(
    (val) => {
      const selected = Date.parse(val);
      if (isNaN(selected)) return false;
      const current = Date.now();
      return current > selected;
    },
    {
      message: "Invalid date",
    },
  ),
  email: z.string().email({ message: "Invalid email address" }),
});

type FormFields = z.infer<typeof schema>;

interface EditProfileFormProps {
  user: {
    first_name: string;
    last_name: string;
    birthday: string;
    email: string;
  };
}

export default function EditProfileForm({ user }: EditProfileFormProps) {
  const router = useRouter();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      firstName: user.first_name,
      lastName: user.last_name,
      birthday: user.birthday,
      email: user.email,
    },
  });

  const onSubmit = async (data: FormFields) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    const response = await updateUserProfile(data);

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

    setSuccessMessage("Profile updated successfully!");
    setTimeout(() => {
      router.refresh();
    }, 1500);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-4"
      noValidate
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="w-full space-y-1">
          <label className="label">
            <span className="label-text font-semibold">First Name</span>
          </label>
          <input
            {...register("firstName")}
            type="text"
            className={`input input-bordered w-full ${errors.firstName && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
            placeholder="First name"
          />
          {errors.firstName && (
            <span className="text-xs text-error font-medium block text-left">
              {errors.firstName.message}
            </span>
          )}
        </div>

        <div className="w-full space-y-1">
          <label className="label">
            <span className="label-text font-semibold">Last Name</span>
          </label>
          <input
            {...register("lastName")}
            type="text"
            className={`input input-bordered w-full ${errors.lastName && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
            placeholder="Last name"
          />
          {errors.lastName && (
            <span className="text-xs text-error font-medium block text-left">
              {errors.lastName.message}
            </span>
          )}
        </div>
      </div>

      <div className="w-full space-y-1">
        <label className="label">
          <span className="label-text font-semibold">Email</span>
        </label>
        <input
          {...register("email")}
          type="email"
          className={`input input-bordered w-full ${errors.email && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
          placeholder="Email address"
        />
        {errors.email && (
          <span className="text-xs text-error font-medium block text-left">
            {errors.email.message}
          </span>
        )}
      </div>

      <div className="w-full space-y-1">
        <label className="label">
          <span className="label-text font-semibold">Birthday</span>
        </label>
        <input
          {...register("birthday")}
          type="date"
          className={`input input-bordered w-full ${errors.birthday && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
        />
        {errors.birthday && (
          <span className="text-xs text-error font-medium block text-left">
            {errors.birthday.message}
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
            Saving changes...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
}
