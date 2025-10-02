import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Eye, Calendar, User } from "lucide-react";

interface Verification {
  id: string;
  creator_id: string;
  status: string;
  document_type: string;
  document_front_url: string;
  document_back_url: string | null;
  selfie_url: string;
  full_name: string;
  date_of_birth: string;
  document_number: string;
  issuing_country: string;
  submitted_at: string;
  rejection_reason: string | null;
  profiles: {
    display_name: string;
    email: string;
    username: string | null;
  };
}

export default function AdminVerifications() {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchVerifications();
    }
  }, [isAdmin, activeTab]);

  const fetchVerifications = async () => {
    setLoading(true);
    const statusFilter = activeTab as "pending" | "approved" | "rejected" | "under_review";
    const { data, error } = await supabase
      .from("creator_id_verification")
      .select(`
        *,
        profiles:creator_id (
          display_name,
          email,
          username
        )
      `)
      .eq("status", statusFilter)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Error fetching verifications:", error);
      toast({
        title: "Error",
        description: "Failed to load verifications.",
        variant: "destructive",
      });
    } else {
      setVerifications(data as unknown as Verification[]);
    }
    setLoading(false);
  };

  const getSignedUrl = async (path: string) => {
    if (imageUrls[path]) return imageUrls[path];

    const { data, error } = await supabase.storage
      .from("id-documents")
      .createSignedUrl(path, 3600); // 1 hour expiry

    if (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }

    setImageUrls(prev => ({ ...prev, [path]: data.signedUrl }));
    return data.signedUrl;
  };

  const viewVerification = async (verification: Verification) => {
    setSelectedVerification(verification);
    // Preload signed URLs
    await getSignedUrl(verification.document_front_url);
    if (verification.document_back_url) {
      await getSignedUrl(verification.document_back_url);
    }
    await getSignedUrl(verification.selfie_url);
  };

  const handleReview = async (verificationId: string, approved: boolean) => {
    setProcessing(true);

    const { error } = await supabase.functions.invoke("review-id-verification", {
      body: {
        verification_id: verificationId,
        approved,
        rejection_reason: approved ? null : rejectionReason,
      },
    });

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${approved ? "approve" : "reject"} verification.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Verification ${approved ? "approved" : "rejected"} successfully.`,
      });
      setSelectedVerification(null);
      setRejectionReason("");
      fetchVerifications();
    }

    setProcessing(false);
  };

  if (authLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ID Verification Review</h1>
        <p className="text-muted-foreground">Review and approve creator identity verifications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : verifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No {activeTab} verifications found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {verifications.map((verification) => (
                <Card key={verification.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="w-5 h-5" />
                          {verification.profiles.display_name}
                          {verification.profiles.username && (
                            <span className="text-sm text-muted-foreground">
                              @{verification.profiles.username}
                            </span>
                          )}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {verification.profiles.email}
                        </p>
                      </div>
                      <Badge
                        variant={
                          verification.status === "approved"
                            ? "default"
                            : verification.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {verification.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Document Type:</span>
                        <p className="font-medium">{verification.document_type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Country:</span>
                        <p className="font-medium">{verification.issuing_country}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Full Name:</span>
                        <p className="font-medium">{verification.full_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">DOB:</span>
                        <p className="font-medium">{verification.date_of_birth}</p>
                      </div>
                    </div>
                    {verification.rejection_reason && (
                      <div className="mb-4 p-3 bg-destructive/10 rounded-lg">
                        <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                        <p className="text-sm mt-1">{verification.rejection_reason}</p>
                      </div>
                    )}
                    <Button
                      onClick={() => viewVerification(verification)}
                      variant="outline"
                      className="w-full"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Documents
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedVerification} onOpenChange={() => setSelectedVerification(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Identity Verification</DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Document Front</h3>
                  <DocumentImage
                    url={selectedVerification.document_front_url}
                    getSignedUrl={getSignedUrl}
                    imageUrls={imageUrls}
                  />
                </div>
                {selectedVerification.document_back_url && (
                  <div>
                    <h3 className="font-medium mb-2">Document Back</h3>
                    <DocumentImage
                      url={selectedVerification.document_back_url}
                      getSignedUrl={getSignedUrl}
                      imageUrls={imageUrls}
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium mb-2">Selfie Verification</h3>
                <DocumentImage
                  url={selectedVerification.selfie_url}
                  getSignedUrl={getSignedUrl}
                  imageUrls={imageUrls}
                />
              </div>

              {selectedVerification.status === "pending" && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Rejection Reason (if rejecting)
                    </label>
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleReview(selectedVerification.id, true)}
                      disabled={processing}
                      className="flex-1"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview(selectedVerification.id, false)}
                      disabled={processing || !rejectionReason}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DocumentImage({ 
  url, 
  getSignedUrl, 
  imageUrls 
}: { 
  url: string; 
  getSignedUrl: (path: string) => Promise<string | null>;
  imageUrls: Record<string, string>;
}) {
  const [loading, setLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadUrl = async () => {
      if (imageUrls[url]) {
        setSignedUrl(imageUrls[url]);
        setLoading(false);
      } else {
        const signed = await getSignedUrl(url);
        setSignedUrl(signed);
        setLoading(false);
      }
    };
    loadUrl();
  }, [url, getSignedUrl, imageUrls]);

  if (loading) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return signedUrl ? (
    <img
      src={signedUrl}
      alt="Document"
      className="w-full rounded-lg border"
    />
  ) : (
    <div className="aspect-video bg-destructive/10 rounded-lg flex items-center justify-center text-destructive">
      Failed to load image
    </div>
  );
}
