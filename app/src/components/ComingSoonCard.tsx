import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface ComingSoonCardProps {
  title: string;
  description?: string;
}

export const ComingSoonCard = ({ title, description }: ComingSoonCardProps) => {
  return (
    <Card className="border-dashed border-2 border-orange-200 bg-orange-50/30">
      <CardContent className="text-center py-12">
        <Construction className="w-12 h-12 text-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-orange-700 mb-2">{title}</h3>
        <p className="text-sm text-orange-600">
          {description || "Esta funcionalidade está sendo desenvolvida e estará disponível em breve."}
        </p>
        <div className="mt-4 px-4 py-2 bg-orange-100 text-orange-700 text-xs rounded-lg inline-block">
          🚧 Em desenvolvimento
        </div>
      </CardContent>
    </Card>
  );
};