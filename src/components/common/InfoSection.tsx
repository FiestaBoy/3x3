interface InfoSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export default function InfoSection({
  title,
  subtitle,
  children,
  className = "py-12 md:py-16",
  titleClassName = "text-3xl md:text-4xl font-bold text-center mb-4",
  contentClassName = "max-w-4xl mx-auto flex justify-center",
}: InfoSectionProps) {
  return (
    <section className={className}>
      <h2 className={titleClassName}>{title}</h2>
      {subtitle && (
        <p className="text-lg md:text-xl text-center text-base-content/70 mb-8 md:mb-12">
          {subtitle}
        </p>
      )}
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
