import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CreatorVerifyIdentity() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [step, setStep] = useState(1);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Form data
  const [documentType, setDocumentType] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [documentNumber, setDocumentNumber] = useState("");
  const [issuingCountry, setIssuingCountry] = useState("");
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has creator role
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (!roles?.some(r => r.role === "creator")) {
        toast({
          title: "Not Authorized",
          description: "You must be approved as a creator first.",
          variant: "destructive",
        });
        navigate("/creator/apply");
        return;
      }

      // Check verification status
      const { data: verification } = await supabase
        .from("creator_id_verification")
        .select("status")
        .eq("creator_id", user.id)
        .maybeSingle();

      if (verification) {
        setVerificationStatus(verification.status);
        if (verification.status === "approved") {
          navigate("/creator/setup");
          return;
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${path}_${Date.now()}.${fileExt}`;

    const { error: uploadError, data } = await supabase.storage
      .from("id-documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("id-documents")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Validate all files are uploaded
      if (!frontFile || !selfieFile) {
        throw new Error("Please upload all required documents");
      }

      if (documentType !== "passport" && !backFile) {
        throw new Error("Please upload the back of your ID");
      }

      // Upload files
      const frontUrl = await uploadFile(frontFile, "front");
      const selfieUrl = await uploadFile(selfieFile, "selfie");
      const backUrl = backFile ? await uploadFile(backFile, "back") : null;

      // Get IP and user agent
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();
      const userAgent = navigator.userAgent;

      // Submit verification
      const { error } = await supabase
        .from("creator_id_verification")
        .insert({
          creator_id: user.id,
          document_type: documentType,
          document_front_url: frontUrl,
          document_back_url: backUrl,
          selfie_url: selfieUrl,
          full_name: fullName,
          date_of_birth: dateOfBirth?.toISOString().split('T')[0],
          document_number: documentNumber,
          issuing_country: issuingCountry,
          ip_address: ip,
          user_agent: userAgent,
        });

      if (error) throw error;

      toast({
        title: "Verification Submitted",
        description: "Your ID verification has been submitted for review. This typically takes 24-48 hours.",
      });

      setVerificationStatus("pending");
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (verificationStatus === "pending" || verificationStatus === "under_review") {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <CardTitle>Verification In Progress</CardTitle>
              </div>
              <CardDescription>
                Your identity verification is currently being reviewed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We're reviewing your submitted documents. This process typically takes 24-48 hours.
                You'll receive an email notification once your verification is complete.
              </p>
              <Button onClick={() => navigate("/discover")} variant="outline">
                Back to Discover
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (verificationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>Verification Rejected</CardTitle>
              </div>
              <CardDescription>
                Your identity verification was not approved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Please contact support for more information or to resubmit your verification.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/support")}>
                  Contact Support
                </Button>
                <Button onClick={() => navigate("/discover")} variant="outline">
                  Back to Discover
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/discover")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Verify Your Identity</CardTitle>
            <CardDescription>
              To become a creator, we need to verify your identity. This helps keep our platform safe and compliant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-6">
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {step > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
                </div>
                <div className="flex-1 h-1 bg-muted">
                  <div className={cn("h-full bg-primary transition-all", step >= 2 ? "w-full" : "w-0")} />
                </div>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {step > 2 ? <CheckCircle className="h-5 w-5" /> : "2"}
                </div>
                <div className="flex-1 h-1 bg-muted">
                  <div className={cn("h-full bg-primary transition-all", step >= 3 ? "w-full" : "w-0")} />
                </div>
                <div className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full",
                  step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  3
                </div>
              </div>

              {/* Step 1: Document Type */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="documentType">Document Type</Label>
                    <Select value={documentType} onValueChange={setDocumentType}>
                      <SelectTrigger id="documentType">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!documentType}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              )}

              {/* Step 2: Upload Documents */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="frontUpload">Front of ID</Label>
                    <Input
                      id="frontUpload"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFrontFile(e.target.files?.[0] || null)}
                    />
                  </div>

                  {documentType !== "passport" && (
                    <div>
                      <Label htmlFor="backUpload">Back of ID</Label>
                      <Input
                        id="backUpload"
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setBackFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="selfieUpload">Selfie Holding ID</Label>
                    <Input
                      id="selfieUpload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Take a selfie holding your ID next to your face
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setStep(3)}
                      disabled={!frontFile || !selfieFile || (documentType !== "passport" && !backFile)}
                      className="flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Personal Details */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name (as on ID)</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Smith"
                      required
                    />
                  </div>

                  <div>
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          {dateOfBirth ? format(dateOfBirth, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={dateOfBirth}
                          onSelect={setDateOfBirth}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label htmlFor="documentNumber">Document Number</Label>
                    <Input
                      id="documentNumber"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="ID number"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="issuingCountry">Issuing Country</Label>
                    <Input
                      id="issuingCountry"
                      value={issuingCountry}
                      onChange={(e) => setIssuingCountry(e.target.value)}
                      placeholder="United States"
                      required
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !fullName || !dateOfBirth || !documentNumber || !issuingCountry}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit Verification
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Why we need this</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Verify you're a real person</li>
            <li>• Comply with financial regulations</li>
            <li>• Protect creators and subscribers</li>
            <li>• Prevent fraud and abuse</li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Your documents are encrypted and stored securely. We never share your information.
          </p>
        </div>
      </div>
    </div>
  );
}
