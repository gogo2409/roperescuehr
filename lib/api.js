// lib/api.js - PRIVREMENO HARDKODIRANA ADRESA!

import axios from 'axios';

// HARDKODIRANA ADRESA:
const API_URL = 'http://localhost:1337/api'; 

// Funkcija za dohvaćanje podataka iz Strapi API-ja
export async function fetchAPI(path) {
  const requestUrl = `${API_URL}${path}`;

  try {
    const response = await axios.get(requestUrl);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
        console.error('API Fetch Error: Provjerite permisije za /moduls u Strapiju!');
    } else {
        console.error('API Fetch Error:', error.message);
    }
    throw new Error(`Failed to fetch data from ${requestUrl}`);
  }
}