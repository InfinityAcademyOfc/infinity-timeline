import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const ErrorMessage = ({ error }: { error: Error | string }) => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <Card className="max-w-md border-destructive/50 animate-fade-in-up">
      <CardContent className="pt-6 text-center">
        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
        <h3 className="text-lg font-semibold mb-2">Erro</h3>
        <p className="text-muted-foreground">
          {typeof error === 'string' ? error : error.message}
        </p>
      </CardContent>
    </Card>
  </div>
);
