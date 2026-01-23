export default async function handler(request, response) {
  return response.status(200).json({
    ok: true,
    service: 'spelling-bee-backend',
    message: 'Backend funcionando (endpoint /api/health)',
    time: new Date().toISOString(),
  });
}
