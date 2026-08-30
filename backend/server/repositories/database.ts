/**
 * 🇧🇩 রিপোজিটরি প্যাটার্ন (Repository Pattern & Data Store):
 * এই ফাইলটি অ্যাপ্লিকেশনের সেন্ট্রাল ডেটা স্টোর হিসেবে কাজ করে।
 * এটি মেমোরিতে স্টেট রাখে এবং সার্ভার রিস্টার্টের সময় ডেটা ধরে রাখতে লোকাল ফাইলে অটো-সিঙ্ক করে।
 * চারটি রোলের ডেমো ইউজার, কোর্স, লেসন, কুইজ এবং ব্লগ দিয়ে প্রি-সিড করা থাকে।
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSchema, VerificationCode } from '../types';
import { User, Course, Lesson, Quiz, QuizSubmission, Enrollment, StudentCourseProgress, BlogPost, AuditLog, UserSession } from '../../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lms-store.json');

// 🇧🇩 প্রাথমিক ডেমো ডেটাসেট (Pre-seeded Demo Dataset for testing 4-role access)
const initialSeedData: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin_01',
      name: 'Tanvir Ahmed (Admin)',
      email: 'admin@lms.com',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      headline: 'System Administrator & Enterprise Cloud Architect',
      phone: '+880 1712-345678',
      location: 'Dhaka, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://educore.io',
      interests: ['Cloud Architecture', 'RBAC Security', 'TypeScript', 'DevOps'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Platform Administrator with superuser privileges across system and role assignments.',
      createdAt: '2026-08-01T00:00:00.000Z',
    },
    {
      id: 'usr_cm_01',
      name: 'Farhana Rahman (Content Manager)',
      email: 'content@lms.com',
      role: 'content_manager',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      headline: 'Curriculum Director & Senior Technical Editor',
      phone: '+880 1819-456789',
      location: 'Chittagong, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://farhana-rahman.dev',
      interests: ['Curriculum Design', 'Instructional Tech', 'Content Strategy'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Curriculum architect and blog editor managing all platform courses and publications.',
      createdAt: '2026-08-05T00:00:00.000Z',
    },
    {
      id: 'usr_inst_01',
      name: 'Dr. Rafiqul Islam (Instructor)',
      email: 'instructor@lms.com',
      role: 'instructor',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      headline: 'Professor of Computer Science & Fullstack Architect',
      phone: '+880 1911-889900',
      location: 'Dhaka, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://dr-rafiqul.edu',
      interests: ['Distributed Systems', 'TypeScript', 'Clean Architecture', 'Algorithms'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Senior Fullstack Software Architect specializing in TypeScript, Next.js & System Design.',
      createdAt: '2026-08-10T00:00:00.000Z',
    },
    {
      id: 'usr_inst_02',
      name: 'Nusrat Jahan (Instructor)',
      email: 'nusrat@lms.com',
      role: 'instructor',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      headline: 'DevOps Specialist & Quality Assurance Lead',
      phone: '+880 1612-554433',
      location: 'Sylhet, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://nusratjahan.io',
      interests: ['Docker', 'CI/CD Pipelines', 'Cloud Infrastructure', 'Automation'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Cloud Architect & DevOps Specialist with focus on Strapi, Docker and Railway deployment.',
      createdAt: '2026-08-12T00:00:00.000Z',
    },
    {
      id: 'usr_stud_01',
      name: 'Shakib Al Hasan (Student)',
      email: 'student@lms.com',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      headline: 'Software Engineering Major | Fullstack Aspirant',
      phone: '+880 1711-223344',
      location: 'Dhaka, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://shakibalhasan.dev',
      interests: ['React', 'Next.js', 'Physics', 'Circuits', 'Data Structures'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Aspiring Software Engineer taking fullstack web development and distributed systems.',
      createdAt: '2026-08-15T00:00:00.000Z',
      enrolledCourseIds: ['crs_physics_01', 'crs_fullstack_06', 'crs_programming_05'],
    },
    {
      id: 'usr_stud_02',
      name: 'Amina Khatun (Student)',
      email: 'amina@lms.com',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      headline: 'UI/UX Designer & Frontend Developer',
      phone: '+880 1515-998877',
      location: 'Rajshahi, Bangladesh',
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      website: 'https://aminakhatun.design',
      interests: ['UI/UX', 'Tailwind CSS', 'Mathematics', 'Digital ICT'],
      notifications: { emailAnnouncements: true, quizReminders: true, newCourseAlerts: true },
      bio: 'Frontend enthusiast exploring React design patterns and TypeScript architectures.',
      createdAt: '2026-08-18T00:00:00.000Z',
      enrolledCourseIds: ['crs_math_03', 'crs_ict_04'],
    }
  ],
  courses: [
    {
      id: 'crs_physics_01',
      title: 'Physics: Classical Mechanics, Waves & Modern Quantum Theory',
      slug: 'physics-classical-mechanics-waves-quantum',
      description: 'Comprehensive study of Newtonian kinematics, rotational dynamics, harmonic oscillations, electromagnetic waves, and introductory quantum mechanics.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&auto=format&fit=crop&q=80',
      category: 'Pure & Applied Sciences',
      level: 'Intermediate',
      instructorId: 'usr_inst_01',
      instructorName: 'Dr. Rafiqul Islam',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 85,
      isPublished: true,
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
      tags: ['Physics', 'Mechanics', 'Waves', 'Quantum', 'Thermodynamics'],
    },
    {
      id: 'crs_chemistry_02',
      title: 'Chemistry: Organic Synthesis, Chemical Bonding & Kinetics',
      slug: 'chemistry-organic-synthesis-bonding-kinetics',
      description: 'Master organic reaction mechanisms, atomic orbitals, chemical thermodynamics, stoichiometry, equilibrium constants, and spectroscopy.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=600&auto=format&fit=crop&q=80',
      category: 'Pure & Applied Sciences',
      level: 'Intermediate',
      instructorId: 'usr_cm_01',
      instructorName: 'Farhana Rahman',
      instructorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 90,
      isPublished: true,
      createdAt: '2026-08-16T10:00:00.000Z',
      updatedAt: '2026-08-21T10:00:00.000Z',
      tags: ['Chemistry', 'Organic', 'Bonding', 'Kinetics', 'Equilibrium'],
    },
    {
      id: 'crs_math_03',
      title: 'Math: Multivariable Calculus, Linear Algebra & Discrete Structures',
      slug: 'math-multivariable-calculus-linear-algebra',
      description: 'Rigorous mathematical foundations: partial derivatives, vector spaces, matrix eigenvalues, combinatorics, proof methods, and graph theory.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      category: 'Mathematical Sciences',
      level: 'Advanced',
      instructorId: 'usr_inst_01',
      instructorName: 'Dr. Rafiqul Islam',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 95,
      isPublished: true,
      createdAt: '2026-08-17T10:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z',
      tags: ['Calculus', 'Linear Algebra', 'Discrete Math', 'Vectors'],
    },
    {
      id: 'crs_ict_04',
      title: 'ICT: Information & Communication Technology in the Digital Age',
      slug: 'ict-information-communication-technology',
      description: 'Foundations of computer systems, digital networking, cybersecurity protocols, cloud infrastructure, relational databases, and internet ethics.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      category: 'Information Technology',
      level: 'Beginner',
      instructorId: 'usr_inst_02',
      instructorName: 'Nusrat Jahan',
      instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 75,
      isPublished: true,
      createdAt: '2026-08-18T10:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z',
      tags: ['ICT', 'Networking', 'Cybersecurity', 'Database', 'Cloud'],
    },
    {
      id: 'crs_programming_05',
      title: 'Programming: C++, Python & Algorithmic Problem Solving',
      slug: 'programming-cpp-python-problem-solving',
      description: 'Hands-on programming mastery: memory management, pointers, object-oriented programming (OOP), recursion, data structures, and algorithmic complexity.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=80',
      category: 'Computer Science',
      level: 'Beginner',
      instructorId: 'usr_inst_01',
      instructorName: 'Dr. Rafiqul Islam',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 105,
      isPublished: true,
      createdAt: '2026-08-19T10:00:00.000Z',
      updatedAt: '2026-08-23T10:00:00.000Z',
      tags: ['C++', 'Python', 'Algorithms', 'Data Structures', 'OOP'],
    },
    {
      id: 'crs_fullstack_06',
      title: 'Full Stack Development: Modern React, Next.js, Node.js & APIs',
      slug: 'full-stack-development-react-nextjs-nodejs',
      description: 'Build enterprise end-to-end applications with Next.js App Router, Server Actions, TypeScript, Tailwind CSS, PostgreSQL, and scalable microservices.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      category: 'Software Engineering',
      level: 'Intermediate',
      instructorId: 'usr_inst_01',
      instructorName: 'Dr. Rafiqul Islam',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 120,
      isPublished: true,
      createdAt: '2026-08-20T10:00:00.000Z',
      updatedAt: '2026-08-24T10:00:00.000Z',
      tags: ['Full Stack', 'Next.js', 'React', 'Node.js', 'TypeScript', 'REST API'],
    },
    {
      id: 'crs_design_patterns_07',
      title: 'Design Patterns & Clean Software Architecture',
      slug: 'design-patterns-clean-software-architecture',
      description: 'Master GoF Creational, Structural, Behavioral patterns, SOLID principles, Repository Pattern, Dependency Injection, and domain-driven design in TypeScript.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1516116211227-bbc1543b5936?w=600&auto=format&fit=crop&q=80',
      category: 'Software Architecture',
      level: 'Intermediate',
      instructorId: 'usr_inst_01',
      instructorName: 'Dr. Rafiqul Islam',
      instructorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 85,
      isPublished: true,
      createdAt: '2026-08-21T10:00:00.000Z',
      updatedAt: '2026-08-24T10:00:00.000Z',
      tags: ['Design Patterns', 'Architecture', 'SOLID', 'Clean Code', 'TypeScript'],
    },
    {
      id: 'crs_software_metrics_08',
      title: 'Software Metrics & Quality Assurance Engineering',
      slug: 'software-metrics-quality-assurance',
      description: 'Quantify software health: Cyclomatic Complexity, Code Coverage, Halstead metrics, Technical Debt analysis, Automated Unit Testing, and CI/CD Quality Gates.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      category: 'Software Engineering',
      level: 'Advanced',
      instructorId: 'usr_inst_02',
      instructorName: 'Nusrat Jahan',
      instructorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 90,
      isPublished: true,
      createdAt: '2026-08-22T10:00:00.000Z',
      updatedAt: '2026-08-24T10:00:00.000Z',
      tags: ['Software Metrics', 'QA', 'Cyclomatic Complexity', 'Testing', 'CI/CD'],
    },
    {
      id: 'crs_electronics_09',
      title: 'Electronics: Semiconductors, Transistor Circuits & Op-Amps',
      slug: 'electronics-semiconductors-transistors-opamps',
      description: 'Solid-state electronics: PN junction physics, BJT and MOSFET biasing, small-signal AC amplifiers, operational amplifiers (Op-Amps), and active filters.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=600&auto=format&fit=crop&q=80',
      category: 'Electrical & Hardware',
      level: 'Intermediate',
      instructorId: 'usr_admin_01',
      instructorName: 'Tanvir Ahmed',
      instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 80,
      isPublished: true,
      createdAt: '2026-08-23T10:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z',
      tags: ['Electronics', 'Semiconductors', 'Transistors', 'Op-Amps', 'Analog'],
    },
    {
      id: 'crs_circuits_10',
      title: 'Circuits: Electric Network Analysis & AC/DC Theory',
      slug: 'circuits-electric-network-analysis-ac-dc',
      description: 'Fundamental circuit laws: Ohm’s Law, Kirchhoff’s Current/Voltage Laws (KCL/KVL), Thevenin/Norton theorems, mesh/nodal analysis, and RLC resonance.',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
      category: 'Electrical & Hardware',
      level: 'Beginner',
      instructorId: 'usr_admin_01',
      instructorName: 'Tanvir Ahmed',
      instructorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      lessonsCount: 3,
      totalDurationMinutes: 75,
      isPublished: true,
      createdAt: '2026-08-24T10:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z',
      tags: ['Circuits', 'Ohm Law', 'Kirchhoff', 'AC/DC', 'RLC', 'Network Analysis'],
    }
  ],
  lessons: [
    // ----------------------------------------------------
    // 1. PHYSICS LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_phy_01',
      courseId: 'crs_physics_01',
      title: '1. Newtonian Mechanics & Rotational Dynamics',
      description: 'Understand kinematics, Newton’s laws of motion, work-energy theorem, and conservation of angular momentum.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Classical Mechanics & Equations of Motion
Newtonian mechanics describes the motion of macroscopic objects under the influence of force fields.

### Key Equations:
1. **Newton's Second Law**: $\\vec{F} = m \\vec{a} = \\frac{d\\vec{p}}{dt}$
2. **Work-Energy Theorem**: $W_{net} = \\Delta K = \\frac{1}{2} m v_f^2 - \\frac{1}{2} m v_i^2$
3. **Torque and Angular Momentum**: $\\vec{\\tau} = \\vec{r} \\times \\vec{F} = I \\vec{\\alpha}$

\`\`\`plaintext
🇧🇩 বাংলা নোট (Bangla Concept):
বস্তুর ভরবেগ পরিবর্তনের হার তার উপর প্রযুক্ত বলের সমানুপাতিক এবং বল যেদিকে ক্রিয়া করে ভরবেগের পরিবর্তনও সেদিকে ঘটে।
\`\`\`
`,
      order: 1,
      durationMinutes: 25,
      resources: [
        { title: 'Mechanics Formula Sheet', url: 'https://ocw.mit.edu' }
      ]
    },
    {
      id: 'lsn_phy_02',
      courseId: 'crs_physics_01',
      title: '2. Oscillations, Harmonic Motion & Wave Optics',
      description: 'Simple harmonic motion (SHM), wave equations, superposition, interference, and diffraction phenomena.',
      contentType: 'text',
      videoUrl: '',
      content: `## Wave Propagation & Simple Harmonic Motion
SHM is governed by linear restoring forces: $F = -kx$.

### Wave Properties:
- **Wave Velocity**: $v = f \\lambda$
- **Constructive Interference**: Path difference $\\Delta x = n \\lambda$
- **Destructive Interference**: Path difference $\\Delta x = (n + \\frac{1}{2}) \\lambda$
`,
      order: 2,
      durationMinutes: 30,
    },
    {
      id: 'lsn_phy_03',
      courseId: 'crs_physics_01',
      title: '3. Introduction to Quantum Theory & Photoelectric Effect',
      description: 'Wave-particle duality, Planck’s quantum hypothesis, Einstein’s photoelectric equation, and de Broglie wavelengths.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Quantum Foundations
Max Planck postulated that energy is quantized: $E = h\\nu$.

### Einstein's Photoelectric Equation:
$$E_k^{max} = h\\nu - \\Phi$$

Where $\\Phi$ is the material work function and $h$ is Planck's constant ($6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$).
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 2. CHEMISTRY LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_chem_01',
      courseId: 'crs_chemistry_02',
      title: '1. Chemical Bonding, Hybridization & Molecular Geometry',
      description: 'VSEPR theory, sp/sp2/sp3 hybridization, molecular orbital diagrams, and polarity.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Molecular Geometry & Hybridization
Covalent bonds form through orbital overlap. Hybridization explains directional bonding in hydrocarbons and complexes.

### Hybridization Table:
- **$sp^3$**: Tetrahedral geometry (109.5° bond angle) e.g., $CH_4$
- **$sp^2$**: Trigonal planar (120° bond angle) e.g., $C_2H_4$
- **$sp$**: Linear (180° bond angle) e.g., $C_2H_2$
`,
      order: 1,
      durationMinutes: 30,
    },
    {
      id: 'lsn_chem_02',
      courseId: 'crs_chemistry_02',
      title: '2. Organic Reaction Mechanisms (SN1, SN2, E1, E2)',
      description: 'Nucleophilic substitution and elimination pathways with stereochemistry inversion and carbocation stability.',
      contentType: 'text',
      videoUrl: '',
      content: `## Nucleophilic Substitution Pathways
- **$S_N1$ Mechanism**: Two-step reaction with carbocation intermediate (racemization).
- **$S_N2$ Mechanism**: Concerted bimolecular backside attack with Walden inversion.
`,
      order: 2,
      durationMinutes: 30,
    },
    {
      id: 'lsn_chem_03',
      courseId: 'crs_chemistry_02',
      title: '3. Chemical Kinetics, Rate Laws & Catalysis',
      description: 'Reaction order, Arrhenius equation, activation energy barrier, and transition state theory.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Arrhenius Equation & Activation Energy
$$k = A e^{-\\frac{E_a}{RT}}$$

Catalysts provide an alternative reaction mechanism with lower activation energy $E_a$, accelerating reaction rate without being consumed.
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 3. MATH LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_math_01',
      courseId: 'crs_math_03',
      title: '1. Multivariable Calculus & Gradient Vectors',
      description: 'Partial derivatives, directional derivatives, the gradient operator $\\nabla$, and Lagrange multipliers for optimization.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Vector Calculus & Gradients
The gradient points in the direction of greatest rate of increase of a scalar function:
$$\\nabla f(x, y, z) = \\left( \\frac{\\partial f}{\\partial x}, \\frac{\\partial f}{\\partial y}, \\frac{\\partial f}{\\partial z} \\right)$$
`,
      order: 1,
      durationMinutes: 30,
    },
    {
      id: 'lsn_math_02',
      courseId: 'crs_math_03',
      title: '2. Linear Algebra: Vector Spaces, Eigenvalues & SVD',
      description: 'Matrices as linear transformations, determinants, characteristic polynomials, and Singular Value Decomposition.',
      contentType: 'text',
      videoUrl: '',
      content: `## Eigenvalues & Eigenvectors
For a square matrix $A$, a non-zero vector $v$ satisfies:
$$A v = \\lambda v$$
where $\\lambda$ is the eigenvalue.
`,
      order: 2,
      durationMinutes: 35,
    },
    {
      id: 'lsn_math_03',
      courseId: 'crs_math_03',
      title: '3. Discrete Mathematics, Graph Theory & Combinatorics',
      description: 'Propositional logic, mathematical induction, Eulerian/Hamiltonian graphs, and recurrence relations.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Graph Theory Essentials
A Graph $G = (V, E)$ consists of vertices $V$ and edges $E$.
Handshaking Lemma: $\\sum_{v \\in V} \\text{deg}(v) = 2|E|$.
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 4. ICT LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_ict_01',
      courseId: 'crs_ict_04',
      title: '1. Computer Architecture & Binary Number Systems',
      description: 'Von Neumann architecture, CPU fetch-decode-execute cycle, binary/hex conversion, and Boolean logic gates.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Digital Logic & Binary Systems
All modern computers process information as bits ($0$ and $1$).
Basic Logic Gates: AND, OR, NOT, NAND, NOR, XOR.
`,
      order: 1,
      durationMinutes: 25,
    },
    {
      id: 'lsn_ict_02',
      courseId: 'crs_ict_04',
      title: '2. Networking Models: OSI 7-Layer & TCP/IP Protocol',
      description: 'Packet transmission, IP addressing, DNS routing, HTTP/HTTPS encryption, and firewalls.',
      contentType: 'text',
      videoUrl: '',
      content: `## OSI 7-Layer Hierarchy
1. Physical, 2. Data Link, 3. Network (IP), 4. Transport (TCP/UDP), 5. Session, 6. Presentation, 7. Application (HTTP).
`,
      order: 2,
      durationMinutes: 25,
    },
    {
      id: 'lsn_ict_03',
      courseId: 'crs_ict_04',
      title: '3. Database Fundamentals & Cybersecurity Essentials',
      description: 'Relational schema design (SQL), normalization, authentication tokens, and threat mitigation against malware.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Data Security & Management
Relational databases enforce ACID properties (Atomicity, Consistency, Isolation, Durability).
`,
      order: 3,
      durationMinutes: 25,
    },

    // ----------------------------------------------------
    // 5. PROGRAMMING LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_prog_01',
      courseId: 'crs_programming_05',
      title: '1. C++ Pointers, References & Memory Management',
      description: 'Stack vs heap memory allocation, raw pointers, smart pointers (unique_ptr, shared_ptr), and RAII idiom.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## C++ Memory Model & Pointers
\`\`\`cpp
#include <iostream>
#include <memory>

int main() {
    // Modern C++ Smart Pointer (Zero leak guarantee)
    std::unique_ptr<int> ptr = std::make_unique<int>(42);
    std::cout << "Value: " << *ptr << std::endl;
    return 0;
}
\`\`\`
`,
      order: 1,
      durationMinutes: 35,
    },
    {
      id: 'lsn_prog_02',
      courseId: 'crs_programming_05',
      title: '2. Python Idiomatic Code & Data Structures',
      description: 'List comprehensions, generators, dictionaries, decorators, and Big-O computational time complexity.',
      contentType: 'text',
      videoUrl: '',
      content: `## Pythonic Code Patterns
\`\`\`python
# Generator expression for memory-efficient iteration
squares = (x**2 for x in range(1000) if x % 2 == 0)
print(next(squares))
\`\`\`
`,
      order: 2,
      durationMinutes: 35,
    },
    {
      id: 'lsn_prog_03',
      courseId: 'crs_programming_05',
      title: '3. Algorithmic Problem Solving: Trees, Graphs & Dynamic Programming',
      description: 'Binary search, DFS/BFS traversals, Dijkstra shortest path, and memoization techniques.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Dynamic Programming Principles
1. Optimal Substructure
2. Overlapping Subproblems
`,
      order: 3,
      durationMinutes: 35,
    },

    // ----------------------------------------------------
    // 6. FULL STACK DEVELOPMENT LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_fs_01',
      courseId: 'crs_fullstack_06',
      title: '1. Next.js 15 App Router & React Server Components',
      description: 'Server components vs client components, layouts, nested routes, and streaming rendering.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Next.js Server Components
Zero JavaScript bundle sent to the client for non-interactive views.
`,
      order: 1,
      durationMinutes: 40,
    },
    {
      id: 'lsn_fs_02',
      courseId: 'crs_fullstack_06',
      title: '2. Server Actions, RESTful APIs & Data Mutations',
      description: 'Mutating database state directly with type-safe server actions, input validation, and optimistic updates.',
      contentType: 'text',
      videoUrl: '',
      content: `## Server Actions Paradigm
\`\`\`typescript
'use server';

export async function createCourseAction(formData: FormData) {
  // 🇧🇩 সার্ভার সাইডে ডাটাবেস সেভ ও ভ্যালিডেশন
}
\`\`\`
`,
      order: 2,
      durationMinutes: 40,
    },
    {
      id: 'lsn_fs_03',
      courseId: 'crs_fullstack_06',
      title: '3. Fullstack Authentication, RBAC & Cloud Deployment',
      description: 'JWT token verification, session lifecycle, role-based route gating, Docker containerization, and production deployment.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Production Architecture
Enforce role access checks at middleware boundaries and backend API routes.
`,
      order: 3,
      durationMinutes: 40,
    },

    // ----------------------------------------------------
    // 7. DESIGN PATTERNS LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_dp_01',
      courseId: 'crs_design_patterns_07',
      title: '1. Creational & Structural Patterns: Factory, Singleton & Adapter',
      description: 'Object creation patterns and structural composition for loosely coupled TypeScript architectures.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Creational Patterns
- **Singleton Pattern**: Guarantees a single instance (used in our DatabaseRepository).
- **Factory Pattern**: Encapsulates object instantiation logic.
`,
      order: 1,
      durationMinutes: 25,
    },
    {
      id: 'lsn_dp_02',
      courseId: 'crs_design_patterns_07',
      title: '2. Behavioral Patterns: Strategy, Observer & Repository Pattern',
      description: 'Implementing Strategy Pattern for auto-graders and Repository Pattern for data access separation.',
      contentType: 'text',
      videoUrl: '',
      content: `## Repository & Strategy Patterns in Action
\`\`\`typescript
// 🇧🇩 রিপোজিটরি ইন্টারফেস
export interface IRepository<T> {
  findById(id: string): T | undefined;
  create(item: T): T;
}
\`\`\`
`,
      order: 2,
      durationMinutes: 30,
    },
    {
      id: 'lsn_dp_03',
      courseId: 'crs_design_patterns_07',
      title: '3. SOLID Principles & Clean Architecture',
      description: 'Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## The SOLID Principles
- **S**: Single Responsibility Principle
- **O**: Open/Closed Principle
- **L**: Liskov Substitution Principle
- **I**: Interface Segregation Principle
- **D**: Dependency Inversion Principle
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 8. SOFTWARE METRICS LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_sm_01',
      courseId: 'crs_software_metrics_08',
      title: '1. Cyclomatic Complexity & Code Maintainability Index',
      description: 'Calculate McCabe’s cyclomatic complexity ($M = E - N + 2P$) and refactor deeply nested conditionals.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## McCabe's Cyclomatic Complexity
Measures the number of linearly independent paths through a program’s source code.
$$M = E - N + 2P$$
Where $E$ = edges, $N$ = nodes, and $P$ = connected components.
`,
      order: 1,
      durationMinutes: 30,
    },
    {
      id: 'lsn_sm_02',
      courseId: 'crs_software_metrics_08',
      title: '2. Code Coverage, Halstead Metrics & Technical Debt',
      description: 'Statement, branch, and mutation coverage; measuring vocabulary, length, and technical debt interest.',
      contentType: 'text',
      videoUrl: '',
      content: `## Code Coverage vs Quality
High line coverage alone does not guarantee robustness; branch and mutation testing ensure edge case safety.
`,
      order: 2,
      durationMinutes: 30,
    },
    {
      id: 'lsn_sm_03',
      courseId: 'crs_software_metrics_08',
      title: '3. Automated Quality Gates in CI/CD Pipelines',
      description: 'Enforcing ESLint rules, SonarQube quality thresholds, unit test pass rates, and security vulnerability scans.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Quality Gates
Automatically reject pull requests that exceed complexity thresholds or drop test coverage below minimum standards.
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 9. ELECTRONICS LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_elec_01',
      courseId: 'crs_electronics_09',
      title: '1. Semiconductor Physics & PN Junction Diodes',
      description: 'Intrinsic and extrinsic semiconductors, band gap theory, diode IV characteristics, rectifiers, and Zener diodes.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## PN Junction Diode Equation
Shockley diode equation:
$$I = I_s \\left( e^{\\frac{V_D}{\\eta V_T}} - 1 \\right)$$
`,
      order: 1,
      durationMinutes: 25,
    },
    {
      id: 'lsn_elec_02',
      courseId: 'crs_electronics_09',
      title: '2. BJT and MOSFET Transistors as Switches & Amplifiers',
      description: 'BJT active/saturation modes, MOSFET channel modulation, common-emitter and common-source amplifier topologies.',
      contentType: 'text',
      videoUrl: '',
      content: `## Transistor Biasing & Small Signal Gain
Transistors operate as current-controlled (BJT) or voltage-controlled (MOSFET) valves.
`,
      order: 2,
      durationMinutes: 25,
    },
    {
      id: 'lsn_elec_03',
      courseId: 'crs_electronics_09',
      title: '3. Operational Amplifiers (Op-Amps) & Analog Signal Processing',
      description: 'Ideal Op-Amp rules, inverting/non-inverting amplifiers, summing amplifiers, integrators, and comparators.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## Golden Rules of Ideal Op-Amps
1. No current flows into either input terminal: $I_+ = I_- = 0$.
2. Negative feedback drives the differential voltage to zero: $V_+ = V_-$.
`,
      order: 3,
      durationMinutes: 30,
    },

    // ----------------------------------------------------
    // 10. CIRCUITS LESSONS
    // ----------------------------------------------------
    {
      id: 'lsn_cir_01',
      courseId: 'crs_circuits_10',
      title: '1. Ohm’s Law & Kirchhoff’s Laws (KCL / KVL)',
      description: 'Conservation of charge and energy in circuits, node voltages, loop currents, and resistor combinations.',
      contentType: 'video',
      videoUrl: 'https://www.youtube.com/embed/ZjAqacIC_3c',
      content: `## Kirchhoff's Laws
- **Kirchhoff's Current Law (KCL)**: $\\sum I_{in} = \\sum I_{out}$ (conservation of charge)
- **Kirchhoff's Voltage Law (KVL)**: $\\sum V_{loop} = 0$ (conservation of energy)
`,
      order: 1,
      durationMinutes: 25,
    },
    {
      id: 'lsn_cir_02',
      courseId: 'crs_circuits_10',
      title: '2. Network Theorems: Thevenin, Norton & Maximum Power Transfer',
      description: 'Equivalence transformations, open-circuit voltage, short-circuit current, and load matching.',
      contentType: 'text',
      videoUrl: '',
      content: `## Thevenin Theorem
Any linear two-terminal circuit can be replaced by an equivalent voltage source $V_{th}$ in series with $R_{th}$.
`,
      order: 2,
      durationMinutes: 25,
    },
    {
      id: 'lsn_cir_03',
      courseId: 'crs_circuits_10',
      title: '3. AC Sinusoidal Analysis, Phasors & RLC Resonance',
      description: 'Impedance of capacitors and inductors ($Z_C, Z_L$), phasor diagrams, power factor, and series/parallel resonance.',
      contentType: 'markdown',
      videoUrl: '',
      content: `## AC Impedance & Resonant Frequency
- Capacitor Impedance: $Z_C = \\frac{1}{j\\omega C}$
- Inductor Impedance: $Z_L = j\\omega L$
- Resonant Frequency: $\\omega_0 = \\frac{1}{\\sqrt{LC}}$
`,
      order: 3,
      durationMinutes: 25,
    }
  ],
  quizzes: [
    {
      id: 'qiz_phy_01',
      courseId: 'crs_physics_01',
      title: 'Physics & Classical Mechanics Evaluation Quiz',
      description: 'Assess your understanding of Newton’s Laws, conservation of energy, and wave properties.',
      passingPercentage: 70,
      timeLimitMinutes: 15,
      createdAt: '2026-08-20T10:00:00.000Z',
      createdBy: 'usr_inst_01',
      questions: [
        {
          id: 'pq1',
          question: 'According to Newton’s Second Law, if net force on an object is doubled while its mass is halved, what happens to acceleration?',
          points: 10,
          options: [
            { id: 'popt_1a', text: 'Acceleration remains unchanged.' },
            { id: 'popt_1b', text: 'Acceleration becomes four times larger (4x).' },
            { id: 'popt_1c', text: 'Acceleration is halved.' },
            { id: 'popt_1d', text: 'Acceleration becomes zero.' }
          ],
          correctOptionId: 'popt_1b',
          explanation: 'a = F / m. If F is doubled (2F) and m is halved (m/2), new acceleration is (2F)/(m/2) = 4(F/m) = 4a.'
        },
        {
          id: 'pq2',
          question: 'What is the phenomenon responsible for light bending when entering a medium of different optical density?',
          points: 10,
          options: [
            { id: 'popt_2a', text: 'Refraction' },
            { id: 'popt_2b', text: 'Total Internal Reflection' },
            { id: 'popt_2c', text: 'Polarization' },
            { id: 'popt_2d', text: 'Doppler Effect' }
          ],
          correctOptionId: 'popt_2a',
          explanation: 'Refraction occurs when light changes speed across different optical media, governed by Snell’s Law.'
        }
      ]
    },
    {
      id: 'qiz_fs_06',
      courseId: 'crs_fullstack_06',
      title: 'Full Stack Web Architecture & RBAC Evaluation Quiz',
      description: 'Test your understanding of React Server Components, Role-Based Access Control, and progress state.',
      passingPercentage: 70,
      timeLimitMinutes: 15,
      createdAt: '2026-08-20T10:00:00.000Z',
      createdBy: 'usr_inst_01',
      questions: [
        {
          id: 'fsq1',
          question: 'What is the primary advantage of React Server Components (RSC)?',
          points: 10,
          options: [
            { id: 'fsopt_1a', text: 'They execute on the server and send zero client-side JavaScript for those components.' },
            { id: 'fsopt_1b', text: 'They permanently disable CSS stylesheets.' },
            { id: 'fsopt_1c', text: 'They can only run on mobile devices.' },
            { id: 'fsopt_1d', text: 'They require jQuery plugins.' }
          ],
          correctOptionId: 'fsopt_1a',
          explanation: 'React Server Components render on the server, significantly reducing client JavaScript bundle size.'
        },
        {
          id: 'fsq2',
          question: 'Why must Role-Based Access Control (RBAC) be validated on backend routes rather than only hiding UI buttons?',
          points: 10,
          options: [
            { id: 'fsopt_2a', text: 'Hiding buttons is enough for security.' },
            { id: 'fsopt_2b', text: 'Because unauthorized users can craft direct HTTP requests to restricted endpoints.' },
            { id: 'fsopt_2c', text: 'Because browsers cannot hide buttons.' },
            { id: 'fsopt_2d', text: 'To improve database backup speed.' }
          ],
          correctOptionId: 'fsopt_2b',
          explanation: 'Frontend visibility checks are purely cosmetic; true security requires the server to validate roles on every incoming request.'
        }
      ]
    },
    {
      id: 'qiz_dp_07',
      courseId: 'crs_design_patterns_07',
      title: 'Design Patterns & SOLID Principles Quiz',
      description: 'Assess your ability to select appropriate design patterns for clean, decoupled architectures.',
      passingPercentage: 70,
      timeLimitMinutes: 15,
      createdAt: '2026-08-21T10:00:00.000Z',
      createdBy: 'usr_inst_01',
      questions: [
        {
          id: 'dpq1',
          question: 'Which design pattern is used to decouple data access logic from business rules in our LMS architecture?',
          points: 10,
          options: [
            { id: 'dpopt_1a', text: 'Repository Pattern' },
            { id: 'dpopt_1b', text: 'Flyweight Pattern' },
            { id: 'dpopt_1c', text: 'Interpreter Pattern' },
            { id: 'dpopt_1d', text: 'Prototype Pattern' }
          ],
          correctOptionId: 'dpopt_1a',
          explanation: 'The Repository Pattern encapsulates data access queries behind standard domain interfaces.'
        }
      ]
    },
    {
      id: 'qiz_cir_10',
      courseId: 'crs_circuits_10',
      title: 'Electric Circuits & Kirchhoff’s Laws Quiz',
      description: 'Verify your mastery of circuit analysis, Ohm’s Law, and network theorems.',
      passingPercentage: 70,
      timeLimitMinutes: 10,
      createdAt: '2026-08-24T10:00:00.000Z',
      createdBy: 'usr_admin_01',
      questions: [
        {
          id: 'cq1',
          question: 'What fundamental law of physics is Kirchhoff’s Current Law (KCL) based on?',
          points: 10,
          options: [
            { id: 'copt_1a', text: 'Conservation of electric charge' },
            { id: 'copt_1b', text: 'Conservation of momentum' },
            { id: 'copt_1c', text: 'Newton’s third law' },
            { id: 'copt_1d', text: 'Faraday’s law of induction' }
          ],
          correctOptionId: 'copt_1a',
          explanation: 'KCL states that total current entering a junction must equal total current leaving it, conserving charge.'
        }
      ]
    }
  ],
  submissions: [
    {
      id: 'sub_demo_01',
      quizId: 'qiz_fs_06',
      courseId: 'crs_fullstack_06',
      studentId: 'usr_stud_01',
      studentName: 'Shakib Al Hasan',
      answers: {
        'fsq1': 'fsopt_1a',
        'fsq2': 'fsopt_2b'
      },
      score: 20,
      totalPoints: 20,
      percentage: 100,
      isPassed: true,
      submittedAt: '2026-08-24T14:30:00.000Z',
    }
  ],
  enrollments: [
    {
      id: 'enr_01',
      studentId: 'usr_stud_01',
      courseId: 'crs_physics_01',
      enrolledAt: '2026-08-20T09:00:00.000Z',
      lastAccessedAt: '2026-08-25T11:00:00.000Z',
    },
    {
      id: 'enr_02',
      studentId: 'usr_stud_01',
      courseId: 'crs_fullstack_06',
      enrolledAt: '2026-08-21T10:00:00.000Z',
      lastAccessedAt: '2026-08-25T15:00:00.000Z',
    },
    {
      id: 'enr_03',
      studentId: 'usr_stud_02',
      courseId: 'crs_math_03',
      enrolledAt: '2026-08-22T11:00:00.000Z',
      lastAccessedAt: '2026-08-25T12:00:00.000Z',
    }
  ],
  progress: [
    {
      id: 'prog_01',
      studentId: 'usr_stud_01',
      courseId: 'crs_physics_01',
      completedLessonIds: ['lsn_phy_01', 'lsn_phy_02'],
      totalLessons: 3,
      completedLessonsCount: 2,
      progressPercentage: 66.67, // 2 of 3 = 66.67%
      isCompleted: false,
      lastActiveLessonId: 'lsn_phy_02',
      updatedAt: '2026-08-25T11:00:00.000Z',
    },
    {
      id: 'prog_02',
      studentId: 'usr_stud_01',
      courseId: 'crs_fullstack_06',
      completedLessonIds: ['lsn_fs_01', 'lsn_fs_02', 'lsn_fs_03'],
      totalLessons: 3,
      completedLessonsCount: 3,
      progressPercentage: 100, // 3 of 3 = 100%
      isCompleted: true,
      lastActiveLessonId: 'lsn_fs_03',
      updatedAt: '2026-08-25T15:00:00.000Z',
    },
    {
      id: 'prog_03',
      studentId: 'usr_stud_02',
      courseId: 'crs_math_03',
      completedLessonIds: ['lsn_math_01'],
      totalLessons: 3,
      completedLessonsCount: 1,
      progressPercentage: 33.33,
      isCompleted: false,
      lastActiveLessonId: 'lsn_math_01',
      updatedAt: '2026-08-25T12:00:00.000Z',
    }
  ],
  blogs: [
    {
      id: 'blg_01',
      title: 'Architecting Scalable Next.js 15 Applications with Headless Strapi v5',
      slug: 'architecting-scalable-nextjs-strapi',
      excerpt: 'A comprehensive engineering guide on building resilient enterprise applications using React Server Components, typed APIs, and strict RBAC.',
      content: `### Introduction
When architecting modern web platforms, separating your presentation layer (Next.js) from your headless CMS (Strapi) provides unmatched scalability, security, and developer agility.

### 1. The Power of React Server Components
React Server Components (RSC) fundamentally shift how frontend engineers think about data fetching:
- Zero JavaScript overhead for static and server-rendered blocks
- Direct backend communication without exposing secret CMS tokens to the browser
- Native streaming support with Suspense boundaries

### 2. Strict Role-Based Access Control (RBAC)
Never rely exclusively on client UI state for security. Enforce access rules strictly on every backend route:
\`\`\`typescript
// 🇧🇩 ব্যাকএন্ড পারমিশন চেক উদাহরণ
export function requireRole(allowedRoles: UserRole[]) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}
\`\`\`

### 3. Conclusion
Adopting clean software design patterns like Repository and Strategy patterns ensures your LMS codebase remains maintainable as your team grows.
`,
      coverImageUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&auto=format&fit=crop&q=80',
      authorId: 'usr_cm_01',
      authorName: 'Farhana Rahman',
      authorRole: 'content_manager',
      status: 'published',
      tags: ['Engineering', 'Next.js', 'Strapi', 'Architecture'],
      readTimeMinutes: 6,
      publishedAt: '2026-08-21T09:00:00.000Z',
      createdAt: '2026-08-20T14:00:00.000Z',
      updatedAt: '2026-08-21T09:00:00.000Z',
    },
    {
      id: 'blg_02',
      title: 'How to Implement Zero-Leak Permission Matrices in Web Systems',
      slug: 'zero-leak-permission-matrices',
      excerpt: 'Deep dive into why role-based security fails at the boundary and how to implement airtight authorization layers.',
      content: `### Security at the Boundary
Role-based systems frequently suffer from "UI-only" gating, where an attacker can simply trigger HTTP endpoints directly.

In this article, we explore:
1. **Hierarchical vs Granular Permissions**
2. **Resource Ownership Validation** (e.g. Instructors editing only their own course items)
3. **Audit Logging** for administrative role promotions.
`,
      coverImageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
      authorId: 'usr_admin_01',
      authorName: 'Tanvir Ahmed',
      authorRole: 'admin',
      status: 'published',
      tags: ['Security', 'RBAC', 'Best Practices'],
      readTimeMinutes: 5,
      publishedAt: '2026-08-23T11:00:00.000Z',
      createdAt: '2026-08-22T16:00:00.000Z',
      updatedAt: '2026-08-23T11:00:00.000Z',
    },
    {
      id: 'blg_03',
      title: '[Draft] Upcoming LMS 2.0 Features: Interactive Code Sandboxes & Certificates',
      slug: 'upcoming-lms-2-features-draft',
      excerpt: 'Preview of upcoming interactive coding playgrounds and verifiable blockchain certificate issuance.',
      content: `This is a draft preview article currently in editorial review by Content Managers and Administrators. Students cannot see this article until it is published!`,
      coverImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      authorId: 'usr_cm_01',
      authorName: 'Farhana Rahman',
      authorRole: 'content_manager',
      status: 'draft', // 🇧🇩 ড্রাফট অবস্থা - সাধারণ ছাত্র ও দর্শনার্থীরা এটি দেখতে পাবে না
      tags: ['Product Update', 'Roadmap'],
      readTimeMinutes: 4,
      createdAt: '2026-08-24T16:00:00.000Z',
      updatedAt: '2026-08-24T16:00:00.000Z',
    }
  ],
  auditLogs: [
    {
      id: 'log_01',
      userId: 'usr_admin_01',
      userName: 'Tanvir Ahmed',
      userRole: 'admin',
      action: 'SYSTEM_BOOTSTRAP',
      details: 'Initialized LMS database with 4-tier RBAC security policy and sample courses.',
      timestamp: '2026-08-25T08:00:00.000Z',
    }
  ],
  sessions: []
};

// 🇧🇩 রিপোজিটরি ক্লাস (Singleton Database Repository Pattern)
export class DatabaseRepository {
  private static instance: DatabaseRepository;
  private data: DatabaseSchema;

  private constructor() {
    this.data = this.loadData();
  }

  public static getInstance(): DatabaseRepository {
    if (!DatabaseRepository.instance) {
      DatabaseRepository.instance = new DatabaseRepository();
    }
    return DatabaseRepository.instance;
  }

  // 🇧🇩 ডিস্ক থেকে ডেটা রিড করা
  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.sessions = parsed.sessions || [];
        return parsed;
      }
    } catch (err) {
      console.warn('⚠️ Could not load stored database file, seeding with fresh data.', err);
    }
    this.persist(initialSeedData);
    return JSON.parse(JSON.stringify(initialSeedData));
  }

  // 🇧🇩 ডিস্কে ডেটা সেভ করা
  private persist(dataToSave?: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ Failed to persist database store:', err);
    }
  }

  // ==========================
  // USERS & ROLE MANAGEMENT
  // ==========================
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  public updateUserRole(userId: string, newRole: User['role'], adminUser: User): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');
    
    const oldRole = user.role;
    user.role = newRole;
    
    this.addAuditLog({
      id: `log_${Date.now()}`,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'ROLE_UPDATE',
      details: `Changed role of user ${user.name} (${user.email}) from ${oldRole} to ${newRole}`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return user;
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    // Prevent direct role and id escalation from self-service profile endpoint
    const { role: _role, id: _id, createdAt: _created, ...allowedUpdates } = updates;
    Object.assign(user, allowedUpdates);

    // If name or avatar changed and user is instructor, update authored courses
    if (allowedUpdates.name || allowedUpdates.avatar) {
      this.data.courses.forEach(c => {
        if (c.instructorId === userId) {
          if (allowedUpdates.name) c.instructorName = allowedUpdates.name;
          if (allowedUpdates.avatar) c.instructorAvatar = allowedUpdates.avatar;
        }
      });
    }

    this.persist();
    return user;
  }

  public deleteUser(userId: string, adminUser: User): boolean {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    const deleted = this.data.users.splice(idx, 1)[0];

    this.addAuditLog({
      id: `log_${Date.now()}`,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'USER_DELETE',
      details: `Deleted user ${deleted.name} (${deleted.email}) with role ${deleted.role}`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return true;
  }

  // ==========================
  // COURSES & LESSONS
  // ==========================
  public getCourses(): Course[] {
    return this.data.courses;
  }

  public getCourseById(id: string): Course | undefined {
    return this.data.courses.find(c => c.id === id);
  }

  public createCourse(course: Course): Course {
    this.data.courses.unshift(course);
    this.persist();
    return course;
  }

  public updateCourse(id: string, updates: Partial<Course>): Course {
    const course = this.getCourseById(id);
    if (!course) throw new Error('Course not found');
    Object.assign(course, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return course;
  }

  public assignInstructorToCourse(courseId: string, instructorId: string, adminUser: User): Course {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Course not found');
    
    const instructor = this.getUserById(instructorId);
    if (!instructor) throw new Error('Instructor not found');

    const previousInstructor = course.instructorName || 'Unassigned';
    course.instructorId = instructor.id;
    course.instructorName = instructor.name;
    course.instructorAvatar = instructor.avatar;
    course.updatedAt = new Date().toISOString();

    this.addAuditLog({
      id: `log_${Date.now()}`,
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      action: 'INSTRUCTOR_ASSIGNED',
      details: `Assigned instructor ${instructor.name} (${instructor.role}) to course "${course.title}" (previously ${previousInstructor})`,
      timestamp: new Date().toISOString()
    });

    this.persist();
    return course;
  }

  public deleteCourse(id: string): boolean {
    const initialLen = this.data.courses.length;
    this.data.courses = this.data.courses.filter(c => c.id !== id);
    // Delete associated lessons, quiz, enrollments, and progress
    this.data.lessons = this.data.lessons.filter(l => l.courseId !== id);
    this.data.quizzes = this.data.quizzes.filter(q => q.courseId !== id);
    this.data.enrollments = this.data.enrollments.filter(e => e.courseId !== id);
    this.data.progress = this.data.progress.filter(p => p.courseId !== id);
    this.persist();
    return this.data.courses.length < initialLen;
  }

  public getLessons(courseId?: string): Lesson[] {
    if (courseId) {
      return this.data.lessons
        .filter(l => l.courseId === courseId)
        .sort((a, b) => a.order - b.order);
    }
    return this.data.lessons;
  }

  public getLessonById(id: string): Lesson | undefined {
    return this.data.lessons.find(l => l.id === id);
  }

  public createLesson(lesson: Lesson): Lesson {
    this.data.lessons.push(lesson);
    // Update course lessons count
    const course = this.getCourseById(lesson.courseId);
    if (course) {
      course.lessonsCount = this.getLessons(lesson.courseId).length;
      course.totalDurationMinutes += lesson.durationMinutes;
    }
    this.persist();
    return lesson;
  }

  public updateLesson(id: string, updates: Partial<Lesson>): Lesson {
    const lesson = this.getLessonById(id);
    if (!lesson) throw new Error('Lesson not found');
    Object.assign(lesson, updates);
    this.persist();
    return lesson;
  }

  public deleteLesson(id: string): boolean {
    const lesson = this.getLessonById(id);
    if (!lesson) return false;
    const courseId = lesson.courseId;
    this.data.lessons = this.data.lessons.filter(l => l.id !== id);
    
    // Update course metadata
    const course = this.getCourseById(courseId);
    if (course) {
      course.lessonsCount = this.getLessons(courseId).length;
    }

    // Re-adjust student progress
    this.data.progress.forEach(p => {
      if (p.courseId === courseId) {
        p.completedLessonIds = p.completedLessonIds.filter(lid => lid !== id);
        p.totalLessons = course ? course.lessonsCount : p.totalLessons;
        p.completedLessonsCount = p.completedLessonIds.length;
        p.progressPercentage = p.totalLessons > 0 ? (p.completedLessonsCount / p.totalLessons) * 100 : 0;
      }
    });

    this.persist();
    return true;
  }

  // ==========================
  // QUIZZES & AUTO-GRADING
  // ==========================
  public getQuizzes(): Quiz[] {
    return this.data.quizzes;
  }

  public getQuizByCourseId(courseId: string): Quiz | undefined {
    return this.data.quizzes.find(q => q.courseId === courseId);
  }

  public getQuizById(id: string): Quiz | undefined {
    return this.data.quizzes.find(q => q.id === id);
  }

  public saveQuiz(quiz: Quiz): Quiz {
    const existingIdx = this.data.quizzes.findIndex(q => q.id === quiz.id || q.courseId === quiz.courseId);
    if (existingIdx >= 0) {
      this.data.quizzes[existingIdx] = quiz;
    } else {
      this.data.quizzes.push(quiz);
    }
    this.persist();
    return quiz;
  }

  public getSubmissions(studentId?: string, quizId?: string): QuizSubmission[] {
    let result = this.data.submissions;
    if (studentId) result = result.filter(s => s.studentId === studentId);
    if (quizId) result = result.filter(s => s.quizId === quizId);
    return result;
  }

  public saveSubmission(submission: QuizSubmission): QuizSubmission {
    this.data.submissions.push(submission);
    this.persist();
    return submission;
  }

  // ==========================
  // ENROLLMENTS & PROGRESS
  // ==========================
  public getEnrollments(studentId?: string): Enrollment[] {
    if (studentId) return this.data.enrollments.filter(e => e.studentId === studentId);
    return this.data.enrollments;
  }

  public createEnrollment(studentId: string, courseId: string): Enrollment {
    const existing = this.data.enrollments.find(e => e.studentId === studentId && e.courseId === courseId);
    if (existing) return existing;

    const enrollment: Enrollment = {
      id: `enr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId,
      courseId,
      enrolledAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };
    this.data.enrollments.push(enrollment);

    // Initialize progress record
    const courseLessons = this.getLessons(courseId);
    const progress: StudentCourseProgress = {
      id: `prog_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      studentId,
      courseId,
      completedLessonIds: [],
      totalLessons: courseLessons.length,
      completedLessonsCount: 0,
      progressPercentage: 0,
      isCompleted: false,
      lastActiveLessonId: courseLessons[0]?.id,
      updatedAt: new Date().toISOString()
    };
    this.data.progress.push(progress);

    // Update user enrolled list
    const user = this.getUserById(studentId);
    if (user) {
      user.enrolledCourseIds = user.enrolledCourseIds || [];
      if (!user.enrolledCourseIds.includes(courseId)) {
        user.enrolledCourseIds.push(courseId);
      }
    }

    this.persist();
    return enrollment;
  }

  public getProgress(studentId: string, courseId: string): StudentCourseProgress | undefined {
    return this.data.progress.find(p => p.studentId === studentId && p.courseId === courseId);
  }

  public getAllProgress(): StudentCourseProgress[] {
    return this.data.progress;
  }

  public saveProgress(progress: StudentCourseProgress): StudentCourseProgress {
    const idx = this.data.progress.findIndex(p => p.studentId === progress.studentId && p.courseId === progress.courseId);
    if (idx >= 0) {
      this.data.progress[idx] = progress;
    } else {
      this.data.progress.push(progress);
    }
    this.persist();
    return progress;
  }

  // ==========================
  // BLOG POSTS (CMS)
  // ==========================
  public getBlogPosts(onlyPublished: boolean = true): BlogPost[] {
    if (onlyPublished) {
      return this.data.blogs.filter(b => b.status === 'published');
    }
    return this.data.blogs;
  }

  public getBlogPostById(id: string): BlogPost | undefined {
    return this.data.blogs.find(b => b.id === id);
  }

  public getBlogPostBySlug(slug: string): BlogPost | undefined {
    return this.data.blogs.find(b => b.slug === slug);
  }

  public createBlogPost(post: BlogPost): BlogPost {
    this.data.blogs.unshift(post);
    this.persist();
    return post;
  }

  public updateBlogPost(id: string, updates: Partial<BlogPost>): BlogPost {
    const post = this.getBlogPostById(id);
    if (!post) throw new Error('Blog post not found');
    Object.assign(post, updates, { updatedAt: new Date().toISOString() });
    if (updates.status === 'published' && !post.publishedAt) {
      post.publishedAt = new Date().toISOString();
    }
    this.persist();
    return post;
  }

  public deleteBlogPost(id: string): boolean {
    const initialLen = this.data.blogs.length;
    this.data.blogs = this.data.blogs.filter(b => b.id !== id);
    this.persist();
    return this.data.blogs.length < initialLen;
  }

  // ==========================
  // 🇧🇩 সেশন ম্যানেজমেন্ট ও লোকালহোস্ট সেশন কন্ট্রোল (Session Control Engine)
  // ==========================
  public createSession(userId: string, options: { ipAddress?: string; userAgent?: string; timeoutMinutes?: number } = {}): UserSession {
    const timeout = options.timeoutMinutes && options.timeoutMinutes > 0 ? options.timeoutMinutes : 1440; // Default 24 hours (1440 min)
    const now = Date.now();
    const token = `sess_${userId}_${now}_${Math.random().toString(36).substring(2, 10)}`;
    
    const newSession: UserSession = {
      id: `sid_${now}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      token,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + timeout * 60 * 1000).toISOString(),
      lastActiveAt: new Date(now).toISOString(),
      ipAddress: options.ipAddress || '127.0.0.1 (localhost)',
      userAgent: options.userAgent || 'Localhost Web Browser',
      isValid: true,
      timeoutMinutes: timeout
    };

    if (!this.data.sessions) {
      this.data.sessions = [];
    }

    this.data.sessions.unshift(newSession);
    this.persist();
    return newSession;
  }

  public getSessionByToken(token: string): UserSession | undefined {
    if (!this.data.sessions) return undefined;
    const session = this.data.sessions.find(s => s.token === token);
    if (!session) return undefined;

    // Check expiration
    if (!session.isValid || new Date(session.expiresAt).getTime() < Date.now()) {
      session.isValid = false;
      this.persist();
      return undefined;
    }

    return session;
  }

  public touchSession(sessionId: string): UserSession | undefined {
    if (!this.data.sessions) return undefined;
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session || !session.isValid) return undefined;

    const now = Date.now();
    session.lastActiveAt = new Date(now).toISOString();
    // Extend expiry based on configured timeout
    const timeout = session.timeoutMinutes || 1440;
    session.expiresAt = new Date(now + timeout * 60 * 1000).toISOString();
    this.persist();
    return session;
  }

  public extendSession(sessionId: string, additionalMinutes: number = 30): UserSession | undefined {
    if (!this.data.sessions) return undefined;
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session) return undefined;

    const now = Date.now();
    const currentExpiry = new Date(session.expiresAt).getTime();
    const baseTime = currentExpiry > now ? currentExpiry : now;
    session.expiresAt = new Date(baseTime + additionalMinutes * 60 * 1000).toISOString();
    session.lastActiveAt = new Date(now).toISOString();
    session.isValid = true;
    this.persist();
    return session;
  }

  public updateSessionTimeout(sessionId: string, timeoutMinutes: number): UserSession | undefined {
    if (!this.data.sessions) return undefined;
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (!session) return undefined;

    session.timeoutMinutes = timeoutMinutes;
    const now = Date.now();
    session.expiresAt = new Date(now + timeoutMinutes * 60 * 1000).toISOString();
    session.lastActiveAt = new Date(now).toISOString();
    this.persist();
    return session;
  }

  public revokeSession(sessionId: string): boolean {
    if (!this.data.sessions) return false;
    const session = this.data.sessions.find(s => s.id === sessionId);
    if (session) {
      session.isValid = false;
      this.persist();
      return true;
    }
    return false;
  }

  public revokeAllUserSessions(userId: string, exceptSessionId?: string): number {
    if (!this.data.sessions) return 0;
    let count = 0;
    this.data.sessions.forEach(s => {
      if (s.userId === userId && s.id !== exceptSessionId && s.isValid) {
        s.isValid = false;
        count++;
      }
    });
    if (count > 0) this.persist();
    return count;
  }

  public getUserSessions(userId: string, currentSessionId?: string): UserSession[] {
    if (!this.data.sessions) return [];
    return this.data.sessions
      .filter(s => s.userId === userId)
      .map(s => {
        const isExpired = new Date(s.expiresAt).getTime() < Date.now();
        return {
          ...s,
          isValid: s.isValid && !isExpired,
          isCurrent: s.id === currentSessionId || s.token === currentSessionId
        };
      })
      .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
  }

  // ==========================
  // AUTHENTICATION CODES (EMAIL 2FA / OTP)
  // ==========================
  public saveVerificationCode(
    email: string, 
    code: string, 
    type: 'login' | 'register', 
    registrationData?: { name: string; role: any; bio?: string }
  ): VerificationCode {
    if (!this.data.verificationCodes) {
      this.data.verificationCodes = [];
    }
    // Remove previous codes for this email
    this.data.verificationCodes = this.data.verificationCodes.filter(
      vc => vc.email.toLowerCase() !== email.toLowerCase()
    );

    const now = Date.now();
    const verification: VerificationCode = {
      email: email.toLowerCase(),
      code,
      type,
      registrationData,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 10 * 60 * 1000).toISOString() // 10 minutes expiry
    };

    this.data.verificationCodes.push(verification);
    this.persist();
    return verification;
  }

  public getVerificationCode(email: string): VerificationCode | undefined {
    if (!this.data.verificationCodes) return undefined;
    const item = this.data.verificationCodes.find(
      vc => vc.email.toLowerCase() === email.toLowerCase()
    );
    if (!item) return undefined;

    // Check expiry
    if (new Date(item.expiresAt).getTime() < Date.now()) {
      this.deleteVerificationCode(email);
      return undefined;
    }

    return item;
  }

  public deleteVerificationCode(email: string): void {
    if (!this.data.verificationCodes) return;
    this.data.verificationCodes = this.data.verificationCodes.filter(
      vc => vc.email.toLowerCase() !== email.toLowerCase()
    );
    this.persist();
  }

  // ==========================
  // STATS & AUDIT LOGS
  // ==========================
  public addAuditLog(log: AuditLog): void {
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 100) this.data.auditLogs.pop();
    this.persist();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public resetToSeed(): DatabaseSchema {
    this.data = JSON.parse(JSON.stringify(initialSeedData));
    this.persist();
    return this.data;
  }
}
