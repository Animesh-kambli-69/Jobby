export const calculateResumeScore = (data) => {
  if (!data) return 0;

  const exp = (data.experience || '').toLowerCase();
  const yrs = parseInt(exp.match(/(\d+)/)?.[1] || 0);
  const expScore = yrs >= 5 ? 100 : yrs >= 2 ? 75 : yrs >= 1 ? 50 : 35;

  const skillCount = (data.skills || []).length;
  const skillsScore = Math.min(100, skillCount * 5);

  let content = 0;
  if (data.name && data.name !== 'Unknown') content += 20;
  if (data.email && data.email.includes('@')) content += 20;
  if (data.phone) content += 15;
  if (data.education) content += 25;
  if (data.summary?.length > 20) content += 20;

  return Math.round(Math.min(100, expScore * 0.3 + skillsScore * 0.4 + content * 0.3));
};

export const getScoreLabel = (score) => {
  if (score >= 85) return { label: 'Excellent', color: '#10b981' };
  if (score >= 70) return { label: 'Very Good', color: '#9fa7ff' };
  if (score >= 55) return { label: 'Good', color: '#3adffa' };
  if (score >= 40) return { label: 'Average', color: '#f59e0b' };
  return { label: 'Needs Improvement', color: '#ef4444' };
};
