import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCard({ text }: { text: string }) {
  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-wide text-slate-400">
          <FileText className="size-4" />
          Daily Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-slate-300">{text}</p>
      </CardContent>
    </Card>
  );
}
