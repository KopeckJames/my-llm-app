import LiveTranscription from "@/components/LiveTranscription";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Interview Coach</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Practice your interview answers with real-time feedback
          </p>
        </div>
        <LiveTranscription />
      </div>
    </main>
  );
}
