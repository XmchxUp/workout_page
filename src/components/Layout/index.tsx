import React from 'react';
import Header from '@/components/Header';

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <Header />
      <div className="mx-auto mb-16 max-w-screen-2xl p-4 lg:p-16">
        {children}
      </div>
    </>
  );
};

export default Layout;
