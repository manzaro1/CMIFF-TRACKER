import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { isValidStaffInvite } from "./lib/auth";

const StaffPassword = Password({
  profile(params) {
    const email =
      typeof params.email === "string" ? params.email.trim().toLowerCase() : "";
    if (!email) throw new Error("Enter a valid staff email address.");
    if (params.flow === "signUp") {
      const code = typeof params.staffCode === "string" ? params.staffCode : "";
      if (!isValidStaffInvite(email, code)) {
        throw new Error("The email or staff invitation code is not valid.");
      }
    }
    return { email };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [StaffPassword],
});