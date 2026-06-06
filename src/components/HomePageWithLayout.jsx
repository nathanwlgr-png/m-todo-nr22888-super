import React from 'react';
import Layout from '@/components/AppLayout';
import SalesCommandCenter from '@/pages/SalesCommandCenter';

export default function HomePageWithLayout() {
  return (
    <Layout currentPageName="Home">
      <SalesCommandCenter />
    </Layout>
  );
}