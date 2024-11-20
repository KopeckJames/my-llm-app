export default function Loading() {
    return (
      <div className="container mx-auto p-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }