export const syncUserWithStrapi = async (firebaseUser: any) => {
  if (!firebaseUser || !firebaseUser.email) return;

  const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL;
  const STRAPI_TOKEN = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

  if (!STRAPI_URL || !STRAPI_TOKEN) return;

  try {
    const response = await fetch(`${STRAPI_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${STRAPI_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return;

    const allUsers = await response.json();
    
    const strapiUser = allUsers.find(
      (u: any) => u.email.toLowerCase() === firebaseUser.email.toLowerCase()
    );

    if (strapiUser) {
      // Ako je UID već sinkroniziran, odmah izlazimo bez dodatnih poziva
      if (strapiUser.firebaseUID === firebaseUser.uid) {
        return;
      }

      // Inicijali (ako ih nema u Strapiju, uzimamo iz imena ili emaila)
      const displayName = firebaseUser.displayName || firebaseUser.email.split('@')[0];
      const initials = displayName.split(' ').map((n: any) => n[0]).join('').toUpperCase().substring(0, 3);

      await fetch(`${STRAPI_URL}/api/users/${strapiUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${STRAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUID: firebaseUser.uid,
          inicijali: strapiUser.inicijali || initials
        }),
      });
    }
  } catch (error) {
    // Ostavljamo samo error log za kritične situacije
    console.error("❌ Strapi Sync Error:", error);
  }
};