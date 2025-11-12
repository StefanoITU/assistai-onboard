import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Decision = "approve" | "reject" | "needs more info";

interface Finding {
  label: string;
  evidence: string;
  confidence: number;
}

interface AnalysisResult {
  decision: Decision;
  summary: string;
  findings: Finding[];
}

const Index = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (!input.trim()) {
      toast({
        title: "Input required",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // TODO: Replace this URL with your actual Relay.app webhook URL
      const webhookUrl = "YOUR_RELAY_WEBHOOK_URL_HERE";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      
      toast({
        title: "Analysis complete",
        description: "Results are ready",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze the input. Please try again.",
        variant: "destructive",
      });
      console.error("Analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDecisionBadgeVariant = (decision: Decision) => {
    switch (decision) {
      case "approve":
        return "success";
      case "reject":
        return "destructive";
      case "needs more info":
        return "warning";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Onboarding Assistant
          </h1>
          <p className="text-muted-foreground">
            Submit your text for AI-powered analysis
          </p>
        </div>

        <Card className="p-6 mb-6 shadow-lg">
          <div className="space-y-4">
            <div>
              <label htmlFor="input" className="text-sm font-medium text-foreground mb-2 block">
                Enter your question or text
              </label>
              <Textarea
                id="input"
                placeholder="Paste your text here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[200px] resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleAnalysis}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Run Analysis"
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                  Decision
                </h2>
                <Badge
                  variant={getDecisionBadgeVariant(result.decision) as any}
                  className="text-sm px-4 py-1.5"
                >
                  {result.decision.toUpperCase()}
                </Badge>
              </div>

              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-2">
                  Summary
                </h2>
                <p className="text-foreground leading-relaxed">
                  {result.summary}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">
                  Findings
                </h2>
                <div className="space-y-3">
                  {result.findings.map((finding, index) => (
                    <Card key={index} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground mb-1">
                            {finding.label}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {finding.evidence}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {(finding.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
