// app/modul/page.tsx

import React from 'react';
// Uvjerite se da je putanja ispravna, ovdje pretpostavljam da je to putanja u projektu:
import ModuleContentFetcher from '../../components/ModuleContentFetcher';

// Glavna stranica je Server Komponenta
const ModulePage: React.FC = () => {
  return (
    <ModuleContentFetcher />
  );
};

export default ModulePage;