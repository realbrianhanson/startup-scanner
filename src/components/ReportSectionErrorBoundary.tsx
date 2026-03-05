import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export class ReportSectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Report section error (${this.props.sectionName}):`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="p-6 border-destructive/20 bg-destructive/5">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-medium text-foreground">
                {this.props.sectionName ? `${this.props.sectionName} couldn't be displayed` : "This section couldn't be displayed"}
              </p>
              <p className="text-sm mt-1">Try regenerating the report.</p>
            </div>
          </div>
        </Card>
      );
    }
    return this.props.children;
  }
}
