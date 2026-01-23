import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
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
