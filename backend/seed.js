import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Job from './models/Job.js';
import Application from './models/Application.js';
import { generateEmbedding } from './services/groqService.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Job.deleteMany({});
    await Application.deleteMany({});
    console.log('🗑️  Cleared existing data');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const candidates = [
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: hashedPassword,
        role: 'candidate',
        phone: '+1-555-0101',
        skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'TypeScript', 'Express', 'HTML', 'CSS'],
        experience: '5 years',
        education: 'Bachelor of Computer Science',
        summary: 'Experienced full-stack developer with a passion for building scalable web applications. Strong expertise in React and Node.js ecosystems.',
        profileLinks: {
          github: 'https://github.com/alicejohnson',
          linkedin: 'https://linkedin.com/in/alicejohnson',
          leetcode: 'https://leetcode.com/alicejohnson',
          portfolio: 'https://alice.dev'
        },
        resumeScore: 85
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: hashedPassword,
        role: 'candidate',
        phone: '+1-555-0102',
        skills: ['Python', 'Django', 'Machine Learning', 'TensorFlow', 'PostgreSQL', 'Docker', 'AWS'],
        experience: '7 years',
        education: 'Master of Computer Science',
        summary: 'Senior backend developer and ML engineer with expertise in Python and cloud technologies. Led multiple successful data-driven projects.',
        profileLinks: {
          github: 'https://github.com/bobsmith',
          linkedin: 'https://linkedin.com/in/bobsmith'
        },
        resumeScore: 92
      },
      {
        name: 'Carol White',
        email: 'carol@example.com',
        password: hashedPassword,
        role: 'candidate',
        phone: '+1-555-0103',
        skills: ['Java', 'Spring Boot', 'Microservices', 'Kubernetes', 'MySQL', 'Redis'],
        experience: '4 years',
        education: 'Bachelor in Information Technology',
        summary: 'Backend developer specializing in Java and microservices architecture. Experience with high-traffic systems.',
        profileLinks: {
          github: 'https://github.com/carolwhite',
          linkedin: 'https://linkedin.com/in/carolwhite'
        },
        resumeScore: 78
      },
      {
        name: 'David Lee',
        email: 'david@example.com',
        password: hashedPassword,
        role: 'candidate',
        phone: '+1-555-0104',
        skills: ['React', 'Vue', 'Angular', 'JavaScript', 'CSS', 'Sass', 'Webpack', 'Figma'],
        experience: '3 years',
        education: 'Bachelor of Design and Computer Science',
        summary: 'Frontend developer with a strong design sense. Creates beautiful, performant user interfaces.',
        profileLinks: {
          github: 'https://github.com/davidlee',
          portfolio: 'https://davidlee.design'
        },
        resumeScore: 72
      },
      {
        name: 'Emma Davis',
        email: 'emma@example.com',
        password: hashedPassword,
        role: 'candidate',
        phone: '+1-555-0105',
        skills: ['DevOps', 'Docker', 'Kubernetes', 'Jenkins', 'AWS', 'Terraform', 'Linux', 'Python'],
        experience: '6 years',
        education: 'Bachelor in Computer Engineering',
        summary: 'DevOps engineer with extensive experience in cloud infrastructure and CI/CD pipelines.',
        profileLinks: {
          github: 'https://github.com/emmadavis',
          linkedin: 'https://linkedin.com/in/emmadavis'
        },
        resumeScore: 88
      }
    ];

    for (const candidate of candidates) {
      const skillsText = candidate.skills.join(', ');
      candidate.skillsEmbedding = await generateEmbedding(skillsText);
    }

    const createdCandidates = await User.insertMany(candidates);
    console.log(`✅ Created ${createdCandidates.length} candidates`);

    const recruiters = [
      {
        name: 'Tech Corp Recruiter',
        email: 'recruiter@techcorp.com',
        password: hashedPassword,
        role: 'recruiter',
        company: 'Tech Corp'
      },
      {
        name: 'Startup Inc HR',
        email: 'hr@startupinc.com',
        password: hashedPassword,
        role: 'recruiter',
        company: 'Startup Inc'
      }
    ];

    const createdRecruiters = await User.insertMany(recruiters);
    console.log(`✅ Created ${createdRecruiters.length} recruiters`);

    const jobs = [
      {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced full-stack developer to join our growing team. You will work on building scalable web applications using modern technologies.',
        company: 'Tech Corp',
        location: 'San Francisco, CA (Remote)',
        salary: '$120,000 - $160,000',
        requiredSkills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'AWS'],
        status: 'active'
      },
      {
        title: 'Machine Learning Engineer',
        description: 'Join our AI team to build cutting-edge machine learning models. Experience with Python, TensorFlow, and cloud platforms required.',
        company: 'AI Innovations',
        location: 'Remote',
        salary: '$140,000 - $180,000',
        requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Docker', 'AWS'],
        status: 'active'
      },
      {
        title: 'Frontend Developer',
        description: 'Create beautiful and responsive user interfaces using React and modern CSS. Work with designers to bring mockups to life.',
        company: 'Design Studio',
        location: 'New York, NY',
        salary: '$90,000 - $120,000',
        requiredSkills: ['React', 'JavaScript', 'CSS', 'HTML', 'Figma'],
        status: 'active'
      },
      {
        title: 'DevOps Engineer',
        description: 'Manage and optimize our cloud infrastructure. Set up CI/CD pipelines and ensure system reliability.',
        company: 'Cloud Services Inc',
        location: 'Austin, TX (Hybrid)',
        salary: '$110,000 - $150,000',
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Jenkins', 'Terraform'],
        status: 'active'
      },
      {
        title: 'Backend Java Developer',
        description: 'Build robust microservices using Java Spring Boot. Experience with distributed systems preferred.',
        company: 'Enterprise Corp',
        location: 'Boston, MA',
        salary: '$100,000 - $140,000',
        requiredSkills: ['Java', 'Spring Boot', 'Microservices', 'MySQL', 'Kubernetes'],
        status: 'active'
      }
    ];

    for (const job of jobs) {
      const skillsText = job.requiredSkills.join(', ');
      job.skillsEmbedding = await generateEmbedding(skillsText);
    }

    const createdJobs = await Job.insertMany(jobs);
    console.log(`✅ Created ${createdJobs.length} jobs`);

    console.log('\n📊 Seed Data Summary:');
    console.log(`   Candidates: ${createdCandidates.length}`);
    console.log(`   Recruiters: ${createdRecruiters.length}`);
    console.log(`   Jobs: ${createdJobs.length}`);
    console.log('\n🔑 Test Credentials:');
    console.log('   Candidate: alice@example.com / password123');
    console.log('   Recruiter: recruiter@techcorp.com / password123');

    await mongoose.disconnect();
    console.log('\n✅ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
