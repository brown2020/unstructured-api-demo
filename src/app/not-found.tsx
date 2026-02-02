import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-6xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900">Page not found</h2>
        <p className="text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
