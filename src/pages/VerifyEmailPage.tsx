import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, AlertCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VerifyEmailPage = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/signup");
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      setLoading(false);
      return;
    }

    try {
      // Verify OTP via edge function
      const { data, error: functionError } = await supabase.functions.invoke('verify-otp', {
        body: { 
          email,
          otpCode: otp
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || "Verification failed");
      }

      toast.success("Email verified successfully!");
      
      // Sign in the user after successful verification
      navigate("/login");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
      toast.error(err.message || "Invalid or expired code");
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: functionError } = await supabase.functions.invoke('send-otp', {
        body: { email }
      });

      if (functionError) {
        throw functionError;
      }

      toast.success("New verification code sent");
      setOtp("");
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
      toast.error(err.message || "Failed to resend code");
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <Truck className="h-8 w-8 text-primary mr-2" />
            <span className="text-2xl font-bold text-foreground">TripTrac</span>
          </div>
          <CardTitle className="text-xl">Verify Your Email</CardTitle>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="font-semibold">{email}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              type="submit" 
              disabled={loading || otp.length !== 6} 
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-sm text-primary hover:underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmailPage;