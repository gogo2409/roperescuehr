// types/global.d.ts
// Deklaracije za globalne varijable koje dolaze iz vanjskog (Canvas) okruženja.
// Ovo govori TypeScriptu da ove varijable postoje u globalnom opsegu,
// čak i ako nisu direktno definirane u kôdu.

declare const __app_id: string;
declare const __firebase_config: string;
declare const __initial_auth_token: string | null;
