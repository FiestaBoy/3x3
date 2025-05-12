interface FeatureCardProps {
  title: string;
  description: string;
  // You could add an icon prop here if desired, e.g., icon?: React.ReactNode;
}

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl transform transition-all hover:scale-105 duration-300 ease-in-out">
      <div className="card-body items-center text-center">
        {/* Example: {icon && <div className="text-primary text-4xl mb-4">{icon}</div>} */}
        <h3 className="card-title text-xl md:text-2xl font-semibold">
          {title}
        </h3>
        <p className="text-base-content/80">{description}</p>
      </div>
    </div>
  );
}
