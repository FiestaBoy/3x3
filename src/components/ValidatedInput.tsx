export function ValidatedInput({
  type,
  onChange,
  className = "input validator",
  required,
  placeholder,
  pattern,
  minLength,
  maxLength,
  hints,
  inputRef,
  onInput,
}: {
  type: string;
  onChange?: (input: any) => void;
  className?: string;
  required: boolean;
  placeholder?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  hints?: string[];
  inputRef?: React.Ref<HTMLInputElement>;
  onInput?: React.FormEventHandler<HTMLInputElement>;
}) {
  const handleInput: React.FormEventHandler<HTMLInputElement> = (e) => {
    e.currentTarget.setCustomValidity(""); // clear old custom error
    onInput?.(e); // run any extra input logic
  };

  return (
    <div className="w-70">
      <input
        onInput={handleInput}
        ref={inputRef}
        type={type}
        className={className}
        required={required}
        placeholder={placeholder}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
        onChange={(e) => onChange?.(e.target.value)}
      />
      {hints?.map((hint, i) => (
        <p className="validator-hint mt-0.75 hidden" key={i}>
          {hint}
        </p>
      ))}
    </div>
  );
}
