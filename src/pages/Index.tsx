import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { UsersManagement } from "@/components/users/UsersManagement";
import { CustomersManagement } from "@/components/customers/CustomersManagement";
import { TrucksManagement } from "@/components/trucks/TrucksManagement";
import { TripsManagement } from "@/components/trips/TripsManagement";
import { ReportsManagement } from "@/components/reports/ReportsManagement";
import { MaintenanceManagement, MaintenanceReports } from "@/components/maintenance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, ArrowRight, Shield, Clock, BarChart3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/logistics-hero.jpg";
import SettingsTab from "@/components/settings/SettingsTab";

const Index = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleLogin = () => {
    navigate("/auth");
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Truck className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    if (!user) {
      return (
        <div className="min-h-screen bg-background">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0">
              <img 
                src={heroImage} 
                alt="Logistics Operations" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
              <div className="text-center">
                <div className="flex items-center justify-center mb-6">
                  <Truck className="h-12 w-12 text-primary-foreground mr-3" />
                  <span className="text-3xl font-bold text-primary-foreground">TripTrac</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
                  Streamline Your Logistics Operations
                </h1>
                <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
                  Complete logistics management platform to efficiently manage users, customers, 
                  trucks, and trips with powerful analytics and real-time tracking.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
                    onClick={handleLogin}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-24 bg-secondary/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Everything You Need for Logistics Management
                </h2>
                <p className="text-xl text-muted-foreground">
                  Comprehensive tools to manage your entire logistics operation
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle>Secure User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Role-based access control with secure authentication. Manage admins, dispatchers, and drivers with different permission levels.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                      <Clock className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle>Real-time Tracking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Track trips in real-time with status updates. Monitor truck locations, delivery progress, and driver activities.
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-card hover:shadow-elegant transition-all duration-300">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                      <BarChart3 className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Comprehensive analytics with performance metrics, efficiency reports, and data visualizations for informed decision making.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-16 bg-gradient-primary">
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-primary-foreground mb-4">
                Ready to Transform Your Logistics?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Join hundreds of companies already using TripTrac to streamline their operations
              </p>
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow"
                onClick={handleLogin}
              >
                Start Your Free Trial
              </Button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />;
      case "users":
        return <UsersManagement />;
      case "customers":
        return <CustomersManagement />;
      case "trucks":
        return <TrucksManagement />;
      case "trips":
        return <TripsManagement />;
      case "reports":
        return <ReportsManagement />;
      case "maintenance":
        return <MaintenanceManagement />;
      case "maintenance-reports":
        return <MaintenanceReports />;
      case "settings":
        return <SettingsTab />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {user && (
        <Navigation 
          currentPage={currentPage} 
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
          userProfile={profile}
        />
      )}
      {renderPage()}
    </div>
  );
};

export default Index;
