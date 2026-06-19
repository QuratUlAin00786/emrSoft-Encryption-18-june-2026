  import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { getActiveSubdomain } from "@/lib/subdomain-utils";
import { DemoCredentialsPanel } from "@/components/auth/DemoCredentialsPanel";
import { EMR_TITLE_LOGO_PATH, EMR_BRAND_NAME, EMR_COPYRIGHT } from "@/lib/branding";

const emrLogoPath = EMR_TITLE_LOGO_PATH;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // Check for session expiration message
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('expired') === 'true') {
      setError('Session expired due to inactivity. Please log in again.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("🔐 Login attempt starting...");
      console.log("📧 Email/Username:", email);
      console.log("🌐 Current hostname:", window.location.hostname);
      console.log("🏢 Detected tenant:", getActiveSubdomain());
      
      await login(email, password);
      console.log("✅ Login successful");
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      console.error("📋 Full error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name,
        cause: err.cause
      });
      
      // Provide more specific error messages
      let errorMessage = "Login failed. Please check your credentials.";
      
      if (err.message) {
        if (err.message.includes("401")) {
          errorMessage = "Invalid email/username or password. Please check your credentials.";
        } else if (err.message.includes("500")) {
          errorMessage = "Server error. Please try again in a moment.";
        } else if (err.message.includes("404")) {
          errorMessage = "Login service not found. Please contact support.";
        } else if (err.message.includes("Network")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        {/* Logo and Branding */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={emrLogoPath} 
              alt={EMR_BRAND_NAME} 
              className="h-32 w-auto"
            />
          </div>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-[hsl(235,45%,25%)] mb-3">Welcome to emrSoft</h1>
            <div className="space-y-2 text-sm text-[hsl(225,16%,65%)] max-w-sm mx-auto">
              <p className="font-medium text-base">AI-Powered Healthcare Platform</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-center bg-[hsl(235,50%,92%)] rounded-lg py-2 px-3">
                  <span>🏥 Patient Management</span>
                </div>
                <div className="flex items-center justify-center bg-[hsl(235,50%,92%)] rounded-lg py-2 px-3">
                  <span>🤖 AI Clinical Insights</span>
                </div>
                <div className="flex items-center justify-center bg-[hsl(235,50%,92%)] rounded-lg py-2 px-3">
                  <span>📅 Smart Scheduling</span>
                </div>
                <div className="flex items-center justify-center bg-[hsl(235,50%,92%)] rounded-lg py-2 px-3">
                  <span>💳 Billing & Payments</span>
                </div>
              </div>
              <p className="text-xs text-[hsl(225,16%,65%)] mt-3">
                Streamline workflows • Enhance patient care • Ensure compliance
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="py-3 pb-1">
            <CardTitle className="text-sm text-blue-800">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-3">
            <DemoCredentialsPanel
              showHeader={false}
              onSelect={(demoEmail, demoPassword) => {
                setEmail(demoEmail);
                setPassword(demoPassword);
              }}
            />
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email or username to access the EMR system
            </CardDescription>
            {error === "Session expired due to inactivity. Please log in again." && (
              <Alert variant="destructive" className="mt-3">
                <AlertDescription>
                  Session expired due to inactivity. Please log in again.
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Email or Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paul@emrsoft.ai or paul"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && error !== "Session expired due to inactivity. Please log in again." && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner className="mr-2 h-4 w-4" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>



        {/* Footer */}
        <div className="text-center text-xs text-[hsl(225,16%,65%)]">
          <p>emrSoft by Averox Private Ltd</p>
          <p>Secure • Compliant • AI-Powered</p>
        </div>
      </div>
    </div>
  );
}