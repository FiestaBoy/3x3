"use client";

import { loginUser } from "@/src/lib/db/loginUser";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(8, { message: "At least 8 characters" }),
});

export type FormFields = z.infer<typeof schema>;

export default function Form() {
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormFields>({ resolver: zodResolver(schema), mode: "onChange" });

  const router = useRouter();

  const [rootMessage, setRootMessage] = useState<string | null>(null);

  const onSubmit: SubmitHandler<FormFields> = async () => {
    const formValues = getValues();

    const response = await loginUser(formValues);

    if (!response.success) {
      setRootMessage(response.message);
      return;
    }
    router.push("/");
  };

  const formFields: {
    name: keyof FormFields;
    type: string;
    placeholder: string;
  }[] = [
    { name: "email", type: "email", placeholder: "Email" },
    { name: "password", type: "password", placeholder: "Password" },
  ];

  return (
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
        {isSubmitting ? "Submitting..." : "Login"}
      </button>
      {rootMessage && (
        <div className="alert alert-error">
          <span>{rootMessage}</span>
          <button
            className="btn btn-sm btn-ghost ml-2"
            onClick={() => setRootMessage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </form>
  );
}
