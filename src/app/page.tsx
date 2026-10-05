import CMIFFTracker from "./[CMIFF_TRACKER]";
import { AuthGate } from "./auth-gate";

export default function Page() {
  return (
    <AuthGate>
      <CMIFFTracker />
    </AuthGate>
  );
}
