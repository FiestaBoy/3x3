export function ValidatedInput({
    type,
    className = "input validator",
    required,
    placeholder,
    pattern,
    minLength,
    maxLength,
    hints
} : {
    type: string;
    className?: string;
    required: boolean;
    placeholder?: string;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    hints: string[];
}) {
    return (
        <div className="w-70">
            <input type={type} className={className} required={required} placeholder={placeholder} 
            pattern={pattern} minLength={minLength} maxLength={maxLength}/>
            {hints.map((hint, i) => (
                <p className="validator-hint mt-0.75 hidden" key={i}>{hint}</p>
            ))}
        </div>
    )
}