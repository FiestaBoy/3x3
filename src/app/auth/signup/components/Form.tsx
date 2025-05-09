"use client";

import { createUser } from "@/src/lib/db/createUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

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
    <div className="w-50">
      <input
        type="checkbox"
        id="success-modal"
        className="modal-toggle"
        checked={showModal}
        readOnly
      />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Success!</h3>
          <p className="py-4">Your account has been created.</p>
          <div className="modal-action">
            <button className="btn" onClick={() => router.push("/auth/login")}>
              Go to Login
            </button>
          </div>
        </div>
      </div>
      <form
        className="flex flex-col gap-4 w-full"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        {formFields.map((field) => (
          <div key={field.name} className="flex flex-col w-full gap-0.75">
            <input
              {...register(field.name)}
              type={field.type}
              className={`input ${errors[field.name] && "input-error"} focus:input-primary`}
              placeholder={field.placeholder}
            />
            {errors[field.name] && (
              <span className="text-xs text-error">
                {errors[field.name]?.message}
              </span>
            )}
          </div>
        ))}
        <button
          type="submit"
          className="btn self-center"
          disabled={isSubmitting || Object.keys(errors).length > 0}
        >
          {isSubmitting ? "Submitting..." : "Sign up"}
        </button>
      </form>
    </div>
  );
}
