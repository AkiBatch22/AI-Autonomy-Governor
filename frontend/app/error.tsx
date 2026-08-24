"use client";

import {
  AlertTriangle,
  RotateCcw,
} from "lucide-react";


export default function Error({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-8 py-10">

        <section className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">

            <AlertTriangle
              size={22}
              className="text-red-600"
            />

          </div>


          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-gray-900">
            Something went wrong
          </h1>


          <p className="mt-2 text-sm leading-6 text-gray-500">
            Autonomy Governor could not load the
            requested data. This may be caused by a
            temporary backend or database connection
            issue.
          </p>


          {process.env.NODE_ENV ===
            "development" && (

            <div className="mt-5 rounded-lg bg-gray-50 p-4">

              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Development Error
              </p>

              <p className="mt-2 break-words text-sm text-gray-600">
                {error.message}
              </p>

            </div>

          )}


          <button
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >

            <RotateCcw size={16} />

            Try Again

          </button>

        </section>

      </div>

    </main>
  );
}