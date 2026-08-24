export default function Loading() {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-8 py-10">
  
          <div className="animate-pulse">
  
            <div className="h-5 w-32 rounded bg-gray-200" />
  
            <div className="mt-4 h-9 w-80 rounded bg-gray-200" />
  
            <div className="mt-3 h-5 w-52 rounded bg-gray-200" />
  
  
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
  
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-32 rounded-2xl border border-gray-200 bg-white"
                />
              ))}
  
            </div>
  
  
            <div className="mt-8 h-52 rounded-2xl border border-gray-200 bg-white" />
  
            <div className="mt-8 h-72 rounded-2xl border border-gray-200 bg-white" />
  
          </div>
  
        </div>
      </main>
    );
  }