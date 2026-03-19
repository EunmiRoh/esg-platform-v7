export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: 'Supabase not configured' });

  try {
    const { company, result } = req.body;
    if (!company || !result) return res.status(400).json({ error: 'company and result required' });

    const response = await fetch(`${supabaseUrl}/rest/v1/diagnosis_results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        company_name: company.name,
        company_biz: company.biz || '',
        company_size: company.size,
        company_industry: company.industry,
        score: result.score,
        grade: result.grade,
        grade_label: result.label,
        e_score: result.eA,
        s_score: result.sA,
        g_score: result.gA,
        strong_count: result.strong,
        weak_count: result.weak,
        answers: result.orig,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: err });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
