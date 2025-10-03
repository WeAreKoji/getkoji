import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";
import { UsernameInput } from "@/components/profile/UsernameInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

interface ProfileSetupProps {
  data: {
    displayName: string;
    username: string;
    age: number;
    city: string;
    bio: string;
    avatarUrl: string;
  };
  onComplete: (data: ProfileSetupData) => void;
  loading: boolean;
}

interface ProfileSetupData {
  displayName: string;
  username: string;
  age: number;
  city: string;
  bio: string;
  avatarUrl: string;
  gender?: string;
  interestedInGender?: string[];
}

const ProfileSetup = ({ data, onComplete, loading }: ProfileSetupProps) => {
  const [formData, setFormData] = useState<ProfileSetupData>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileSetupData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileSetupData, string>> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    } else if (formData.displayName.length < 2) {
      newErrors.displayName = "Display name must be at least 2 characters";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (formData.age < 18) {
      newErrors.age = "You must be at least 18 years old";
    } else if (formData.age > 120) {
      newErrors.age = "Please enter a valid age";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete(formData);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For MVP, we'll use a placeholder. In production, upload to Supabase Storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatarUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Create Your Profile</h2>
        <p className="text-muted-foreground">
          Tell us about yourself. This will be shown to others.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-32 h-32">
              <AvatarImage src={formData.avatarUrl} />
              <AvatarFallback className="bg-primary/10">
                <User className="w-12 h-12 text-primary" />
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-5 h-5 text-primary-foreground" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            placeholder="How should we call you?"
            value={formData.displayName}
            onChange={(e) =>
              setFormData({ ...formData, displayName: e.target.value })
            }
            className={errors.displayName ? "border-destructive" : ""}
          />
          {errors.displayName && (
            <p className="text-sm text-destructive">{errors.displayName}</p>
          )}
        </div>

        <UsernameInput 
          value={formData.username} 
          onChange={(username) => setFormData({ ...formData, username })}
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="120"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: parseInt(e.target.value) || 18 })
              }
              className={errors.age ? "border-destructive" : ""}
            />
            {errors.age && (
              <p className="text-sm text-destructive">{errors.age}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              placeholder="Where are you based?"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className={errors.city ? "border-destructive" : ""}
            />
            {errors.city && (
              <p className="text-sm text-destructive">{errors.city}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio (Optional)</Label>
          <Textarea
            id="bio"
            placeholder="Tell us a bit about yourself..."
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {formData.bio.length}/500 characters
          </p>
        </div>

        <div className="space-y-2">
          <Label>I Am</Label>
          <RadioGroup
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="non_binary" id="non_binary" />
              <Label htmlFor="non_binary" className="font-normal cursor-pointer">Non-binary</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="other" id="other" />
              <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="prefer_not_to_say" id="prefer_not_to_say" />
              <Label htmlFor="prefer_not_to_say" className="font-normal cursor-pointer">Prefer not to say</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Interested In</Label>
          <div className="space-y-2">
            {[
              { value: "male", label: "Men" },
              { value: "female", label: "Women" },
              { value: "non_binary", label: "Non-binary" },
              { value: "other", label: "Other" },
            ].map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`interested_${option.value}`}
                  checked={formData.interestedInGender?.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const current = formData.interestedInGender || [];
                    setFormData({
                      ...formData,
                      interestedInGender: checked
                        ? [...current, option.value]
                        : current.filter((g) => g !== option.value),
                    });
                  }}
                />
                <Label htmlFor={`interested_${option.value}`} className="font-normal cursor-pointer">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "Creating Profile..." : "Complete Setup"}
        </Button>
      </form>
    </div>
  );
};

export default ProfileSetup;
