import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { referredBy } = body; 

    if (!referredBy) {
      return NextResponse.json({ message: "No referrer found" });
    }

    const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
    
    // 1. DOHVAT KORISNIKA
    console.log(`Pokušaj dohvata korisnika preko ID: ${referredBy}`);
    const userRes = await fetch(`${STRAPI_URL}/api/users/${referredBy}`);
    
    if (!userRes.ok) {
      const errorText = await userRes.text();
      throw new Error(`Strapi ne prepoznaje korisnika ${referredBy}. Status: ${userRes.status}`);
    }

    const referrer = await userRes.json();

    // 2. LOGIKA ZA BROJANJE
    const currentCount = referrer.referralCount || 0;
    const newCount = currentCount + 1;
    
    // 3. LOGIKA ZA MEDALJE (Promijenjeno u 'teamleader')
    let currentMedals = Array.isArray(referrer.medalje) ? referrer.medalje : [];
    
    // --- FIX OVDJE ---
    const TEAM_LEADER_TAG = "teamleader"; 

    const hasMedal = currentMedals.includes(TEAM_LEADER_TAG);
    
    // Kreiramo objekt za update
    let updateData: any = {
      referralCount: newCount
    };

    // Provjera uvjeta za medalju (3 prijatelja)
    if (newCount >= 3 && !hasMedal) {
      updateData.medalje = [...currentMedals, TEAM_LEADER_TAG];
      console.log(`Korisnik ${referredBy} je skupio 3 pozivnice. Dodajem 'teamleader' u JSON.`);
    } else {
      updateData.medalje = currentMedals;
    }

    // 4. SPREMI PROMJENE U STRAPI
    const updateRes = await fetch(`${STRAPI_URL}/api/users/${referredBy}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        // 'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN}` // Dodaj ako ti Strapi odbije pristup
      },
      body: JSON.stringify(updateData),
    });

    if (!updateRes.ok) {
      const errorMsg = await updateRes.text();
      throw new Error(`Update nije uspio: ${errorMsg}`);
    }

    console.log(`Uspješno! Korisnik ${referredBy} sada ima ${newCount} pozivnica.`);

    return NextResponse.json({ success: true, newCount });

  } catch (error: any) {
    console.error("DETALJNA GREŠKA:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}