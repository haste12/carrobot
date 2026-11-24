import LoadingScreen from "@/components/LoadingScreen";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SensorSystem from "@/components/SensorSystem";
import Materials from "@/components/Materials";
import HowItWorks from "@/components/HowItWorks";
import Team from "@/components/Team";
import CodeSection from "@/components/CodeSection";
import KineticDivider from "@/components/KineticDivider";

export default function Page() {
  return (
    <>
      <LoadingScreen />
      <Navbar />
      <main>
        <Hero />
        <SensorSystem />
        <KineticDivider text="AUTONOMOUS PATROL" />
        <Materials />
        <KineticDivider text="SENSE · DECIDE · ACT" reverse />
        <HowItWorks />
        <Team />
        <CodeSection />
      </main>
    </>
  );
}
