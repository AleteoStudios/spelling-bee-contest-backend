import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
     // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://aleteostudios.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Responder rápido las preflight
  }
  // --- fin CORS ---
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('price_mxn', { ascending: true });

    if (error) {
      console.error('Error consultando packages:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    return res.status(200).json({
      ok: true,
      packages: data,
    });
  } catch (err) {
    console.error('Error inesperado /api/packages:', err);
    return res.status(500).json({ ok: false, error: 'Error interno' });
  }
}
