import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Smartphone, Monitor } from "lucide-react";

const authenticatorApps = [
  {
    name: "Google Authenticator",
    description: "Simple and reliable from Google",
    platforms: ["iOS", "Android"],
    features: ["Free", "Easy setup"],
    links: {
      ios: "https://apps.apple.com/app/google-authenticator/id388497605",
      android: "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2",
    },
  },
  {
    name: "Authy",
    description: "Multi-device with cloud backup",
    platforms: ["iOS", "Android", "Desktop"],
    features: ["Free", "Cloud backup", "Multi-device"],
    links: {
      ios: "https://apps.apple.com/app/authy/id494168017",
      android: "https://play.google.com/store/apps/details?id=com.authy.authy",
      desktop: "https://authy.com/download/",
    },
  },
  {
    name: "Microsoft Authenticator",
    description: "From Microsoft with backup support",
    platforms: ["iOS", "Android"],
    features: ["Free", "Cloud backup", "Passwordless"],
    links: {
      ios: "https://apps.apple.com/app/microsoft-authenticator/id983156458",
      android: "https://play.google.com/store/apps/details?id=com.azure.authenticator",
    },
  },
  {
    name: "1Password",
    description: "Password manager with built-in 2FA",
    platforms: ["iOS", "Android", "Desktop"],
    features: ["Paid", "Password manager", "Premium"],
    links: {
      ios: "https://apps.apple.com/app/1password/id568903335",
      android: "https://play.google.com/store/apps/details?id=com.onepassword.android",
      desktop: "https://1password.com/downloads/",
    },
  },
  {
    name: "Bitwarden",
    description: "Open-source password manager",
    platforms: ["iOS", "Android", "Desktop"],
    features: ["Free", "Open source", "Password manager"],
    links: {
      ios: "https://apps.apple.com/app/bitwarden-password-manager/id1137397744",
      android: "https://play.google.com/store/apps/details?id=com.x8bit.bitwarden",
      desktop: "https://bitwarden.com/download/",
    },
  },
];

export const AuthenticatorAppRecommendations = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  const getPrimaryLink = (app: typeof authenticatorApps[0]) => {
    if (isIOS && app.links.ios) return app.links.ios;
    if (isAndroid && app.links.android) return app.links.android;
    return app.links.ios || app.links.android || app.links.desktop;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Step 1: Choose Your Authenticator App</h3>
        <p className="text-sm text-muted-foreground">
          Select and install an authenticator app on your device. All apps below work with our 2FA system.
        </p>
      </div>

      <div className="grid gap-3">
        {authenticatorApps.map((app) => (
          <Card key={app.name} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{app.name}</h4>
                    {app.features.map((feature) => (
                      <Badge 
                        key={feature} 
                        variant={feature === "Free" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{app.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {app.platforms.includes("iOS") || app.platforms.includes("Android") ? (
                      <Smartphone className="w-4 h-4" />
                    ) : null}
                    {app.platforms.includes("Desktop") && <Monitor className="w-4 h-4" />}
                    <span>{app.platforms.join(", ")}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <a
                    href={getPrimaryLink(app)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Download
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>💡 <strong>Tip:</strong> We recommend apps with cloud backup (Authy, Microsoft) to avoid losing access.</p>
        <p>🔒 All authenticator apps work the same way - choose the one you're most comfortable with.</p>
      </div>
    </div>
  );
};
