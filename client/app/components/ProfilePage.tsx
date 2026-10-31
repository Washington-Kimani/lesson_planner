import { ProfileForm } from "@/app/components/ProfileForm";
import { getSessionProfile } from "@/lib/session";

export async function ProfilePage() {
    return <ProfileForm profile={await getSessionProfile()} />;
}
