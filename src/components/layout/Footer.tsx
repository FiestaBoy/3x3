export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-primary to-secondary text-primary-content">
      <div className="footer footer-center p-10">
        <aside>
          <p className="text-2xl font-bold mb-2">3x3</p>
          <p className="text-sm opacity-90">
            Organizing basketball tournaments since {new Date().getFullYear()}
          </p>
          <p className="text-xs opacity-75 mt-2">
            © {new Date().getFullYear()} 3x3 Basketball. All rights reserved.
          </p>
        </aside>
      </div>
    </footer>
  );
}
