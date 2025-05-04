"use client"

import { useRef, useState } from "react"
import { ValidatedInput } from "@/src/components/ValidatedInput"
import { UserSignup } from "@/src/types/user";

export default function SignupForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [canSubmit, setCanSubmit] = useState(false);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmRef = useRef<HTMLInputElement>(null);

    const [user, setUser] = useState<UserSignup>({
        firstName: '',
        lastName: '',
        birthday: '',
        email: '',
        password: ''
    })
  
    const handleChange = () => {
      if (formRef.current) {
        setCanSubmit(formRef.current.checkValidity());
      }
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      console.log(user)
    };

    const handlePasswordConfirm = () => {
        if (confirmRef.current && passwordRef.current) {
            const doMatch = confirmRef.current.value === passwordRef.current.value
            confirmRef.current.setCustomValidity(doMatch ? "" : "Passwords do not match")
        }
    }

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
          onChange={(e) => {setUser({...user, firstName: e})}}
          placeholder="First Name"
          hints={["Must be 3 to 30 characters", "Only letters"]}
          required={true}
          pattern="[A-Za-z]{3,30}"
          minLength={3}
          maxLength={30}
        />
        <ValidatedInput
          type="text"
          onChange={(e) => {setUser({...user, lastName: e})}}
          placeholder="Last Name"
          hints={["Must be 3 to 30 characters", "Only letters"]}
          required={true}
          pattern="[A-Za-z]{3,30}"
          minLength={3}
          maxLength={30}
        />
        <ValidatedInput
            type="date"
            onChange={(e) => setUser({...user, birthday: e})}
            required
        />
        <ValidatedInput
          type="email"
          onChange={(e) => {setUser({...user, email: e})}}
          placeholder="mail@site.com"
          hints={["Enter a valid email address"]}
          required={true}
        />
        <ValidatedInput
          type="password"
          onChange={(e) => {setUser({...user, password: e})}}
          placeholder="Password"
          hints={[
            "At least 8 characters",
            "At least one number",
            "At least one lowercase letter",
            "At least one uppercase letter",
          ]}
          inputRef={passwordRef}
          required={true}
          pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
          minLength={8}
        />
        <ValidatedInput
          type="password"
          placeholder="Confirm Password"
          hints={[
            "Passwords must match"
          ]}
          inputRef={confirmRef}
          onInput={handlePasswordConfirm}
          required={true}
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className={`btn btn-success mt-4 ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Submit
        </button>
      </form>
    );
}