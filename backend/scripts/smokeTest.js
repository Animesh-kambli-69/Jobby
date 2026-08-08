const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000/api';

const results = [];

function addResult(name, ok, detail = {}) {
  results.push({ name, ok, detail });
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch (error) {
    body = { raw: text };
  }

  return { response, body };
}

function printResults() {
  console.log('\nSMOKE TEST RESULTS');
  for (const item of results) {
    const status = item.ok ? 'PASS' : 'FAIL';
    console.log(`- [${status}] ${item.name} ${JSON.stringify(item.detail)}`);
  }
}

async function run() {
  try {
    const health = await jsonRequest(`${API_BASE}/health`);
    addResult('health endpoint', health.response.ok && health.body?.status === 'ok', {
      status: health.response.status,
      message: health.body?.message
    });

    const stamp = Date.now();
    const candidateEmail = `smoke_candidate_${stamp}@example.com`;
    const candidatePassword = 'Test@12345';

    const candidateRegister = await jsonRequest(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Candidate',
        email: candidateEmail,
        password: candidatePassword,
        role: 'candidate'
      })
    });
    addResult('candidate register', candidateRegister.response.status === 201 && candidateRegister.body?.success, {
      status: candidateRegister.response.status,
      message: candidateRegister.body?.message
    });

    const candidateLogin = await jsonRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidateEmail, password: candidatePassword })
    });
    const candidateToken = candidateLogin.body?.token;
    addResult('candidate login', candidateLogin.response.ok && candidateLogin.body?.success && Boolean(candidateToken), {
      status: candidateLogin.response.status,
      role: candidateLogin.body?.user?.role
    });

    const invalidLogin = await jsonRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: candidateEmail, password: 'WrongPass123' })
    });
    addResult('candidate invalid login rejected', invalidLogin.response.status === 401 && invalidLogin.body?.success === false, {
      status: invalidLogin.response.status,
      message: invalidLogin.body?.message
    });

    const fd = new FormData();
    fd.append('resumeText', 'Smoke User\\nEmail: smoke@example.com\\nSkills: JavaScript, React, Node.js, MongoDB\\nExperience: 2 years');

    const profileUpdate = await jsonRequest(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${candidateToken}` },
      body: fd
    });
    const skillsCount = Array.isArray(profileUpdate.body?.user?.skills) ? profileUpdate.body.user.skills.length : 0;
    addResult('candidate profile update with resume parsing', profileUpdate.response.ok && profileUpdate.body?.success && skillsCount > 0, {
      status: profileUpdate.response.status,
      skillsCount
    });

    const jobsAll = await jsonRequest(`${API_BASE}/jobs/all`);
    const jobs = Array.isArray(jobsAll.body?.jobs) ? jobsAll.body.jobs : [];
    addResult('jobs list', jobsAll.response.ok && jobsAll.body?.success && jobs.length > 0, {
      status: jobsAll.response.status,
      count: jobs.length
    });

    if (jobs.length > 0) {
      const payload = {
        jobId: jobs[0]._id,
        candidateName: 'Smoke Candidate',
        candidateEmail,
        candidateSkills: ['JavaScript', 'React'],
        resume: 'Smoke resume'
      };

      const firstApply = await jsonRequest(`${API_BASE}/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const secondApply = await jsonRequest(`${API_BASE}/applications/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      addResult('application first submit', firstApply.response.status === 201 && firstApply.body?.success, {
        status: firstApply.response.status
      });
      addResult('application duplicate blocked', secondApply.response.status === 409 && secondApply.body?.success === false, {
        status: secondApply.response.status,
        message: secondApply.body?.message
      });
    }

    const recruiterEmail = `smoke_recruiter_${stamp}@corp.com`;
    const recruiterPassword = 'StrongPass1';

    const recruiterRegister = await jsonRequest(`${API_BASE}/recruiter-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Recruiter',
        email: recruiterEmail,
        password: recruiterPassword,
        company: 'Smoke Corp'
      })
    });
    addResult('recruiter register', recruiterRegister.response.status === 201 && recruiterRegister.body?.success, {
      status: recruiterRegister.response.status,
      message: recruiterRegister.body?.message
    });

    const recruiterLogin = await jsonRequest(`${API_BASE}/recruiter-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: recruiterEmail, password: recruiterPassword })
    });
    const recruiterToken = recruiterLogin.body?.token;
    addResult('recruiter login', recruiterLogin.response.ok && recruiterLogin.body?.success && Boolean(recruiterToken), {
      status: recruiterLogin.response.status,
      role: recruiterLogin.body?.user?.role
    });

    const recruiterSummary = await jsonRequest(`${API_BASE}/recruiter-auth/summary`, {
      headers: { Authorization: `Bearer ${recruiterToken}` }
    });
    addResult('recruiter summary', recruiterSummary.response.ok && recruiterSummary.body?.success, {
      status: recruiterSummary.response.status,
      totalApplications: recruiterSummary.body?.summary?.totalApplications,
      uniqueCandidates: recruiterSummary.body?.summary?.uniqueCandidates
    });

    const candidateTryingRecruiterEndpoint = await jsonRequest(`${API_BASE}/recruiter-auth/me`, {
      headers: { Authorization: `Bearer ${candidateToken}` }
    });
    addResult('role isolation on recruiter endpoint', candidateTryingRecruiterEndpoint.response.status === 403, {
      status: candidateTryingRecruiterEndpoint.response.status,
      message: candidateTryingRecruiterEndpoint.body?.message
    });

    printResults();

    const failures = results.filter((item) => !item.ok);
    if (failures.length > 0) {
      console.error('\nSMOKE TEST FAILED');
      process.exit(1);
    }

    console.log('\nSMOKE TEST PASSED');
  } catch (error) {
    console.error('\nSMOKE TEST CRASHED');
    console.error(error.stack || error.message || String(error));
    process.exit(1);
  }
}

run();
