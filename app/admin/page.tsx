'use client';

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, orderBy, query as firestoreQuery, doc, deleteDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/lib/firebase';
import { 
  Loader2, Users, Trophy, TrendingUp, Download, Search, 
  ShoppingCart, Settings, Clipboard, Package, X, Info, Truck, Trash2, UserCheck, Shield
} from 'lucide-react';
import Link from 'next/link';

// --- INTERFACES ---
interface ExamResult {
  id: string;
  userName: string;
  userEmail: string;
  modulId: string;
  score: number;
  maxScore: number;
  totalQuestions: number;
  timestamp: string;
  percentage: number;
}

interface Order {
  id: number;
  documentId: string;
  Ukupna_cijena: number;
  Status_posiljke: string;
  Adresa_dostave: string;
  Nacin_placanja: string;
  Tracking_broj: string | null;
  Datum_narudzbe: string;
  Napomena_kupca: string;
  Proizvodi: any;
  users_permissions_user?: {
    username: string;
    email: string;
  } | null;
}

interface StrapiUser {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  createdAt: string;
  unit?: string; // DODANO: polje za postrojbu
}

const AdminDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'results' | 'orders' | 'settings' | 'users'>('results');
  const [isLoading, setIsLoading] = useState(true);
  
  const [results, setResults] = useState<ExamResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<ExamResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState<string | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');

  const [shopEnabled, setShopEnabled] = useState(false);
  const [loadingShop, setLoadingShop] = useState(true);

  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderProducts, setSelectedOrderProducts] = useState<any[] | null>(null);

  const [strapiUsers, setStrapiUsers] = useState<StrapiUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const STRAPI_URL = 'http://192.168.1.12:1337';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.isAnonymous && currentUser.email === 'gogo.cvijanovic@gmail.com') {
        await Promise.all([
          loadAllResults(),
          loadShopSettings(),
          loadOrders(),
          loadUsers()
        ]);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...results];
    if (searchTerm) {
      filtered = filtered.filter(r => 
        r.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterModule !== 'all') filtered = filtered.filter(r => r.modulId === filterModule);
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => filterStatus === 'passed' ? r.percentage >= 90 : r.percentage < 90);
    }
    setFilteredResults(filtered);
  }, [searchTerm, filterModule, filterStatus, results]);

  const filteredOrders = orders.filter(order => {
    const s = orderSearchTerm.toLowerCase();
    const customer = (order.users_permissions_user?.username || '').toLowerCase();
    const address = (order.Adresa_dostave || '').toLowerCase();
    const id = order.id.toString();
    const productsMatch = Array.isArray(order.Proizvodi) 
      ? order.Proizvodi.some((p: any) => (p.naziv || '').toLowerCase().includes(s))
      : false;

    return customer.includes(s) || address.includes(s) || id.includes(s) || productsMatch;
  });

  const filteredUsers = strapiUsers.filter(u => 
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.unit || '').toLowerCase().includes(userSearchTerm.toLowerCase()) // DODANO: pretraga po postrojbi
  );

  const extractName = (address: string) => {
    if (!address) return 'Gost';
    const lines = address.split('\n');
    const nameLine = lines.find(l => l.includes('IME I PREZIME:'));
    return nameLine ? nameLine.replace('IME I PREZIME:', '').trim() : (lines[0] || 'Gost');
  };

  const loadAllResults = async () => {
    try {
      const q = firestoreQuery(collection(db, 'exam_results'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const data: ExamResult[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        data.push({
          id: doc.id,
          userName: d.userName || 'Nepoznato',
          userEmail: d.email || '', 
          modulId: String(d.modulId || ""),
          score: d.ukupnoBodova || 0,
          maxScore: d.maxScore || 0,
          totalQuestions: d.totalQuestions || 0,
          timestamp: d.timestamp,
          percentage: d.postotak || 0
        });
      });
      setResults(data);
    } catch (e) { console.error(e); }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_STRAPI_API_TOKEN}` }
      });
      const data = await res.json();
      setStrapiUsers(Array.isArray(data) ? data : []);
    } catch (e) { console.error("Greška pri učitavanju korisnika:", e); }
    finally { setLoadingUsers(false); }
  };

  const deleteResult = async (resultId: string) => {
    if (!window.confirm('Jeste li sigurni da želite trajno obrisati ovaj rezultat?')) return;
    try {
      await deleteDoc(doc(db, 'exam_results', resultId));
      setResults(prev => prev.filter(r => r.id !== resultId));
    } catch (e) {
      console.error("Greška pri brisanju:", e);
      alert("Neuspješno brisanje.");
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${STRAPI_URL}/api/narudzbas?populate=*&sort=createdAt:desc`);
      const json = await res.json();
      setOrders(json.data || []);
    } catch (e) { console.error(e); }
    finally { setLoadingOrders(false); }
  };

  const updateOrder = async (documentId: string, payload: any) => {
    try {
      await fetch(`${STRAPI_URL}/api/narudzbas/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: payload })
      });
      loadOrders();
    } catch (e) { console.error(e); }
  };

  const loadShopSettings = async () => {
    try {
      const res = await fetch(`${STRAPI_URL}/api/shop-enabled`);
      const data = await res.json();
      setShopEnabled(data.data?.Shop_Enabled ?? false);
    } catch (e) { console.error(e); }
    finally { setLoadingShop(false); }
  };

  const toggleShop = async () => {
    const next = !shopEnabled;
    try {
      const res = await fetch(`${STRAPI_URL}/api/shop-enabled`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { Shop_Enabled: next } })
      });
      if (res.ok) setShopEnabled(next);
    } catch (e) { console.error(e); }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'plaćeno': return 'bg-green-100 text-green-800 border-green-200';
      case 'poslano': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'otkazano': return 'bg-red-100 text-red-800 border-red-200';
      case 'završeno': return 'bg-gray-800 text-white border-gray-900';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const stats = {
    totalExams: results.length,
    passedExams: results.filter(r => r.percentage >= 90).length,
    averageScore: results.length > 0 ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1) : 0,
    uniqueUsers: new Set(results.map(r => r.userEmail)).size
  };

  const availableModules = Array.from(new Set(results.map(r => r.modulId))).sort();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;

  if (!user || user.email !== 'gogo.cvijanovic@gmail.com') {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Nemate pristup</h2>
        <Link href="/" className="bg-blue-600 text-white py-2 px-4 rounded">Vrati se na početnu</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 md:p-4 max-w-7xl min-h-screen text-gray-800">
      {/* --- HEADER --- */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl shadow-lg p-4 md:p-8 mb-6 md:mb-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 uppercase tracking-tight">Admin Panel</h1>
        <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 no-scrollbar">
          <button onClick={() => setActiveTab('results')} className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-lg font-semibold transition text-sm md:text-base ${activeTab === 'results' ? 'bg-white text-purple-700' : 'bg-white/20'}`}>📊 Ispiti</button>
          <button onClick={() => setActiveTab('users')} className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm md:text-base ${activeTab === 'users' ? 'bg-white text-purple-700' : 'bg-white/20'}`}><Users className="w-4 h-4 md:w-5 h-5" /> Korisnici</button>
          <button onClick={() => setActiveTab('orders')} className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm md:text-base ${activeTab === 'orders' ? 'bg-white text-purple-700' : 'bg-white/20'}`}><Package className="w-4 h-4 md:w-5 h-5" /> Narudžbe</button>
          <button onClick={() => setActiveTab('settings')} className={`whitespace-nowrap px-4 md:px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 text-sm md:text-base ${activeTab === 'settings' ? 'bg-white text-purple-700' : 'bg-white/20'}`}><Settings className="w-4 h-4 md:w-5 h-5" /> Postavke</button>
        </div>
      </div>

      {/* --- TAB: REZULTATI --- */}
      {activeTab === 'results' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-gray-100">
              <p className="text-gray-400 text-[10px] md:text-sm uppercase font-black">Svi pokušaji</p>
              <p className="text-xl md:text-3xl font-black text-gray-800">{stats.totalExams}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-gray-100">
              <p className="text-gray-400 text-[10px] md:text-sm uppercase font-black">Položeno</p>
              <p className="text-xl md:text-3xl font-black text-green-600">{stats.passedExams}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-gray-100">
              <p className="text-gray-400 text-[10px] md:text-sm uppercase font-black">Prosjek</p>
              <p className="text-xl md:text-3xl font-black text-indigo-600">{stats.averageScore}%</p>
            </div>
            <div className="bg-white rounded-xl shadow p-4 md:p-6 border border-gray-100">
              <p className="text-gray-400 text-[10px] md:text-sm uppercase font-black">Korisnici</p>
              <p className="text-xl md:text-3xl font-black text-purple-600">{stats.uniqueUsers}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input type="text" placeholder="Pretraži korisnika..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-xl text-gray-800 outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-2 md:contents">
                <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)} className="px-4 py-2 border rounded-xl text-gray-800 text-sm outline-none">
                  <option value="all">Svi ispiti</option>
                  {availableModules.map(m => (
                    <option key={m} value={m}>{m.includes('Mikro') ? m : `Modul ${m}`}</option>
                  ))}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-4 py-2 border rounded-xl text-gray-800 text-sm outline-none">
                  <option value="all">Svi rezultati</option>
                  <option value="passed">Položeno</option>
                  <option value="failed">Nije položio</option>
                </select>
              </div>
              <button className="bg-green-600 text-white font-bold px-4 py-2 rounded-xl flex items-center justify-center gap-2 transition hover:bg-green-700 text-sm">
                <Download className="h-4 w-4" /> CSV Export
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-x-auto border border-gray-100">
            <table className="w-full min-w-[600px] md:min-w-full">
              <thead className="bg-gray-50 border-b text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="px-4 md:px-6 py-4 text-left">Korisnik</th>
                  <th className="px-4 md:px-6 py-4 text-left">Ispit / Kategorija</th>
                  <th className="px-4 md:px-6 py-4 text-left">Rezultat</th>
                  <th className="px-4 md:px-6 py-4 text-left">Status</th>
                  <th className="px-4 md:px-6 py-4 text-right">Akcija</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 md:px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{r.userName}</div>
                        <div className="text-[10px] text-gray-400 md:text-xs">{r.userEmail}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`text-[10px] md:text-xs font-bold ${r.modulId.includes('Mikro') ? 'text-purple-600' : 'text-gray-500'}`}>
                        {r.modulId.includes('Mikro') ? r.modulId : `Modul ${r.modulId}`}
                      </span>
                    </td>
                    <td className={`px-4 md:px-6 py-4 text-xs md:text-sm font-black ${r.percentage >= 90 ? 'text-green-600' : 'text-red-600'}`}>{r.percentage.toFixed(1)}%</td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`px-2 md:px-3 py-1 text-[10px] font-black uppercase rounded-lg ${r.percentage >= 90 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {r.percentage >= 90 ? 'Položeno' : 'Nije položio'}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <button 
                        onClick={() => deleteResult(r.id)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Obriši rezultat"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* --- NOVI TAB: KORISNICI (DODANO POLJE POSTROJBA) --- */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 md:p-6 bg-gray-50 border-b space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-black flex items-center gap-2 uppercase tracking-tight"><Users className="text-purple-600 w-5 h-5" /> Registrirani Korisnici ({filteredUsers.length})</h2>
              <button onClick={loadUsers} className="text-xs md:text-sm text-blue-600 hover:underline font-bold uppercase tracking-widest">Osvježi</button>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Traži korisnika po imenu, emailu ili postrojbi..." 
                value={userSearchTerm} 
                onChange={(e) => setUserSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4">Korisničko ime</th>
                  <th className="p-4">Postrojba</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Datum registracije</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingUsers ? (
                  <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-purple-600" /></td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-900">{u.username}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-indigo-700 font-black text-[11px] uppercase">
                        <Shield size={14} className="text-indigo-400" />
                        {u.unit || <span className="text-gray-300 font-normal italic">Nije uneseno</span>}
                      </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm">{u.email}</td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(u.createdAt).toLocaleDateString('hr-HR')}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${u.confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {u.confirmed ? 'Potvrđen' : 'Na čekanju'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB: NARUDŽBE --- */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-4 md:p-6 bg-gray-50 border-b space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-black flex items-center gap-2 uppercase tracking-tight"><ShoppingCart className="text-purple-600 w-5 h-5" /> Narudžbe ({filteredOrders.length})</h2>
              <button onClick={loadOrders} className="text-xs md:text-sm text-blue-600 hover:underline font-bold uppercase tracking-widest">Osvježi</button>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Traži kupca, adresu ili artikl..." 
                value={orderSearchTerm} 
                onChange={(e) => setOrderSearchTerm(e.target.value)} 
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="hidden md:table w-full text-left">
              <thead className="bg-gray-100 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Kupac / Adresa</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Iznos</th>
                  <th className="p-4">Tracking</th>
                  <th className="p-4">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-300">#{order.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{order.users_permissions_user?.username || extractName(order.Adresa_dostave)}</div>
                      <div className="text-[11px] text-gray-500 max-w-[250px] whitespace-pre-wrap leading-tight mt-1">{order.Adresa_dostave}</div>
                      <button onClick={() => {navigator.clipboard.writeText(order.Adresa_dostave); alert('Kopirano!');}} className="text-[10px] bg-gray-200 px-2 py-0.5 rounded mt-2 hover:bg-gray-300 flex items-center gap-1 font-bold uppercase"><Clipboard className="w-3 h-3"/> Kopiraj</button>
                    </td>
                    <td className="p-4">
                      <select 
                        defaultValue={order.Status_posiljke}
                        onChange={(e) => updateOrder(order.documentId, { Status_posiljke: e.target.value })}
                        className={`text-[10px] font-black p-2 rounded-lg border outline-none uppercase ${getStatusStyle(order.Status_posiljke)}`}
                      >
                        <option value="na čekanju">Na čekanju</option>
                        <option value="plaćeno">Plaćeno</option>
                        <option value="poslano">Poslano</option>
                        <option value="završeno">Završeno</option>
                        <option value="otkazano">Otkazano</option>
                      </select>
                    </td>
                    <td className="p-4 font-black text-lg text-indigo-700">{order.Ukupna_cijena} €</td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        placeholder="Broj..." 
                        defaultValue={order.Tracking_broj || ''}
                        onBlur={(e) => {
                          if(e.target.value !== (order.Tracking_broj || '')) {
                            updateOrder(order.documentId, { Tracking_broj: e.target.value });
                          }
                        }}
                        className="text-xs border p-2 rounded-lg w-full max-w-[140px] focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                      />
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => setSelectedOrderProducts(Array.isArray(order.Proizvodi) ? order.Proizvodi : [])}
                        className="text-[10px] font-black uppercase tracking-wider bg-white border-2 border-purple-100 text-purple-600 px-3 py-2 rounded-xl hover:bg-purple-600 hover:text-white transition shadow-sm"
                      >
                        Artikli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map(order => (
                <div key={order.id} className="p-4 space-y-4">
                   <div className="flex justify-between items-start">
                      <span className="font-black text-gray-300 text-xs">#{order.id}</span>
                      <span className="font-black text-indigo-700 text-lg">{order.Ukupna_cijena} €</span>
                   </div>
                   <div>
                      <div className="font-black text-gray-900">{order.users_permissions_user?.username || extractName(order.Adresa_dostave)}</div>
                      <div className="text-[11px] text-gray-500 mt-1 line-clamp-2 italic">{order.Adresa_dostave}</div>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Status pošiljke</label>
                        <select 
                          defaultValue={order.Status_posiljke}
                          onChange={(e) => updateOrder(order.documentId, { Status_posiljke: e.target.value })}
                          className={`w-full text-[11px] font-black p-3 rounded-xl border outline-none uppercase ${getStatusStyle(order.Status_posiljke)}`}
                        >
                          <option value="na čekanju">Na čekanju</option>
                          <option value="plaćeno">Plaćeno</option>
                          <option value="poslano">Poslano</option>
                          <option value="završeno">Završeno</option>
                          <option value="otkazano">Otkazano</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><Truck size={10}/> Tracking broj</label>
                        <input 
                          type="text" 
                          placeholder="Unesi broj za praćenje..." 
                          defaultValue={order.Tracking_broj || ''}
                          onBlur={(e) => {
                            if(e.target.value !== (order.Tracking_broj || '')) {
                              updateOrder(order.documentId, { Tracking_broj: e.target.value });
                            }
                          }}
                          className="w-full text-xs border-2 border-gray-100 p-3 rounded-xl outline-none focus:border-purple-300 font-bold bg-gray-50"
                        />
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedOrderProducts(Array.isArray(order.Proizvodi) ? order.Proizvodi : [])}
                        className="flex-1 text-[10px] font-black uppercase tracking-widest bg-purple-600 text-white p-3 rounded-xl shadow-md shadow-purple-100"
                      >
                        Vidi Artikle
                      </button>
                      <button 
                        onClick={() => {navigator.clipboard.writeText(order.Adresa_dostave); alert('Adresa kopirana!');}}
                        className="p-3 bg-gray-100 rounded-xl text-gray-600"
                      >
                        <Clipboard size={18} />
                      </button>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: POSTAVKE --- */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-[2rem] shadow-lg p-6 md:p-10 max-w-2xl mx-auto md:mx-0 border border-gray-100">
          <h2 className="text-xl md:text-2xl font-black text-gray-800 mb-8 text-center md:text-left uppercase tracking-tight">Postavke Trgovine</h2>
          <div className={`p-6 rounded-[1.5rem] border-2 transition-all flex items-center justify-between ${shopEnabled ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${shopEnabled ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-gray-800 text-sm md:text-base uppercase">Status Shopa</h3>
                <p className={`text-[10px] md:text-xs font-black p-1 px-2 rounded-md inline-block mt-1 ${shopEnabled ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                  {shopEnabled ? 'UKLJUČEN' : 'ISKLJUČEN'}
                </p>
              </div>
            </div>
            <button onClick={toggleShop} className={`relative h-10 w-20 rounded-full transition-colors duration-300 ${shopEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
              <div className={`absolute top-1 left-1 bg-white w-8 h-8 rounded-full transition-transform duration-300 shadow-md ${shopEnabled ? 'translate-x-10' : ''}`} />
            </button>
          </div>
          <div className="mt-10 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
            <p className="text-xs md:text-sm text-indigo-900 font-black mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Info size={16} /> Važne informacije:
            </p>
            <ul className="text-[11px] md:text-xs text-indigo-800/70 space-y-3 font-bold uppercase tracking-wider">
              <li className="flex items-start gap-3"><span className="text-indigo-400">●</span> Isključivanjem shopa, navigacija se automatski skriva.</li>
              <li className="flex items-start gap-3"><span className="text-indigo-400">●</span> Svi podaci o proizvodima ostaju spremljeni.</li>
              <li className="flex items-start gap-3"><span className="text-indigo-400">●</span> Narudžbe i dalje možete obrađivati ovdje.</li>
            </ul>
          </div>
        </div>
      )}

      {/* --- MODAL ZA PROIZVODE --- */}
      {selectedOrderProducts && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center z-[100] p-0 md:p-4">
          <div className="bg-white rounded-t-[2.5rem] md:rounded-[2rem] shadow-2xl max-w-2xl w-full overflow-hidden animate-in slide-in-from-bottom duration-300">
            <div className="p-6 md:p-8 border-b flex justify-between items-center">
              <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2 uppercase tracking-tighter"><Package className="text-purple-600" /> Detalji Narudžbe</h3>
              <button onClick={() => setSelectedOrderProducts(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition"><X /></button>
            </div>
            <div className="p-6 md:p-8 max-h-[70vh] md:max-h-[60vh] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-gray-400 font-black uppercase tracking-widest border-b">
                    <th className="pb-4 text-left">Artikl</th>
                    <th className="pb-4 text-center">Kol.</th>
                    <th className="pb-4 text-right">Cijena</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {selectedOrderProducts.map((p, i) => (
                    <tr key={i} className="text-sm">
                      <td className="py-5">
                        <div className="font-black text-gray-800 uppercase tracking-tight">{p.naziv}</div>
                        <div className="text-[10px] text-purple-600 font-black uppercase mt-1">Veličina: {p.velicina || '—'}</div>
                      </td>
                      <td className="py-5 text-center font-black text-gray-400">{p.kolicina}x</td>
                      <td className="py-5 text-right font-black text-gray-900">{p.cijena} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 md:p-8 bg-gray-50 border-t">
              <button onClick={() => setSelectedOrderProducts(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all">Zatvori pregled</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;