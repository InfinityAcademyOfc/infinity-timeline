import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const GlowButton = ({ children, className, ...props }: ButtonProps) => {
  return (
    <Button
      {...props}
      className={cn(
        "relative overflow-hidden group",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-primary/0 before:via-primary/20 before:to-primary/0",
        "before:translate-x-[-100%] hover:before:translate-x-[100%]",
        "before:transition-transform before:duration-700",
        "shadow-lg hover:shadow-glow",
        "transition-all duration-300",
        className
      )}
    >
      {children}
    </Button>
  );
};
