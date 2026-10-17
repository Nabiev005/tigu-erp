import { useTranslation } from 'react-i18next';
import {
  AboutFaqSection,
  Hero,
  HowSection,
  LeadSection,
  ModulesSection,
  NumbersSection,
  PricingSection,
  ProblemsSection,
  TrustSection,
} from '../../features/landing';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';

export function LandingPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('landing.meta.title'));
  return (
    <>
      <Hero />
      <ProblemsSection />
      <HowSection />
      <ModulesSection />
      <NumbersSection />
      <TrustSection />
      <PricingSection />
      <AboutFaqSection />
      <LeadSection />
    </>
  );
}
