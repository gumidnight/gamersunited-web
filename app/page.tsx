import HeroBanner from "@/components/HeroBanner";
import FeatureGrid from "@/components/FeatureGrid";
import AboutSection from "@/components/AboutSection";
import CommunitySection from "@/components/CommunitySection";
import siteContent from "@/content/site.json";

export default function Home() {
  const { hero, features } = siteContent;

  return (
    <div className="flex flex-col items-center w-full">
      <HeroBanner
        title={hero.title}
        subtitle={hero.subtitle}
        description={hero.description}
        ctaPrimary={hero.ctaPrimary}
        ctaSecondary={hero.ctaSecondary}
      />

      <div className="max-w-7xl mx-auto w-full">
        <FeatureGrid features={features} />

        <div id="about">
          <AboutSection />
        </div>

        <div id="community">
          <CommunitySection />
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
