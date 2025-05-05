"use client";

import { useRef, useState } from "react";
import { ValidatedInput } from "@/src/components/ValidatedInput";
import { UserSignup } from "@/src/types/user";
import { validateUserInput } from "@/src/lib/db/createUser";

type FieldErrors = Record<string, string[]>;

export default function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const birthdayRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserSignup>({
    firstName: "",
    lastName: "",
    birthday: "",
    email: "",
    password: "",
    confirm: "",
  });

  const [canSubmit, setCanSubmit] = useState(false);
  const [backendErrors, setBackendErrors] = useState<FieldErrors>({});

  const handleChange = () => {
    const form = formRef.current;
    if (!form) return;

    // 1. update form-wide validity
    const formValid = form.checkValidity();
    setCanSubmit(formValid);

    // 2. clear per-field customValidity and drop any now-valid backend errors
    const newErrors: FieldErrors = { ...backendErrors };
    const refMap: Record<string, React.RefObject<HTMLInputElement | null>> = {
      firstName: firstNameRef,
      lastName: lastNameRef,
      birthday: birthdayRef,
      email: emailRef,
      password: passwordRef,
      confirm: confirmRef,
    };

    Object.entries(refMap).forEach(([field, ref]) => {
      const input = ref.current;
      if (!input) return;
      input.setCustomValidity(""); // clear old backend message
      if (input.validity.valid) {
        delete newErrors[field]; // remove from errors if now valid
      }
    });

    setBackendErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // clear any prior validity messages
    formRef.current
      ?.querySelectorAll("input")
      .forEach((i) => i.setCustomValidity(""));

    const validationRes = await validateUserInput(user);
    if (!validationRes.success) {
      const fieldErrors = validationRes.fieldErrors ?? {};
      setBackendErrors(fieldErrors);

      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (messages.length) {
          const refMap: Record<
            string,
            React.RefObject<HTMLInputElement | null>
          > = {
            firstName: firstNameRef,
            lastName: lastNameRef,
            birthday: birthdayRef,
            email: emailRef,
            password: passwordRef,
            confirm: confirmRef,
          };
          const ref = refMap[field];
          if (ref?.current) {
            ref.current.setCustomValidity(messages[0]);
          }
        }
      });

      formRef.current?.checkValidity();
      return;
    }

    setBackendErrors({});
    // createUser(user) -  DB function
  };
  const handlePasswordConfirm = () => {
    if (confirmRef.current && passwordRef.current) {
      const match = confirmRef.current.value === passwordRef.current.value;
      confirmRef.current.setCustomValidity(
        match ? "" : "Passwords do not match",
      );
    }
  };
  return (
    <form
      ref={formRef}
      onChange={handleChange}
      onSubmit={handleSubmit}
      className="flex flex-col items-center justify-center gap-4 max-w-md mx-auto p-4"
      noValidate
    >
      <h1 className="font-bold text-2xl">Sign Up</h1>
      <ValidatedInput
        type="text"
        onChange={(v) => setUser({ ...user, firstName: v })}
        placeholder="First Name"
        hints={["Must be 3 to 30 characters", "Only letters"]}
        required
        pattern="[A-Za-z]{3,30}"
        minLength={3}
        maxLength={30}
        inputRef={firstNameRef}
      />
      <ValidatedInput
        type="text"
        onChange={(v) => setUser({ ...user, lastName: v })}
        placeholder="Last Name"
        hints={["Must be 3 to 30 characters", "Only letters"]}
        required
        pattern="[A-Za-z]{3,30}"
        minLength={3}
        maxLength={30}
        inputRef={lastNameRef}
      />
      <ValidatedInput
        type="date"
        onChange={(v) => setUser({ ...user, birthday: v })}
        required
        inputRef={birthdayRef}
      />
      <ValidatedInput
        type="email"
        onChange={(v) => setUser({ ...user, email: v })}
        placeholder="mail@site.com"
        hints={["Enter a valid email address"]}
        required
        inputRef={emailRef}
      />
      <ValidatedInput
        type="password"
        onChange={(v) => setUser({ ...user, password: v })}
        placeholder="Password"
        hints={[
          "At least 8 characters",
          "At least one number",
          "At least one lowercase letter",
          "At least one uppercase letter",
        ]}
        required
        pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
        minLength={8}
        inputRef={passwordRef}
      />
      <ValidatedInput
        type="password"
        onChange={(v) => setUser({ ...user, confirm: v })}
        placeholder="Confirm Password"
        hints={["Passwords must match"]}
        required
        inputRef={confirmRef}
        onInput={handlePasswordConfirm}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className={`btn btn-success mt-4 ${
          !canSubmit ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        Submit
      </button>
    </form>
  );
}
