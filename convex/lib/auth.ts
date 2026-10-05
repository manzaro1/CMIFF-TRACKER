type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ email?: string } | null>;
  };
};

function staffInvites(): Map<string, string> {
  const invites = new Map<string, string>();
  for (const entry of (process.env.CMIFF_STAFF_INVITES ?? "").split(";")) {
    const separator = entry.indexOf("=");
    if (separator <= 0) continue;
    const email = entry.slice(0, separator).trim().toLowerCase();
    const code = entry.slice(separator + 1).trim();
    if (email && code) invites.set(email, code);
  }
  return invites;
}

export function isValidStaffInvite(email: string, code: string): boolean {
  return Boolean(code) && staffInvites().get(email.trim().toLowerCase()) === code;
}

export async function isStaff(ctx: AuthContext): Promise<boolean> {
  const identity = await ctx.auth.getUserIdentity();
  const email = identity?.email?.trim().toLowerCase();
  if (!email) return false;

  return staffInvites().has(email);
}

export async function requireStaff(ctx: AuthContext): Promise<void> {
  if (!(await isStaff(ctx))) {
    throw new Error("Staff sign-in required.");
  }
}