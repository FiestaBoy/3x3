import { ValidatedInput } from "@/src/components/ValidatedInput";

export default function page() {
    return (
        <div className="flex flex-col items-center justify-center gap-4">
            <h1 className="font-bold text-2xl">Sign Up</h1>
            <ValidatedInput type="text" placeholder="First Name" hints={["Must be 3 to 30 characters", "containing only letters"]} required={true} pattern="[A-Za-z]{3,30}"
            minLength={3} maxLength={30}/>
            <ValidatedInput type="text" placeholder="Last Name" hints={["Must be 3 to 30 characters", "containing only letters"]} required={true} pattern="[A-Za-z]{3,30}"
            minLength={3} maxLength={30}/>
            <ValidatedInput type="email" placeholder="mail@site.com" hints={["Enter a valid email address"]} required={true}/>
            <ValidatedInput type="password" placeholder="Password" hints={["Must be more than 8 characters, including", "At least one number", 
            "At least one lowercase letter", "At least one uppercase letter"]} required={true} pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" minLength={8}/>
        </div>
    )
}