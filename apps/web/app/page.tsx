import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-950 px-4 text-center transition-colors">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
        Collab Editor
      </h1>
      <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-md">
        Real-time collaborative documents. Write together, instantly.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/register"
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
