import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Truck, 
  MapPin, 
  BarChart3, 
  Menu,
  Building2,
  LogOut,
  Settings,
  User,
  FileText,
  Wrench,
  ClipboardList
} from "lucide-react";
import { useState } from "react";

interface Profile {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  role: 'admin' | 'dispatcher' | 'driver';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  avatar_url?: string;
}

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout?: () => void;
  userProfile?: Profile | null;
}

export const Navigation = ({ currentPage, onPageChange, onLogout, userProfile }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'customers', label: 'Customers', icon: Building2 },
    { id: 'trucks', label: 'Trucks', icon: Truck },
    { id: 'trips', label: 'Trips', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'maintenance-reports', label: 'Maintenance Reports', icon: ClipboardList },
  ];

  return (
    <nav className="bg-gradient-header border-b border-border/20 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 w-full">
          {/* Far left: User avatar/name */}
          <div className="hidden md:flex md:items-center md:space-x-3 px-3 py-2">
            <img
              src={userProfile?.avatar_url || '/default-avatar.png'}
              alt={userProfile?.name || 'User'}
              className="w-8 h-8 rounded-full object-cover border-2 border-primary shadow"
            />
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-primary-foreground">
                {userProfile?.name || 'Loading...'}
              </span>
            </div>
          </div>
          {/* Center: Navigation */}
          <div className="hidden md:ml-8 md:flex flex-1 justify-evenly">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={currentPage === id ? "default" : "ghost"}
                className={cn(
                  "flex items-center space-x-2 transition-all duration-300 font-medium",
                  currentPage === id 
                    ? "bg-primary-foreground/20 text-primary-foreground border border-primary-foreground/30 shadow-lg backdrop-blur-sm" 
                    : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
                onClick={() => onPageChange(id)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </Button>
            ))}
          </div>
          {/* Far right: Settings button */}
          <div className="hidden md:flex md:items-center ml-auto">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onPageChange('settings')}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-200"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          </div>


          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border mt-2 pt-1 pb-2 animate-fade-in bg-card rounded-xl shadow-lg mx-2">
            <div className="space-y-2 px-2 py-1">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={currentPage === id ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start flex items-center space-x-3 text-base py-2 rounded-lg",
                    currentPage === id && "bg-gradient-primary text-primary-foreground shadow"
                  )}
                  onClick={() => {
                    onPageChange(id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-semibold">{label}</span>
                </Button>
              ))}
              <div className="pt-2 mt-2 border-t border-border space-y-1">
                <Button variant="ghost" className="w-full justify-start text-base py-2 rounded-lg" onClick={() => { onPageChange('settings'); setIsMobileMenuOpen(false); }}>
                  <Settings className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      
    </nav>
  );
};