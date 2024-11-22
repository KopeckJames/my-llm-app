import { ResumeAnalysis } from "@/components/ResumeAnalysis";
import { AudioRecorder } from "@/components/AudioRecorder";
import { Card } from "@/components/ui/card";

export default function AnalysisPage() {
  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Resume Analysis</h1>
      
      {/* Audio Input Section */}
      <section>
        <h2 className="text-xl font-semibold mb-2">Voice Input</h2>
        <p className="text-gray-600 mb-4">
          Record your voice to describe your resume or ask questions about resume analysis.
        </p>
        <AudioRecorder />
      </section>

      {/* Text Input Section */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Text Analysis</h2>
        <p className="text-gray-600 mb-4">
          Upload and analyze your resume in text format.
        </p>
        <Card className="p-4">
          <ResumeAnalysis />
        </Card>
      </section>
    </div>
  );
}
