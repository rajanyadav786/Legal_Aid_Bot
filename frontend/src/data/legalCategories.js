/**
 * Legal issue categories with domain-specific context
 * Each category includes a system prompt supplement the AI uses for richer answers
 */

const LEGAL_CATEGORIES = [
  {
    id: 'general',
    label: 'General Legal Aid',
    shortLabel: 'General',
    icon: 'scales',
    color: '#e8922f',
    description: 'Ask any legal question — rights, procedures, or guidance',
    systemContext: '',
    quickPrompts: [
      'What are my fundamental rights as an Indian citizen?',
      'How do I file an RTI application?',
      'What is the process to get a legal aid lawyer for free?',
    ],
  },
  {
    id: 'labor',
    label: 'Labour & Employment',
    shortLabel: 'Labour',
    icon: 'briefcase',
    color: '#4ea8de',
    description: 'Wages, workplace disputes, wrongful termination, POSH',
    systemContext:
      'The user is asking about labour and employment law. Focus on: Minimum Wages Act 1948, Payment of Wages Act 1936, Industrial Disputes Act 1947, Factories Act 1948, POSH Act 2013, Employee Provident Fund, ESI Act, Contract Labour Act, Shops & Establishments Act, Maternity Benefit Act, Equal Remuneration Act, and the four new Labour Codes (Wage Code 2019, Industrial Relations Code 2020, Social Security Code 2020, OSH Code 2020). Include relevant sections and practical steps.',
    quickPrompts: [
      'My employer hasnt paid my salary for 2 months. What can I do?',
      'How do I file a complaint about workplace harassment?',
      'Am I entitled to gratuity after 4 years of service?',
    ],
  },
  {
    id: 'property',
    label: 'Property & Land',
    shortLabel: 'Property',
    icon: 'home',
    color: '#56c596',
    description: 'Land disputes, tenant rights, property registration',
    systemContext:
      'The user is asking about property and land law. Focus on: Transfer of Property Act 1882, Registration Act 1908, Indian Stamp Act, Rent Control Acts, RERA 2016, Land Acquisition Act 2013, Specific Relief Act, state-specific tenancy laws, mutation process, property succession, encumbrance certificates, and dispute resolution. Explain documentation requirements and provide step-by-step procedures.',
    quickPrompts: [
      'My landlord is illegally trying to evict me. What are my rights?',
      'How do I check if a property has a clear title?',
      'What is the process for property mutation after inheritance?',
    ],
  },
  {
    id: 'family',
    label: 'Family & Domestic',
    shortLabel: 'Family',
    icon: 'family',
    color: '#e07b9d',
    description: 'Divorce, custody, domestic violence, maintenance',
    systemContext:
      'The user is asking about family and domestic law. Focus on: Hindu Marriage Act 1955, Special Marriage Act 1954, Muslim Personal Law, Christian Marriage Act, Protection of Women from Domestic Violence Act 2005 (Section 12 application process), Hindu Succession Act, Guardians and Wards Act 1890, Maintenance under CrPC Section 125 / BNSS Section 144, Dowry Prohibition Act 1961, Child custody principles (welfare of child doctrine), adoption laws (CARA, JJ Act), and family court procedures.',
    quickPrompts: [
      'How can I file for domestic violence protection?',
      'What is the process for mutual consent divorce?',
      'Am I entitled to maintenance from my husband during separation?',
    ],
  },
  {
    id: 'criminal',
    label: 'Criminal Law',
    shortLabel: 'Criminal',
    icon: 'shield',
    color: '#e05252',
    description: 'FIR, bail, arrest rights, criminal complaints',
    systemContext:
      'The user is asking about criminal law. Focus on: Bharatiya Nyaya Sanhita (BNS) 2023 (replacing IPC), Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023 (replacing CrPC), Bharatiya Sakshya Adhiniyam (BSA) 2023 (replacing Evidence Act), FIR filing procedure under Section 173 BNSS, Zero FIR, arrest rights under Article 22, bail provisions (Section 480-483 BNSS), anticipatory bail, cognizable vs non-cognizable offences, police station complaint process, and victim rights.',
    quickPrompts: [
      'The police refused to file my FIR. What can I do?',
      'What are my rights if I am arrested?',
      'How do I apply for anticipatory bail?',
    ],
  },
  {
    id: 'consumer',
    label: 'Consumer Rights',
    shortLabel: 'Consumer',
    icon: 'receipt',
    color: '#c084fc',
    description: 'Product complaints, service deficiency, refund disputes',
    systemContext:
      'The user is asking about consumer protection. Focus on: Consumer Protection Act 2019, Consumer Disputes Redressal Commissions (District, State, National), e-filing of consumer complaints, types of relief available (replacement, refund, compensation), product liability provisions, misleading advertisements, unfair trade practices, Central Consumer Protection Authority (CCPA), rules for e-commerce complaints, mediation under the Act, and time limits for filing.',
    quickPrompts: [
      'An online seller refused my refund. How do I file a complaint?',
      'How do I file a consumer complaint in the district forum?',
      'Can I claim compensation for medical negligence?',
    ],
  },
  {
    id: 'women',
    label: 'Women & Child',
    shortLabel: 'Women',
    icon: 'heart',
    color: '#f472b6',
    description: 'Women safety, child protection, POCSO, dowry',
    systemContext:
      'The user is asking about women and child protection laws. Focus on: POCSO Act 2012, Juvenile Justice Act 2015, Dowry Prohibition Act 1961, POSH Act 2013, Section 354/376 BNS (sexual offences), Acid attack provisions, Maternity Benefit Act, Women\'s helpline 181, Child helpline 1098, National/State Commission for Women, Nirbhaya Fund schemes, One Stop Centres, Women\'s shelter homes, child marriage laws (PCMA 2006), child labour prohibition, right to education, and adoption procedures.',
    quickPrompts: [
      'How do I report a POCSO case?',
      'What protection is available for acid attack victims?',
      'How to register a dowry harassment complaint?',
    ],
  },
  {
    id: 'cyber',
    label: 'Cyber Crime',
    shortLabel: 'Cyber',
    icon: 'globe',
    color: '#38bdf8',
    description: 'Online fraud, identity theft, cyberbullying, data privacy',
    systemContext:
      'The user is asking about cyber crime and IT law. Focus on: Information Technology Act 2000 (Sections 43, 65, 66, 66A struck down, 66B-F, 67, 72), BNS provisions on cyber fraud, National Cyber Crime Reporting Portal (cybercrime.gov.in), local cyber crime cell procedures, UPI/banking fraud reporting (RBI circular on liability), identity theft, phishing, social media harassment, revenge porn laws, data protection under IT Rules 2011, Digital Personal Data Protection Act 2023, and cyber insurance.',
    quickPrompts: [
      'I was scammed through a fake UPI payment. What should I do?',
      'How do I report online harassment or cyberbullying?',
      'Someone created a fake account with my photos. How to take action?',
    ],
  },
];

export default LEGAL_CATEGORIES;
