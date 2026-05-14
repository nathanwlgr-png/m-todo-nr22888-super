import React from 'react';
import { useTabletOptimizations } from '@/hooks/useTabletOptimizations';
import Layout from '@/components/AppLayout';
import TabletAppLayout from '@/components/TabletAppLayout';
import Home from '@/pages/Home';
import HomeTablet from '@/pages/HomeTablet';
import { useLocation } from 'react-router-dom';

function HomePageContent() {
  const { isTablet } = useTabletOptimizations();
  const LayoutComponent = isTablet ? TabletAppLayout : Layout;
  const PageComponent = isTablet ? HomeTablet : Home;

  return (
    <LayoutComponent currentPageName="Home">
      <PageComponent />
    </LayoutComponent>
  );
}

export default function HomePageWithLayout() {
  return <HomePageContent />;
}