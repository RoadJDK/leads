import { useAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Phone, Mail, Send, MessageSquare } from "lucide-react";

export const AnalyticsDashboard = () => {
  const {
    leadsUploaded,
    phonesFound,
    emailsFound,
    emailsSent,
    repliesReceived,
    isLoading,
  } = useAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="h-4 bg-muted rounded w-20"></div>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="h-8 bg-muted rounded w-12"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const metrics = [
    {
      label: "Leads",
      value: leadsUploaded,
      icon: Upload,
      color: "text-blue-500",
    },
    {
      label: "Telefon",
      value: phonesFound,
      icon: Phone,
      color: "text-green-500",
    },
    {
      label: "E-Mails",
      value: emailsFound,
      icon: Mail,
      color: "text-purple-500",
    },
    {
      label: "Gesendet",
      value: emailsSent,
      icon: Send,
      color: "text-orange-500",
    },
    {
      label: "Antworten",
      value: repliesReceived,
      icon: MessageSquare,
      color: "text-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {metrics.map((metric) => (
        <Card key={metric.label} className="bg-background/60 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <metric.icon className={`h-3.5 w-3.5 ${metric.color}`} />
              {metric.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-4">
            <div className="text-2xl font-bold">{metric.value.toLocaleString("de-DE")}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
