// app/modul/page.tsx

import React, { Suspense } from 'react'; // Dodaj Suspense
import ModuleContentFetcher from '../../components/ModuleContentFetcher';

// Glavna stranica je Server Komponenta, ali wrappa klijentsku unutar Suspense
const ModulePage: React.FC = () => {
  return (
    <Suspense fallback={<div>Učitavanje modula...</div>}>
      <ModuleContentFetcher />
    </Suspense>
  );
};

export default ModulePage;
