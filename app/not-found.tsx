import Link from "next/link";

export default function NotFound() {
  return (
    <main className="status">
      <div className="status__card">
        <h1 className="display status__title">Page not found</h1>
        <p className="status__text">The page you&apos;re looking for doesn&apos;t exist.</p>
        <div className="status__actions">
          <Link className="btn-cta btn-cta--md" href="/">
            <span>Go to the workshop page</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
