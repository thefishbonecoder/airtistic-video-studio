import { MobilePoster } from "@/components/studio/mobile-poster";
import { StudioShell } from "@/components/studio/studio-shell";

export default function HomePage() {
  return (
    <main className="studio-page">
      <MobilePoster />
      <StudioShell locked owner={false} />
    </main>
  );
}
