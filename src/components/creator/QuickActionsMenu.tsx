import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MessageSquare, 
  DollarSign, 
  Download, 
  Settings,
  Zap,
  Calendar,
  Users
} from "lucide-react";

interface QuickActionsMenuProps {
  onCreatePost: () => void;
  onEditPrice: () => void;
  onExportData: () => void;
  onMessageSubscribers: () => void;
  onViewSettings: () => void;
}

export const QuickActionsMenu = ({
  onCreatePost,
  onEditPrice,
  onExportData,
  onMessageSubscribers,
  onViewSettings,
}: QuickActionsMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" size="default" className="gap-2">
          <Zap className="w-4 h-4" />
          Quick Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Content</DropdownMenuLabel>
        <DropdownMenuItem onClick={onCreatePost} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule Post
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Subscribers</DropdownMenuLabel>
        <DropdownMenuItem onClick={onMessageSubscribers} className="cursor-pointer">
          <MessageSquare className="w-4 h-4 mr-2" />
          Message All Subscribers
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Users className="w-4 h-4 mr-2" />
          View Subscriber List
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        
        <DropdownMenuLabel>Settings</DropdownMenuLabel>
        <DropdownMenuItem onClick={onEditPrice} className="cursor-pointer">
          <DollarSign className="w-4 h-4 mr-2" />
          Update Subscription Price
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportData} className="cursor-pointer">
          <Download className="w-4 h-4 mr-2" />
          Export Analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewSettings} className="cursor-pointer">
          <Settings className="w-4 h-4 mr-2" />
          Dashboard Settings
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
