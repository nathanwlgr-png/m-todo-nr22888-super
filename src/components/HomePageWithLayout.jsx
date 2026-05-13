import { useTabletOptimizations } from '@/hooks/useTabletOptimizations';
import Layout from '@/components/AppLayout';
import TabletAppLayout from '@/components/TabletAppLayout';
import Home from '@/pages/Home';
import HomeTablet from '@/pages/HomeTablet';

export default function HomePageWithLayout() {
  const { isTablet } = useTabletOptimizations();
  const LayoutComponent = isTablet ? TabletAppLayout : Layout;
  const PageComponent = isTablet ? HomeTablet : Home;

  return (
    <LayoutComponent currentPageName="Home">
      <PageComponent />
    </LayoutComponent>
  );
}