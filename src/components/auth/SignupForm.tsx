"use client";

import { createUser } from "@/src/lib/db/createUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import Button from "../common/Button";

const schema = z
  .object({
    firstName: z
      .string()
      .min(2, { message: "Must be 2 to 30 characters" })
      .max(30, { message: "Must be 2 to 30 characters" }),
    lastName: z
      .string()
      .min(2, { message: "Must be 2 to 30 characters" })
      .max(30, { message: "Must be 2 to 30 characters" }),
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
    email: z.string().email(),
    password: z.string().min(8, { message: "At least 8 characters" }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type FormFields = z.infer<typeof schema>;

export function Form() {
  const [showModal, setShowModal] = useState<boolean>(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema), mode: "onChange" });

  const onSubmit: SubmitHandler<FormFields> = async () => {
    const formValues = getValues();

    const res = await createUser(formValues);

    if (!res.success) {
      setError(res.field, { message: "Email already in use" });
      return;
    }

    setShowModal(true);
  };

  const formFields: {
    name: keyof FormFields;
    type: string;
    placeholder: string;
  }[] = [
    { name: "firstName", type: "text", placeholder: "First name" },
    { name: "lastName", type: "text", placeholder: "Last name" },
    { name: "birthday", type: "date", placeholder: "Birthday" },
    { name: "email", type: "email", placeholder: "Email" },
    { name: "password", type: "password", placeholder: "Password" },
    {
      name: "confirmPassword",
      type: "password",
      placeholder: "Confirm password",
    },
  ];

  return (
    <>
      <input
        type="checkbox"
        id="success-modal"
        className="modal-toggle"
        checked={showModal}
        readOnly
      />
      <div className="modal">
        <div className="modal-box shadow-2xl border border-success/20">
          <h3 className="font-bold text-2xl text-success mb-2">Success!</h3>
          <p className="py-4 text-base-content/80">Your account has been created successfully. Welcome to 3x3!</p>
          <div className="modal-action">
            <button className="btn btn-primary shadow-lg hover:shadow-xl transition-all" onClick={() => router.push("/auth/login")}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
      <form
        className="w-full space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {formFields.map((field) => (
          <div key={field.name} className="w-full space-y-1">
            <input
              {...register(field.name)}
              type={field.type}
              className={`input input-bordered w-full ${errors[field.name] && "input-error"} focus:input-primary transition-all hover:border-primary/50`}
              placeholder={field.placeholder}
            />
            {errors[field.name] && (
              <span className="text-xs text-error font-medium block text-left">
                {errors[field.name]?.message}
              </span>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="btn btn-primary w-full shadow-lg hover:shadow-xl transition-all mt-2"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>
    </>
  );
}