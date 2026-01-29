import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
     // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', 'https://aleteostudios.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // --- fin CORS ---
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ ok: false, error: 'Method not allowed' });
        }

        const { package_id, email } = req.query;

        if (!package_id) {
            return res.status(400).json({ ok: false, error: 'Falta package_id' });
        }

        // 1. Buscar el paquete en Supabase
        const { data: pkg, error } = await supabaseAdmin
            .from('packages')
            .select('*')
            .eq('id', package_id)
            .single();

        if (error || !pkg) {
            return res
                .status(404)
                .json({ ok: false, error: 'Paquete no encontrado' });
        }

        // 2. Armar un “checkout” de prueba
        const response = {
            ok: true,
            mode: 'test',
            package: {
                id: pkg.id,
                name: pkg.name,
                price_mxn: pkg.price_mxn,
                duration_days: pkg.duration_days,
            },
            contact_email: email || null,
            // Esto luego lo reemplazamos por la URL real de Mercado Pago
            fake_payment_url: `https://example.com/pago-fake?pkg=${encodeURIComponent(
                pkg.id
            )}`,
        };

        return res.status(200).json(response);
    } catch (err) {
        console.error('Error en /api/checkout-test:', err);
        return res.status(500).json({ ok: false, error: 'Error interno' });
    }
}
