import { useState, useEffect, useRef } from "react";
import { useAuth } from "../AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Mail, Save, Lock, Eye, EyeOff, Camera } from "lucide-react";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State untuk preview gambar
  const [avatarPreview, setAvatarPreview] = useState("");
  // State untuk file asli yang akan dikirim ke backend
  const [avatarFile, setAvatarFile] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setName(user.nama || "");
      setEmail(user.email || "");

      setAvatarPreview(user.profile_picture || "");
    }
  }, [user]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB");
        return;
      }

      // Simpan file asli untuk dikirim nanti
      setAvatarFile(file);

      // Buat preview lokal
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handle Update Profil (Nama, Email & Avatar) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Gunakan FormData untuk mengirim file + text
    const formData = new FormData();
    formData.append("nama", name);
    formData.append("email", email);

    // Hanya append avatar jika user memilih file baru
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    const result = await updateProfile(formData);

    if (result.success) {
      toast.success(result.message || "Profil berhasil diperbarui");
      // Reset file state setelah sukses
      setAvatarFile(null);
    } else {
      toast.error(result.message || "Gagal memperbarui profil");
    }

    setIsLoading(false);
  };


  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Password baru tidak cocok");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }

    setIsPasswordLoading(true);

    // Untuk password, kita masih bisa pakai JSON biasa atau FormData,
    // tapi karena updateProfile sekarang support FormData, kita pakai JSON object
    // dan updateProfile akan otomatis handle (karena bukan instance of FormData)
    const result = await updateProfile({
      password: newPassword,
    });

    if (result.success) {
      toast.success("Password berhasil diubah");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(result.message || "Gagal mengubah password");
    }

    setIsPasswordLoading(false);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Kelola informasi profil Anda</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview} alt={name} className="object-cover" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">{getInitials(name || "U")}</AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
            </div>
            <CardTitle>{name || "User"}</CardTitle>
            <CardDescription>{email}</CardDescription>
          </CardHeader>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
              <CardDescription>Perbarui informasi profil Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-10" placeholder="Masukkan nama lengkap" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="Masukkan email" />
                  </div>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Form (Copy Paste form password yang lama di sini) */}
          <Card>
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>Perbarui password akun Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="pl-10 pr-10" placeholder="Masukkan password baru" required />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="Konfirmasi password baru"
                      required
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={isPasswordLoading} className="w-full">
                  <Lock className="mr-2 h-4 w-4" />
                  {isPasswordLoading ? "Mengubah..." : "Ubah Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
