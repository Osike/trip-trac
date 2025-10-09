import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Truck, 
  MapPin, 
  BarChart3, 
  Menu,
  Building2,
  Settings,
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
  const [isMaintenanceMobileOpen, setIsMaintenanceMobileOpen] = useState(false);

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'customers', label: 'Customers', icon: Building2 },
    { id: 'trucks', label: 'Trucks', icon: Truck },
    { id: 'trips', label: 'Trips', icon: MapPin },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];
  
  const maintenanceMenuItems = [
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'maintenance-reports', label: 'Reports', icon: ClipboardList },
  ];

  return (
    <nav className="bg-gradient-header border-b border-border/20 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex items-center space-x-3">
            <Truck className="h-7 w-7 text-primary-foreground" />
            <span className="text-2xl font-bold text-primary-foreground">TripTrac</span>
          </div>

          {/* Center: Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                className={cn(
                  "flex items-center space-x-2 transition-all duration-200",
                  currentPage === id 
                    ? "bg-primary-foreground/20 text-primary-foreground font-semibold" 
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
                onClick={() => onPageChange(id)}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Button>
            ))}
            
            {/* Maintenance Dropdown */}
            <div className="relative group">
              <Button
                variant="ghost"
                className={cn(
                  "flex items-center space-x-2 transition-all duration-200",
                  maintenanceMenuItems.some(mi => mi.id === currentPage)
                    ? "bg-primary-foreground/20 text-primary-foreground font-semibold"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <Wrench className="h-4 w-4" />
                <span>Maintenance</span>
                <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
                </svg>
              </Button>
              
              <div className="absolute left-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {maintenanceMenuItems.map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start flex items-center space-x-2 px-4 py-2 rounded-none first:rounded-t-lg last:rounded-b-lg",
                      currentPage === id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-secondary"
                    )}
                    onClick={() => onPageChange(id)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: User Profile & Settings */}
          <div className="hidden lg:flex items-center space-x-3">
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20">
              <img
                src={userProfile?.avatar_url || '/default-avatar.png'}
                alt={userProfile?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-foreground/50"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-foreground">
                  {userProfile?.name || 'Loading...'}
                </span>
                <span className="text-xs text-primary-foreground/60 capitalize">
                  {userProfile?.role || 'User'}
                </span>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onPageChange('settings')}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-border/30 py-4 animate-fade-in">
            {/* Mobile User Profile */}
            <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-primary-foreground/10 rounded-lg border border-primary-foreground/20">
              <img
                src={userProfile?.avatar_url || '/default-avatar.png'}
                alt={userProfile?.name || 'User'}
                className="w-10 h-10 rounded-full object-cover border-2 border-primary-foreground/50"
              />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary-foreground">
                  {userProfile?.name || 'Loading...'}
                </span>
                <span className="text-xs text-primary-foreground/60 capitalize">
                  {userProfile?.role || 'User'}
                </span>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <div className="space-y-1">
              {navigationItems.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start flex items-center space-x-3 px-4 py-3",
                    currentPage === id 
                      ? "bg-primary-foreground/20 text-primary-foreground font-semibold" 
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                  onClick={() => {
                    onPageChange(id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </Button>
              ))}
              
              {/* Mobile Maintenance Dropdown */}
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start flex items-center space-x-3 px-4 py-3",
                    maintenanceMenuItems.some(mi => mi.id === currentPage)
                      ? "bg-primary-foreground/20 text-primary-foreground font-semibold"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                  onClick={() => setIsMaintenanceMobileOpen(!isMaintenanceMobileOpen)}
                >
                  <Wrench className="h-5 w-5" />
                  <span>Maintenance</span>
                  <svg 
                    className={cn("ml-auto h-4 w-4 transition-transform", isMaintenanceMobileOpen && "rotate-180")} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
                  </svg>
                </Button>
                
                {isMaintenanceMobileOpen && (
                  <div className="ml-8 mt-1 space-y-1">
                    {maintenanceMenuItems.map(({ id, label, icon: Icon }) => (
                      <Button
                        key={id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start flex items-center space-x-3 px-4 py-2",
                          currentPage === id 
                            ? "bg-primary-foreground/20 text-primary-foreground font-semibold" 
                            : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                        )}
                        onClick={() => {
                          onPageChange(id);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="pt-2 mt-2 border-t border-primary-foreground/20">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start flex items-center space-x-3 px-4 py-3",
                    currentPage === 'settings'
                      ? "bg-primary-foreground/20 text-primary-foreground font-semibold"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                  onClick={() => {
                    onPageChange('settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
