// api/checkout-mp.js
import { MercadoPagoConfig, Preference } from "mercadopago";
import { createClient } from "@supabase/supabase-js";

// === Supabase ======================================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Falta SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY/ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// === Mercado Pago ==================================================
// Usa tu Access Token de producción o de prueba
const mpAccessToken = process.env.MP_ACCESS_TOKEN;

if (!mpAccessToken) {
    console.warn("⚠️ Falta MP_ACCESS_TOKEN en las variables de entorno");
}

// Cliente de Mercado Pago (SDK nuevo)
const mpClient = new MercadoPagoConfig({
    accessToken: mpAccessToken,
});

const preference = new Preference(mpClient);

// ===================================================================
// Serverless function para Vercel
export default async function handler(req, res) {
    try {
        if (req.method !== "GET") {
            res.status(405).json({ ok: false, error: "Method not allowed" });
            return;
        }

        const { package_id, email } = req.query;

        if (!package_id || !email) {
            res
                .status(400)
                .json({ ok: false, error: "Faltan parámetros package_id o email" });
            return;
        }

        // 1) Buscar el paquete en Supabase
        const { data: pkg, error: pkgError } = await supabase
            .from("packages")
            .select("*")
            .eq("id", package_id)
            .maybeSingle();

        if (pkgError) {
            console.error("Error Supabase:", pkgError);
            res.status(500).json({ ok: false, error: "Error leyendo paquetes" });
            return;
        }

        if (!pkg) {
            res.status(404).json({ ok: false, error: "Paquete no encontrado" });
            return;
        }

        // 2) Crear la preferencia en Mercado Pago (SDK nuevo)
        const prefResult = await preference.create({
            body: {
                items: [
                    {
                        id: pkg.id,
                        title: pkg.name,
                        quantity: 1,
                        currency_id: "MXN",
                        unit_price: pkg.price_mxn,
                    },
                ],
                payer: {
                    email,
                },
                metadata: {
                    package_id: pkg.id,
                    contact_email: email,
                },
                back_urls: {
                    success:
                        "https://aleteostudios.github.io/spelling-bee-contest-landing/gracias.html",
                    failure:
                        "https://aleteostudios.github.io/spelling-bee-contest-landing/error.html",
                    pending:
                        "https://aleteostudios.github.io/spelling-bee-contest-landing/pending.html",
                },
                auto_return: "approved",
                // (opcional) URL para webhooks/notificaciones:
                // notification_url: "https://spelling-bee-contest-backend.vercel.app/api/mp-webhook",
            },
        });

        // La forma exacta de la respuesta puede variar; tomamos el init_point
        const pref =
            prefResult && typeof prefResult === "object" ? prefResult : {};
        const initPoint =
            pref.init_point ??
            pref.sandbox_init_point ??
            pref.body?.init_point ??
            pref.body?.sandbox_init_point ??
            null;

        res.status(200).json({
            ok: true,
            package: {
                id: pkg.id,
                name: pkg.name,
                price_mxn: pkg.price_mxn,
            },
            preference: pref,
            init_point: initPoint,
        });
    } catch (err) {
        console.error("Error en /api/checkout-mp:", err);
        res
            .status(500)
            .json({ ok: false, error: err.message ?? "Error interno del servidor" });
    }
}
