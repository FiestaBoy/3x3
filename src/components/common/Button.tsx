type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  priority?: "primary" | "secondary" | "accent" | "ghost" | "link";
  loading?: boolean;
  children: React.ReactNode;
};

export default function Button({
  priority = "primary",
  loading = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn btn-${priority} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <span className="loading loading-spinner"></span>}
      {children}
    </button>
  );
}
