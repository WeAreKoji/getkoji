import { ReactNode } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  snapPoints?: number[];
}

export const BottomSheet = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  snapPoints,
}: BottomSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <DrawerContent className={cn("max-h-[90vh]", className)}>
        {(title || description) && (
          <DrawerHeader className="relative text-left">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
            <DrawerClose asChild className="absolute right-4 top-4">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </DrawerHeader>
        )}
        
        <div className="overflow-y-auto px-4 pb-4">{children}</div>
        
        {footer && <DrawerFooter>{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
};
