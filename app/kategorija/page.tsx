// app/kategorija/page.tsx
import React, { Suspense } from 'react';
import CategoryClientContent from './CategoryClientContent'; // Uvozimo novu klijentsku komponentu

const CategoryPage = () => {
  return (
    <Suspense fallback={<div>Učitavanje kategorije...</div>}>
      <CategoryClientContent />
    </Suspense>
  );
};

export default CategoryPage;
