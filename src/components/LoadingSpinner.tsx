export const LoadingSpinner = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4 animate-fade-in-up">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto glow-pulse"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);
