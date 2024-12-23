import { signOutAction } from "@/app/actions";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import AvatarCircles from "./ui/avatar-circles";
import { getAvatarUrl } from "@/utils/get-avatar-url";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get the family profile if user exists
  const familyProfile = user ? await supabase
    .from('family_profiles')
    .select('avatar_url, family_name')
    .eq('id', user.id)
    .single() : null

  // Get the avatar URL if it exists
  const avatarUrl = familyProfile?.data?.avatar_url ? getAvatarUrl(familyProfile.data.avatar_url) : null

  // Prepare avatar data for AvatarCircles
  const avatarData = avatarUrl ? [{
    imageUrl: avatarUrl,
    profileUrl: '/account'
  }] : []

  if (!hasEnvVars) {
    return (
      <>
        <div className="flex gap-4 items-center">
          <div>
            <Badge
              variant={"default"}
              className="font-normal pointer-events-none"
            >
              Please update .env.local file with anon key and url
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              asChild
              size="sm"
              variant={"outline"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={"default"}
              disabled
              className="opacity-75 cursor-none pointer-events-none"
            >
              <Link href="/sign-up">Sign up</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }
  return user ? (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">
        Hey, {familyProfile?.data?.family_name || user.email}!
      </span>
      
      <div className="flex items-center gap-2">
        <AvatarCircles 
          avatarUrls={avatarData}
          className="hover:opacity-80 transition cursor-pointer"
        />

        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant="default">
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
