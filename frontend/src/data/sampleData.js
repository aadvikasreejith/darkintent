// Central sample dataset for DarkIntent prototype
// India-oriented B2B sales intelligence based on public developer discussions
// Clearly labeled as prototype sample/demo data

export const PIPELINE_STAGES = [
  'New',
  'Qualified',
  'Contacted',
  'Engaged',
  'Meeting',
  'Won/Lost'
];

/**
 * Format currency in Indian Rupees (INR - ₹)
 */
export function formatINR(val, compact = false) {
  if (val == null || isNaN(val)) return '₹0';
  const num = Number(val);
  if (compact) {
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1).replace(/\.0$/, '')}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(0)}k`;
    }
    return `₹${num}`;
  }
  // Standard Indian comma format
  return '₹' + num.toLocaleString('en-IN');
}

/**
 * Format date in DD MMM YYYY (Asia/Kolkata timezone standard)
 */
export function formatDateIST(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export const SAMPLE_OPPORTUNITIES = [
  {
    id: 'opp-1',
    company: 'ZenScale Systems',
    domain: 'zenscale.in',
    location: 'Bengaluru, Karnataka',
    industry: 'Supply Chain & Freight SaaS',
    companySize: '210 employees · Series B',
    title: 'PostgreSQL connection exhaustion under load (Prisma + PgBouncer failure)',
    source: 'Reddit',
    sourceChannel: 'r/devops',
    sourceUrl: 'https://reddit.com/r/devops/comments/1f89x2/rds_postgres_connection_exhaustion',
    author: 'aravind_sre_lead (Staff SRE)',
    postedAt: '2 hours ago · IST',
    postedDate: '09 Oct 2026',
    timestamp: '2026-10-09T06:00:00Z',
    severity: 'Critical',
    technologies: ['PostgreSQL', 'Prisma ORM', 'AWS RDS', 'PgBouncer', 'Kubernetes'],
    score: 94,
    scoreBreakdown: {
      technicalSeverity: 98,
      capabilityMatch: 95,
      buyerAuthority: 90,
      urgency: 94
    },
    scoreExplanation: 'Active production degradation: ZenScale experiences database failovers during morning freight dispatch runs. Prisma client connection pool limits conflict with PgBouncer transaction pooling due to prepared statement eviction.',
    originalExcerpt: `FATAL: remaining connection slots are reserved for non-superuser connections
at ConnectionPool.acquire (/app/node_modules/@prisma/client/runtime/library.js:94)
Error: Server has closed the connection unexpectedly.
Clients spiking to 1,280 active connections during 08:30 IST dispatch run.
We tried PgBouncer in transaction mode but prepared statements with Prisma keep throwing:
"prepared statement 's0' already exists" or random 500s.
Currently rebooting read replicas every morning. Any autonomous connection multiplexer that handles prepared statements gracefully?`,
    problemSummary: 'Production PostgreSQL connection pool saturation under 1,200+ concurrent client spikes. PgBouncer transaction mode fails due to Prisma ORM prepared statement conflicts.',
    rootCause: 'Lack of protocol-aware statement caching and session multiplexing between Prisma client connection pools and AWS RDS Postgres.',
    companyMatch: {
      name: 'ZenScale Systems',
      verifiedDomain: 'zenscale.in',
      location: 'Bengaluru, Karnataka',
      stage: 'Series B (₹290 Cr funding)',
      employees: '210',
      buyerPersona: 'VP of Engineering / Lead SRE',
      targetContact: 'S. Ramanathan, VP of Engineering',
      contactEmail: 'ramanathan.s@zenscale.in',
      techStackConfirmed: ['AWS RDS PostgreSQL 15', 'Node.js / TypeScript', 'Prisma ORM', 'EKS']
    },
    evidence: [
      'Staff SRE posted explicit error trace on Reddit r/devops mentioning RDS Postgres 15 and Prisma',
      'Discussion mentions recurring morning 08:30 IST freight dispatch outage pattern',
      'Public hiring post on LinkedIn for "Principal Database Reliability Engineer in Bengaluru"',
      'High business criticality: Freight dispatch freeze impacts same-day delivery SLAs'
    ],
    recommendedAction: 'Send technical consultative note to S. Ramanathan sharing our zero-downtime connection multiplexer benchmark showing 90% connection reduction with Prisma compatibility.',
    pipelineStage: 'Qualified',
    pipelineValue: 4800000, // ₹48 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: ZenScale's Prisma + PgBouncer prepared statement issue on RDS

Hi Ramanathan,

I came across your engineering team's discussion regarding RDS connection pool spikes and the Prisma prepared statement collision ("s0 already exists") during peak morning dispatch.

That friction between Prisma's query engine and PgBouncer transaction pooling is notoriously tricky at scale because PgBouncer does not multiplex session-level prepared statement state across pooled backends without manual hacks.

We built a transparent database proxy that isolates prepared statements per transaction while multiplexing 2,000+ app connections down to 40 RDS backends with zero Prisma rewrites.

Happy to share our technical benchmark if your platform team is reviewing connection pooling options.

Best regards,
Arjun Mehta
Technical Solutions Architect`,
      technical: `Subject: Fix for Prisma prepared statements + PgBouncer connection spikes

Ramanathan — saw the note on RDS hitting max_connections under Prisma batching during dispatch.

Short diagnosis: Prisma 5 requires session-level prepared statement tracking that transaction-mode PgBouncer evicts across client queries, forcing replica reboots.

We maintain a transparent protocol multiplexer that handles statement re-mapping for Prisma + RDS, dropping connection pressure from 1,280 down to ~35 steady backend connections with sub-millisecond p99 latency.

Happy to provide a 10-minute sandbox reproduction on your staging cluster.

Arjun Mehta`,
      executive: `Subject: Protecting ZenScale's dispatch uptime during peak volume

Hi Ramanathan,

With ZenScale scaling freight dispatch volume across southern hubs, infrastructure reliability is core to client SLAs.

Our intelligence identified your team troubleshooting database connection exhaustion during morning peak dispatch windows. At scale, connection storms can easily cascade into 30+ minutes of platform downtime.

Our database proxy platform delivers 90%+ backend connection reduction for high-throughput Postgres stacks without requiring application rewrites.

Could we schedule a concise 15-minute architecture conversation this week?

Arjun Mehta`
    },
    lastOutreachSent: null
  },
  {
    id: 'opp-2',
    company: 'HyperVector Labs India',
    domain: 'hypervector.ai',
    location: 'Bengaluru & Hyderabad',
    industry: 'Enterprise AI & Vector Search',
    companySize: '65 employees · Series A',
    title: 'Milvus / pgvector indexing OOM crashes on 50M+ 1536-dim embeddings',
    source: 'GitHub',
    sourceChannel: 'langchain-ai/langchain #14892',
    sourceUrl: 'https://github.com/langchain-ai/langchain/issues/14892',
    author: 'kavita_ml_infra (Head of ML Platform)',
    postedAt: '4 hours ago · IST',
    postedDate: '09 Oct 2026',
    timestamp: '2026-10-09T04:30:00Z',
    severity: 'High',
    technologies: ['pgvector', 'Milvus', 'Kubernetes', 'Python', 'OpenAI Embeddings'],
    score: 91,
    scoreBreakdown: {
      technicalSeverity: 92,
      capabilityMatch: 95,
      buyerAuthority: 88,
      urgency: 90
    },
    scoreExplanation: 'HyperVector Labs experiences memory runaway (OOMKilled pods) when re-indexing 50M embeddings for enterprise clients. GPU instance memory expenses have crossed ₹11L/month.',
    originalExcerpt: `OOMKilled: container vector-indexer exceeded memory limit (64Gi)
Vector index HNSW graph construction fails at 38M records.
Cold-start search latency jumped from 14ms to 450ms when swapping to disk.
We cannot keep adding high-memory GPU nodes just to keep the vector graph resident in RAM.
Does anyone have a tiered quantization caching layer that keeps p99 under 10ms without holding all 1536-dim vectors in hot memory?`,
    problemSummary: 'HNSW vector index memory consumption exceeds pod limits (64GB) during re-indexing of 50M enterprise embeddings, causing search timeouts.',
    rootCause: 'Uncompressed high-dimensional vector graphs held entirely in memory without tiered product quantization.',
    companyMatch: {
      name: 'HyperVector Labs India',
      verifiedDomain: 'hypervector.ai',
      location: 'Bengaluru & Hyderabad',
      stage: 'Series A (₹115 Cr funding)',
      employees: '65',
      buyerPersona: 'Head of ML Platform / Chief AI Architect',
      targetContact: 'Dr. Kavita Narang, Head of AI Infrastructure',
      contactEmail: 'kavita@hypervector.ai',
      techStackConfirmed: ['pgvector', 'Milvus', 'Kubernetes', 'FastAPI', 'PyTorch']
    },
    evidence: [
      'GitHub issue on langchain repository detailing exact 64GB OOM parameters on 50M embeddings',
      'Author verified as engineering lead at HyperVector Labs Bengaluru office',
      'Recent press release on enterprise legal search rollout in India and Singapore'
    ],
    recommendedAction: 'Reach out to Dr. Kavita Narang highlighting our Tiered Vector Cache architecture with 75% memory compression and sub-8ms recall.',
    pipelineStage: 'Contacted',
    pipelineValue: 3600000, // ₹36 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Tiered vector quantization for 50M+ embeddings (saw your GitHub issue)

Hi Kavita,

I came across your note on the LangChain repo regarding Milvus/pgvector HNSW graphs exceeding 64GB pod memory limits during 50M embedding re-indexing.

Holding full 1536-dim FP32 vectors hot in RAM quickly becomes an unsustainable cost on infrastructure once you scale past 20M documents.

We developed an intelligent tiered vector memory cache that applies adaptive product quantization: it keeps high-frequency cluster centroids hot in RAM while streaming compressed residual vectors with sub-8ms p99 similarity recall.

Would love to share our architecture paper with your team.

Best regards,
Arjun Mehta`,
      technical: `Subject: Sub-8ms vector search on 50M embeddings under 16GB RAM

Kavita — saw your 64GB OOMKilled crash on the HNSW index build.

Instead of over-provisioning memory-dense GPU instances, our tiered cache decouples index traversal from raw vector storage using 8-bit scalar quantization + asynchronous pre-fetching.

Achieves 75% RAM reduction while maintaining 99.2% recall at 7ms p99 latency.

Can share a reproducible Docker benchmark if you'd like to test against your dataset.

Arjun Mehta`,
      executive: `Subject: Slashing HyperVector's vector cloud infrastructure spend by 70%

Hi Kavita,

As HyperVector onboards enterprise legal and finance clients, vector indexing memory costs can rapidly erode gross margins.

Our vector caching platform enables enterprise AI companies to index 100M+ high-dimensional embeddings on commodity Kubernetes nodes, cutting cloud memory expenses by up to 70% while improving search latency.

Could we schedule a concise 15-minute briefing on our customer benchmark results?

Arjun Mehta`
    },
    lastOutreachSent: '2026-10-09T05:00:00Z'
  },
  {
    id: 'opp-3',
    company: 'PaySetu Networks',
    domain: 'paysetu.com',
    location: 'Mumbai, Maharashtra & Bengaluru',
    industry: 'Fintech & Payment Gateway',
    companySize: '780 employees · Series D Unicorn',
    title: 'Snowflake credit runaway and dbt warehouse lockup on 8TB transaction ledger',
    source: 'Hacker News',
    sourceChannel: 'Ask HN: Snowflake Cost Management',
    sourceUrl: 'https://news.ycombinator.com/item?id=39182301',
    author: 'tarun_dataplatform (Director of Data Engineering)',
    postedAt: '7 hours ago · IST',
    postedDate: '09 Oct 2026',
    timestamp: '2026-10-09T01:30:00Z',
    severity: 'High',
    technologies: ['Snowflake', 'dbt', 'SQL', 'AWS', 'Apache Airflow'],
    score: 88,
    scoreBreakdown: {
      technicalSeverity: 86,
      capabilityMatch: 90,
      buyerAuthority: 94,
      urgency: 84
    },
    scoreExplanation: 'PaySetu consumed their quarterly Snowflake credit budget in under 3 weeks due to ad-hoc Cartesian joins and unpartitioned dbt incremental transformations across transaction tables.',
    originalExcerpt: `Our data warehouse bill spiked 340% month-over-month.
Analysts are running unconstrained dbt runs against 8TB ledger tables without date partition pruning.
Warehouse auto-suspend was disabled on an XL cluster for a weekend reporting job.
CFO just locked all warehouse resizing requests.
Looking for automated query circuit breakers and continuous cost governors that can cancel rogue queries before they burn 50 credits each.`,
    problemSummary: 'Data platform Snowflake credit burn exceeded quarterly budget in 18 days. Unpartitioned dbt models and runaway queries run unchecked across 8TB transaction datasets.',
    rootCause: 'Absence of real-time query cost estimation, automated query circuit breakers, and warehouse concurrency guards.',
    companyMatch: {
      name: 'PaySetu Networks',
      verifiedDomain: 'paysetu.com',
      location: 'Mumbai, Maharashtra & Bengaluru',
      stage: 'Series D Unicorn (₹1,700 Cr total funding)',
      employees: '780',
      buyerPersona: 'Director of Data Platform & FinOps Lead',
      targetContact: 'Tarun Mathur, Director of Data Platform',
      contactEmail: 'tarun.m@paysetu.com',
      techStackConfirmed: ['Snowflake Enterprise', 'dbt Cloud', 'Airflow', 'AWS Mumbai (ap-south-1)']
    },
    evidence: [
      'Hacker News post by verified PaySetu engineering lead describing 340% credit spike',
      'Public LinkedIn updates celebrating UPI volume crossing 120M monthly transactions',
      'Finance leadership mandate for automated query cost controls'
    ],
    recommendedAction: 'Engage Tarun Mathur with our automated Query Cost Governor case study demonstrating how a peer payment firm saved ₹26L/quarter with automated query circuit breaking.',
    pipelineStage: 'Engaged',
    pipelineValue: 6400000, // ₹64 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Automated circuit breakers for runaway Snowflake queries (re: HN discussion)

Hi Tarun,

I saw your comment on Hacker News regarding Snowflake credit runaway and unpartitioned dbt incremental runs hitting 8TB tables.

When analysts and scheduled dbt DAGs trigger unpartitioned scans on XL warehouses, native Snowflake resource monitors are unfortunately retrospective—notifying you only after credits have burned.

Our Query Governor acts as an intelligent pre-execution proxy: it parses SQL ASTs and estimated partition scan volume before execution, automatically blocking queries projected to exceed credit thresholds.

We recently helped an enterprise payment gateway reduce monthly Snowflake consumption by 36% within 14 days of deployment.

Would love to share our short case study if helpful.

Best regards,
Arjun Mehta`,
      technical: `Subject: Pre-execution AST circuit breaker for Snowflake / dbt queries

Tarun — following up on your HN post about dbt models triggering full table scans on 8TB datasets.

Our agent hooks into Snowflake query history & dbt hooks to intercept Cartesian joins and missing WHERE partition clauses before warehouse compute spins up. Enforces hard per-query credit budgets with zero disruption to compliant BI dashboards.

Happy to set up a test shadow-mode run on your dev warehouse.

Arjun Mehta`,
      executive: `Subject: Restoring Snowflake cost governance and CFO alignment at PaySetu

Hi Tarun,

Managing sudden 300%+ data warehouse cost spikes while supporting transaction analytics growth is a difficult challenge.

We partner with high-growth fintechs to implement automated data warehouse governance—saving substantial cloud spend while eliminating the friction of manual CFO approvals.

Could we schedule 15 minutes this week to discuss our cost containment framework?

Arjun Mehta`
    },
    lastOutreachSent: '2026-10-08T10:50:00Z'
  },
  {
    id: 'opp-4',
    company: 'KubeGati Technologies',
    domain: 'kubegati.io',
    location: 'Bengaluru, Karnataka',
    industry: 'Cloud Infrastructure & Developer Tools',
    companySize: '160 employees · Series B',
    title: '504 Gateway Timeouts and Envoy TLS saturation on AWS EKS ingress controller',
    source: 'Stack Overflow',
    sourceChannel: 'Question #78192301',
    sourceUrl: 'https://stackoverflow.com/questions/78192301/eks-ingress-504-envoy-handshake-saturation',
    author: 'siddharth_cloud_arch (Principal SRE)',
    postedAt: '10 hours ago · IST',
    postedDate: '08 Oct 2026',
    timestamp: '2026-10-08T20:45:00Z',
    severity: 'Critical',
    technologies: ['Kubernetes', 'AWS EKS', 'Envoy', 'NGINX Ingress', 'TLS'],
    score: 95,
    scoreBreakdown: {
      technicalSeverity: 98,
      capabilityMatch: 96,
      buyerAuthority: 92,
      urgency: 96
    },
    scoreExplanation: 'KubeGati has recurring 504 gateway timeouts during flash traffic bursts. TLS cryptographic handshakes saturate ingress CPU cores, starving Envoy health check workers and dropping healthy upstream pods.',
    originalExcerpt: `HTTP 504 Gateway Timeout during sudden 50k req/sec burst.
Envoy proxy downstream connection resets: TLS handshake worker thread pool pinned at 100% CPU.
Health checks to upstream target groups failing intermittently even though application pods have 20% CPU headroom.
We increased keepalive to 300s and bumped ingress replicas from 16 to 48, but the ingress pods keep thrashing.
Need a zero-downtime edge gateway with hardware-accelerated TLS termination and connection pooling.`,
    problemSummary: '504 Gateway timeouts caused by TLS handshake CPU saturation on AWS EKS ingress pods during traffic bursts, triggering false upstream health-check failures.',
    rootCause: 'Cryptographic TLS handshakes monopolizing single-threaded Envoy event loops without hardware offload.',
    companyMatch: {
      name: 'KubeGati Technologies',
      verifiedDomain: 'kubegati.io',
      location: 'Bengaluru, Karnataka',
      stage: 'Series B (₹230 Cr funding)',
      employees: '160',
      buyerPersona: 'VP of Infrastructure / Principal Cloud Architect',
      targetContact: 'Siddharth Iyer, VP of Infrastructure & Operations',
      contactEmail: 'siddharth.i@kubegati.io',
      techStackConfirmed: ['AWS EKS', 'Envoy Proxy', 'Go Microservices', 'Datadog']
    },
    evidence: [
      'Detailed Stack Overflow question with precise Envoy config snippet and CPU profiling charts',
      'Author identified as principal systems architect at KubeGati Bengaluru office',
      'Customer support threads mentioning intermittent gateway latency during morning business hours'
    ],
    recommendedAction: 'Schedule an architecture demonstration with Siddharth Iyer showcasing our Hardware-Accelerated Edge Ingress gateway with connection throttling.',
    pipelineStage: 'Meeting',
    pipelineValue: 5200000, // ₹52 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: KubeGati's EKS Ingress 504s & TLS handshake thread saturation

Hi Siddharth,

I noticed your engineering team analyzing the 504 gateway timeouts under 50k RPS spikes and Envoy TLS handshake saturation on Stack Overflow.

When traffic spikes hit standard EKS ingress controllers, RSA/ECDHE handshakes can starve Envoy's event loops, triggering false-positive health check timeouts against healthy upstream targets. Scaling replica counts often simply shifts the bottleneck.

Our Edge Gateway decouples TLS session resumption with asynchronous crypto offload and isolated health checks, keeping latency flat under 100k+ RPS bursts.

Would you be open to a 15-minute architecture review this week?

Best regards,
Arjun Mehta`,
      technical: `Subject: Fixing Envoy TLS event loop saturation under 50k RPS

Siddharth — saw the thread on EKS ingress pods hitting 100% CPU on TLS handshakes while backends sit idle.

We solved this by decoupling cryptographic handshake termination from the routing event loop, enabling 4x connection throughput per pod without 504 drops.

I can spin up a quick synthetic load-test script matching your 50k RPS profile if you want to inspect the p99 latency curve.

Arjun Mehta`,
      executive: `Subject: Eliminating gateway latency during KubeGati's high-volume API bursts

Hi Siddharth,

As KubeGati expands customer API workloads, edge infrastructure reliability is fundamental to contract SLAs.

We help fast-scaling infrastructure platforms eliminate 504 gateway timeouts during traffic spikes, ensuring uninterrupted API availability without over-provisioning expensive ingress clusters.

Would love to share how we helped similar platforms withstand 10x traffic surges with zero dropped requests.

Arjun Mehta`
    },
    lastOutreachSent: '2026-10-07T08:30:00Z'
  },
  {
    id: 'opp-5',
    company: 'AuraHealth Digital',
    domain: 'aurahealth.in',
    location: 'Hyderabad, Telangana',
    industry: 'Healthcare SaaS & Clinical Analytics (ABDM)',
    companySize: '290 employees · Series C',
    title: 'HIPAA and ABDM network isolation audit failure on multi-tenant Kubernetes with Cilium',
    source: 'Reddit',
    sourceChannel: 'r/kubernetes',
    sourceUrl: 'https://reddit.com/r/kubernetes/comments/1e78m1/hipaa_audit_cilium_networkpolicy_audit_logs',
    author: 'pradeep_infosec_lead',
    postedAt: '14 hours ago · IST',
    postedDate: '08 Oct 2026',
    timestamp: '2026-10-08T16:30:00Z',
    severity: 'High',
    technologies: ['Kubernetes', 'Cilium', 'eBPF', 'ABDM', 'AWS'],
    score: 89,
    scoreBreakdown: {
      technicalSeverity: 88,
      capabilityMatch: 92,
      buyerAuthority: 91,
      urgency: 87
    },
    scoreExplanation: 'AuraHealth is preparing for hospital partner security re-certification. Security auditors flagged that Cilium NetworkPolicy drops lack immutable cryptographic audit logging across tenant namespaces.',
    originalExcerpt: `Our healthcare compliance auditor just rejected our network egress isolation evidence.
We have 45 enterprise hospital systems sharing our multi-tenant EKS cluster.
While Cilium NetworkPolicies enforce namespace drops, we cannot produce non-repudiable audit logs showing that patient data packets never crossed tenant namespace boundaries.
If we do not submit verified cryptographic tenant isolation by end of month, we risk losing hospital contract renewals.
Need an automated eBPF compliance logging and policy enforcement suite.`,
    problemSummary: 'Imminent audit non-compliance due to lack of verifiable, immutable eBPF network isolation logs between multi-tenant hospital customer pods.',
    rootCause: 'Standard Kubernetes NetworkPolicy configurations do not provide tamper-evident cryptographic provenance logs required by healthcare compliance auditors.',
    companyMatch: {
      name: 'AuraHealth Digital',
      verifiedDomain: 'aurahealth.in',
      location: 'Hyderabad, Telangana',
      stage: 'Series C (₹510 Cr funding)',
      employees: '290',
      buyerPersona: 'VP of Information Security / CISO',
      targetContact: 'Pradeep Chari, Chief Information Security Officer',
      contactEmail: 'pradeep.c@aurahealth.in',
      techStackConfirmed: ['Kubernetes', 'Cilium eBPF', 'AWS', 'Postgres', 'Terraform']
    },
    evidence: [
      'Reddit post citing strict 30-day auditor deadline and 45 hospital customer networks',
      'AuraHealth recently announced partnership with 3 major hospital chains in Southern India',
      'High business risk: Compliance audit failure directly blocks enterprise contract renewals'
    ],
    recommendedAction: 'Contact Pradeep Chari (CISO) highlighting our eBPF Network Audit Guard that generates auditor-ready cryptographic isolation proofs.',
    pipelineStage: 'New',
    pipelineValue: 7200000, // ₹72 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Auditor-ready eBPF network isolation for AuraHealth's multi-tenant EKS

Hi Pradeep,

I noticed discussions around the challenge of satisfying healthcare auditor requirements for tenant namespace isolation evidence on multi-tenant Kubernetes with Cilium.

Auditors frequently struggle with raw Hubble or iptables logs because they don't produce a continuous, cryptographic audit trail proving zero cross-tenant packet leakage.

We created an eBPF Network Compliance Suite that runs alongside Cilium, generating tamper-proof egress audit proofs and automated isolation attestation reports ready for auditors.

Given your upcoming certification timeline, would you be interested in a 10-minute demo of the auditor report pack?

Best regards,
Arjun Mehta`,
      technical: `Subject: Cryptographic tenant boundary enforcement & audit trail for Cilium

Pradeep — saw your post regarding auditor rejection of standard Cilium egress logs.

Our eBPF probe records kernel-level socket provenance with cryptographic hash chaining per tenant namespace. Provides verifiable proof that no health data packets crossed tenant boundaries, fully satisfying strict compliance requirements without latency penalty.

Happy to provide our compliance attestation template that past auditors approved.

Arjun Mehta`,
      executive: `Subject: Securing AuraHealth's hospital compliance certification ahead of deadline

Hi Pradeep,

Protecting 45 hospital partner contracts while meeting rigorous compliance standards is critical for AuraHealth's reputation.

Our compliance infrastructure platform automates tenant isolation verification on Kubernetes, helping healthcare SaaS providers pass enterprise audits with zero remediation delay.

Could we schedule a brief discussion this week to review our compliance accelerator?

Arjun Mehta`
    },
    lastOutreachSent: null
  },
  {
    id: 'opp-6',
    company: 'OmniFlow Logistics',
    domain: 'omniflow.in',
    location: 'Gurugram, Haryana',
    industry: 'Real-time Event Streaming & E-Commerce Logistics',
    companySize: '140 employees · Series B',
    title: 'Kafka consumer group rebalancing storms freezing event pipeline during pod autoscaling',
    source: 'GitHub',
    sourceChannel: 'apache/kafka Discussions #8812',
    sourceUrl: 'https://github.com/apache/kafka/discussions/8812',
    author: 'manish_stream_dev (Distributed Systems Lead)',
    postedAt: '18 hours ago · IST',
    postedDate: '08 Oct 2026',
    timestamp: '2026-10-08T13:00:00Z',
    severity: 'Medium',
    technologies: ['Apache Kafka', 'Java', 'Spring Boot', 'AWS MSK', 'Kubernetes HPA'],
    score: 82,
    scoreBreakdown: {
      technicalSeverity: 80,
      capabilityMatch: 86,
      buyerAuthority: 82,
      urgency: 80
    },
    scoreExplanation: 'OmniFlow experiences 3-5 minute pipeline freezes during Kubernetes horizontal pod autoscaling. Kafka cooperative sticky assignor fails under heavy backpressure, triggering cascading consumer group rebalances.',
    originalExcerpt: `Every time our K8s HPA scales our clickstream consumer pods from 30 to 50 during festive flash sales, the entire consumer group triggers a rebalance storm.
Processing halts for 180-300 seconds.
Consumer lag skyrockets to 4.2M events and downstream databases get bombarded when processing resumes.
max.poll.interval.ms and session.timeout.ms tweaks have not solved this.
Need a jitter-free consumer partition assignment coordinator or buffer proxy.`,
    problemSummary: 'Kafka consumer group rebalance storms during Kubernetes HPA scaling events cause 3-5 minute processing freezes and downstream lag spikes.',
    rootCause: 'Consumer pods joining simultaneously trigger cascading partition revocations across high-partition topics under sustained consumer lag.',
    companyMatch: {
      name: 'OmniFlow Logistics',
      verifiedDomain: 'omniflow.in',
      location: 'Gurugram, Haryana',
      stage: 'Series B (₹180 Cr funding)',
      employees: '140',
      buyerPersona: 'Head of Data Platform / Streaming Lead',
      targetContact: 'Manish Verma, Head of Streaming Platform',
      contactEmail: 'manish.v@omniflow.in',
      techStackConfirmed: ['Apache Kafka', 'AWS MSK', 'Java Spring Boot', 'Kubernetes HPA']
    },
    evidence: [
      'Comprehensive GitHub discussion citing 4.2M lag spikes during autoscaling events',
      'Author identified as core streaming architect at OmniFlow Logistics Gurugram office',
      'Upcoming festive sale peak will multiply event ingest volume by 5x'
    ],
    recommendedAction: 'Engage Manish Verma with our Adaptive Stream Buffer guide demonstrating how to eliminate Kafka consumer group rebalance freezes during autoscaling.',
    pipelineStage: 'Qualified',
    pipelineValue: 3400000, // ₹34 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Eliminating Kafka rebalance storms during K8s HPA scaling at OmniFlow

Hi Manish,

Saw your discussion on Apache Kafka #8812 regarding 3-5 minute partition rebalance freezes when HPA spins up clickstream consumers.

When high-throughput topics experience lag, consumer pod joins trigger synchronous partition revocations that cause the exact backpressure spike you described.

Our Streaming Ingress Proxy buffers partition assignments dynamically, performing phased warm-starts so new consumers take over partitions gradually with zero global stop-the-world pauses.

Happy to send over our engineering whitepaper if your team is exploring solutions ahead of festive peak.

Best regards,
Arjun Mehta`,
      technical: `Subject: Zero-pause Kafka consumer scaling under heavy lag

Manish — saw your note on consumer group rebalances freezing your pipeline for 300s.

We developed a sidecar proxy that manages cooperative assignments out-of-band, allowing HPA to scale pods from 30 to 50 without revoking active partitions from running consumers. Consumer lag stays flat throughout the scale event.

Let me know if you want to test the Helm chart on a sandbox topic.

Arjun Mehta`,
      executive: `Subject: Ensuring real-time event pipeline reliability during OmniFlow peak traffic

Hi Manish,

Maintaining uninterrupted stream processing while scaling to meet peak customer event spikes is crucial for OmniFlow's logistics commitments.

Our streaming infrastructure layer prevents consumer group rebalances from freezing pipelines during sudden volume surges, safeguarding your data latency SLAs.

Could we schedule a brief 15-minute conversation on our streaming resilience benchmarks?

Arjun Mehta`
    },
    lastOutreachSent: null
  },
  {
    id: 'opp-7',
    company: 'SecurMatrix ID',
    domain: 'securmatrix.in',
    location: 'Chennai, Tamil Nadu',
    industry: 'Enterprise Security & Identity Access',
    companySize: '95 employees · Series A',
    title: 'Enterprise Okta SAML 2.0 customer tenant migration breaks and certificate rotation outages',
    source: 'Hacker News',
    sourceChannel: 'Discussion: SAML & Enterprise SSO hell',
    sourceUrl: 'https://news.ycombinator.com/item?id=39201944',
    author: 'karthik_idp_lead',
    postedAt: '1 day ago · IST',
    postedDate: '08 Oct 2026',
    timestamp: '2026-10-08T05:30:00Z',
    severity: 'Critical',
    technologies: ['Okta', 'SAML 2.0', 'Keycloak', 'OAuth2', 'OpenID Connect'],
    score: 93,
    scoreBreakdown: {
      technicalSeverity: 94,
      capabilityMatch: 95,
      buyerAuthority: 90,
      urgency: 94
    },
    scoreExplanation: 'SecurMatrix is migrating 40+ enterprise customer tenants from legacy Okta configs to their self-hosted IDP. Frequent XML certificate rotation failures are locking enterprise users out of production.',
    originalExcerpt: `Migrating 40 enterprise customers to our new identity gateway is a nightmare.
Each customer has custom SAML assertion attributes, signed XML assertions with expiring certs, and quirky Azure AD / Okta edge cases.
Last week a cert rotation failed and locked 1,200 employees of our biggest enterprise client out for 4 hours.
We are spending 60% of engineering bandwidth manually debugging SAML metadata and XML signatures.
Is there an enterprise SSO bridge that automates SAML federation and zero-downtime cert rotation?`,
    problemSummary: 'Enterprise customer SSO migration is stalling. SAML certificate rotation failures caused a 4-hour customer lockout for their largest client.',
    rootCause: 'Manual identity provider metadata synchronization and brittle XML digital signature verification across diverse customer enterprise IdPs.',
    companyMatch: {
      name: 'SecurMatrix ID',
      verifiedDomain: 'securmatrix.in',
      location: 'Chennai, Tamil Nadu',
      stage: 'Series A (₹130 Cr funding)',
      employees: '95',
      buyerPersona: 'VP of Customer Engineering / Head of Identity',
      targetContact: 'Karthik Subramanian, Head of Identity Engineering',
      contactEmail: 'karthik.s@securmatrix.in',
      techStackConfirmed: ['Keycloak', 'SAML 2.0', 'OpenID Connect', 'Go', 'Docker']
    },
    evidence: [
      'HN post recounting 4-hour enterprise lockout incident and ongoing manual cert maintenance burden',
      'SecurMatrix announces major enterprise compliance push to close domestic banking deals',
      'Direct operational bottleneck threatening new enterprise account onboarding'
    ],
    recommendedAction: 'Send technical outreach to Karthik Subramanian proposing our Enterprise SAML/OIDC Gateway with automated certificate rotation and zero-touch tenant onboarding.',
    pipelineStage: 'New',
    pipelineValue: 4500000, // ₹45 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Automating enterprise SAML cert rotation and tenant migrations at SecurMatrix

Hi Karthik,

I read your comment on Hacker News regarding the challenge of migrating 40+ enterprise customer SAML tenants and the recent cert rotation outage.

Manually parsing diverse customer XML assertions from Okta, Azure AD, and Ping while managing rotation windows is notoriously brittle and consumes ridiculous amounts of engineering time.

Our Enterprise SSO Bridge automates this entire lifecycle: it provides self-serve onboarding portals for your customers, dynamic metadata polling, and zero-downtime dual-cert validation so expirations never cause customer lockouts.

Would love to share our architecture doc with your team.

Best regards,
Arjun Mehta`,
      technical: `Subject: Zero-downtime SAML certificate rotation for Okta / Azure AD tenants

Karthik — saw your note about the 4-hour enterprise lockout caused by an expired SAML signing cert.

Our gateway maintains automated dual-cert rollover: it validates incoming assertions against both active and pending certs until the IdP completes rotation, completely eliminating downtime. Also supports arbitrary JSON-to-SAML attribute remapping.

Can share an API demo sandbox if you want to test it against an Okta dev tenant.

Arjun Mehta`,
      executive: `Subject: Accelerating enterprise onboarding and eliminating SSO outage risk

Hi Karthik,

As SecurMatrix closes larger enterprise accounts, reliable Single Sign-On onboarding is critical to net revenue retention and fast customer time-to-value.

We help SaaS companies automate enterprise identity federation, eliminating manual SAML debugging and safeguarding against customer-facing authentication outages.

Could we schedule a brief 15-minute intro this week?

Arjun Mehta`
    },
    lastOutreachSent: null
  },
  {
    id: 'opp-8',
    company: 'PulseTrace Telemetry',
    domain: 'pulsetrace.io',
    location: 'Pune, Maharashtra',
    industry: 'Observability & APM Monitoring',
    companySize: '110 employees · Series B',
    title: 'Redis memory fragmentation ratio spikes to 3.8 causing cache evictions & database thundering herd',
    source: 'Stack Overflow',
    sourceChannel: 'Question #78144219',
    sourceUrl: 'https://stackoverflow.com/questions/78144219/redis-memory-fragmentation-elsticache-thundering-herd',
    author: 'anand_sys_lead (Staff Systems Architect)',
    postedAt: '1 day ago · IST',
    postedDate: '08 Oct 2026',
    timestamp: '2026-10-08T04:10:00Z',
    severity: 'Medium',
    technologies: ['Redis', 'AWS ElastiCache', 'PostgreSQL', 'Node.js', 'Docker'],
    score: 78,
    scoreBreakdown: {
      technicalSeverity: 76,
      capabilityMatch: 82,
      buyerAuthority: 78,
      urgency: 77
    },
    scoreExplanation: 'PulseTrace suffers from extreme Redis memory fragmentation (ratio > 3.8) on AWS ElastiCache. Key eviction triggers repeated thundering herds on their primary PostgreSQL database.',
    originalExcerpt: `mem_fragmentation_ratio: 3.82
used_memory: 14.2G, used_memory_rss: 54.1G
AWS ElastiCache Redis cluster is throwing OOM and dropping volatile-lru keys unexpectedly.
Whenever high-traffic keys get evicted, thousands of concurrent requests bypass the cache and hammer Postgres, spiking DB CPU to 99%.
activedefrag yes is enabled but jemalloc doesn't seem to reclaim fragmented pages under write-heavy workloads.
How do teams prevent cache eviction thundering herds?`,
    problemSummary: 'Extreme Redis memory fragmentation causes premature key evictions on AWS ElastiCache, resulting in massive thundering herds that overwhelm their primary PostgreSQL database.',
    rootCause: 'Jemalloc memory allocator fragmentation under mixed-size TTL key write workloads combined with lack of cache stampede protection.',
    companyMatch: {
      name: 'PulseTrace Telemetry',
      verifiedDomain: 'pulsetrace.io',
      location: 'Pune, Maharashtra',
      stage: 'Series B (₹250 Cr funding)',
      employees: '110',
      buyerPersona: 'Principal Systems Architect / Lead Infrastructure Engineer',
      targetContact: 'Anand Kulkarni, Principal Systems Architect',
      contactEmail: 'anand.k@pulsetrace.io',
      techStackConfirmed: ['Redis 7', 'AWS ElastiCache', 'PostgreSQL', 'Go', 'Node.js']
    },
    evidence: [
      'Detailed Stack Overflow question displaying Redis INFO memory metrics and fragmentation ratio',
      'Author actively seeking architectural solutions to prevent cache stampedes',
      'Recent product release notes indicating 3x surge in ingested telemetry metrics'
    ],
    recommendedAction: 'Share our Cache Stampede & Memory Defoamer technical playbook with Anand Kulkarni, illustrating probabilistic early expiration (XFetch algorithm) and memory pooling.',
    pipelineStage: 'Contacted',
    pipelineValue: 2800000, // ₹28 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Preventing Redis cache evictions & database thundering herds (Stack Overflow)

Hi Anand,

I noticed your Stack Overflow post regarding Redis memory fragmentation hitting 3.8 on ElastiCache and subsequent Postgres thundering herds.

When jemalloc handles variable-length metric blobs and high TTL churn, fragmentation can easily cause RSS memory to balloon 3x over active data, forcing premature LRU evictions that crash the primary database.

We solved this with a smart caching layer implementing the XFetch optimal probabilistic early expiration algorithm combined with connection collapsing, completely eliminating cache stampedes even during complete Redis flushes.

Happy to share our implementation benchmarks if useful for your observability cluster.

Best regards,
Arjun Mehta`,
      technical: `Subject: Eliminating Redis cache stampedes with probabilistic early refresh

Anand — saw your memory fragmentation ratio issue on ElastiCache.

Rather than over-provisioning memory nodes to fight jemalloc fragmentation, our client-side proxy uses single-flight request coalescing and background delta refresh to guarantee zero thundering herds on Postgres when Redis evicts keys.

Would be happy to share our Node/Go SDK benchmark script.

Arjun Mehta`,
      executive: `Subject: Protecting database stability from Redis cache volatility at PulseTrace

Hi Anand,

As PulseTrace ingests greater telemetry volumes, caching layer reliability is foundational to platform responsiveness.

We assist high-volume monitoring platforms in preventing database overload caused by cache evictions, guaranteeing uninterrupted query speed.

Could we schedule 15 minutes this week to share our architecture benchmarks?

Arjun Mehta`
    },
    lastOutreachSent: '2026-10-08T09:30:00Z'
  },
  {
    id: 'opp-9',
    company: 'RetailSetu Cloud',
    domain: 'retailsetu.com',
    location: 'Noida, Uttar Pradesh',
    industry: 'Omnichannel Retail & Quick-Commerce Tech',
    companySize: '450 employees · Growth Stage',
    title: 'Cross-AZ AWS NAT Gateway data transfer bill shock (₹15.2L/mo) from unrouted container pulls',
    source: 'Reddit',
    sourceChannel: 'r/aws',
    sourceUrl: 'https://reddit.com/r/aws/comments/1f200a/nat_gateway_data_transfer_bill_nightmare',
    author: 'deepak_cloud_finops',
    postedAt: '2 days ago · IST',
    postedDate: '07 Oct 2026',
    timestamp: '2026-10-07T08:40:00Z',
    severity: 'High',
    technologies: ['AWS VPC', 'NAT Gateway', 'Docker', 'Amazon S3', 'Terraform'],
    score: 85,
    scoreBreakdown: {
      technicalSeverity: 84,
      capabilityMatch: 88,
      buyerAuthority: 89,
      urgency: 80
    },
    scoreExplanation: 'RetailSetu discovered an unexpected ₹15.2 Lakhs/month invoice on AWS for NAT Gateway data transfer fees. Microservices in ap-south-1a pull multi-GB container images and S3 assets via NAT Gateways in ap-south-1b without VPC endpoints.',
    originalExcerpt: `Our AWS bill arrived and NAT Gateway data processing fees jumped from ₹98,000 to ₹16,20,000 in 60 days.
We traced it to Kubernetes nodes pulling multi-GB container images from ECR and streaming assets from S3 over the public internet through cross-AZ NAT Gateways.
We attempted manual VPC endpoint routing in Terraform, but keeping route tables in sync across 14 VPCs is a logistical nightmare.
Any tool that automatically maps internal AWS service traffic to private VPC endpoints and warns on cross-AZ egress?`,
    problemSummary: 'Unexpected ₹15.2L/mo AWS invoice surge caused by container images and S3 traffic routing across availability zones through public NAT Gateways instead of private VPC endpoints.',
    rootCause: 'Missing VPC Gateway and Interface Endpoints across 14 multi-account VPCs causing internal traffic to route through metered NAT Gateways.',
    companyMatch: {
      name: 'RetailSetu Cloud',
      verifiedDomain: 'retailsetu.com',
      location: 'Noida, Uttar Pradesh',
      stage: 'Growth Stage / Private Equity backed',
      employees: '450',
      buyerPersona: 'Director of Cloud Operations & FinOps Lead',
      targetContact: 'Deepak Saxena, Director of Cloud Operations',
      contactEmail: 'deepak.s@retailsetu.com',
      techStackConfirmed: ['AWS Multi-Account', 'Amazon EKS', 'Terraform', 'ECR', 'Amazon S3']
    },
    evidence: [
      'Reddit post with exact invoice breakout and ₹15.2L cost spike',
      'Author identified as cloud infrastructure director at RetailSetu Cloud',
      'Rapidly deploying multi-region retail microservices ahead of festival sale season'
    ],
    recommendedAction: 'Provide our automated VPC Traffic Analyzer and Private Endpoint Controller which resolved this issue for RetailSetu, leading to successful contract close.',
    pipelineStage: 'Won/Lost',
    pipelineValue: 3800000, // ₹38 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Slashing RetailSetu's AWS NAT Gateway data transfer costs

Hi Deepak,

I saw your Reddit post regarding the ₹15.2L/mo NAT Gateway data transfer bill caused by container image pulls and S3 traffic crossing availability zones.

Managing VPC Endpoints manually across 14 multi-account VPCs via Terraform often results in accidental egress routes that slip through unnoticed until the monthly AWS bill arrives.

Our Cloud Network Governor automatically scans your VPC route tables, detects un-endpointed AWS service traffic, and provisions local Gateway/Interface endpoints with zero traffic interruption.

Would love to share how we helped an enterprise retail platform eliminate ₹20L/mo in NAT fees in under 48 hours.

Best regards,
Arjun Mehta`,
      technical: `Subject: Automated VPC endpoint provisioning to eliminate NAT data fees

Deepak — saw the breakdown of your ₹16L NAT Gateway invoice.

We built an open-core daemon that audits ENI packet flows and injects private VPC endpoints for S3, ECR, and DynamoDB directly into your subnets, redirecting gigabytes of traffic off NAT gateways instantaneously.

Happy to provide our free audit CLI script to scan all 14 VPCs.

Arjun Mehta`,
      executive: `Subject: Recovering ₹15L/mo in unnecessary AWS egress spend for RetailSetu

Hi Deepak,

Managing cloud unit economics while scaling quick-commerce retail services requires proactive cost control.

We help enterprise cloud teams automatically eliminate unnecessary AWS data transfer fees, turning surprise multi-lakh cloud line items into immediate bottom-line savings.

Could we schedule 10 minutes this week to discuss our automated networking cost containment?

Arjun Mehta`
    },
    lastOutreachSent: '2026-10-06T05:30:00Z'
  },
  {
    id: 'opp-10',
    company: 'DataKavach Analytics',
    domain: 'datakavach.co',
    location: 'Kochi, Kerala',
    industry: 'Customer Data Platform & CDP',
    companySize: '150 employees · Series B',
    title: 'ClickHouse query thread starvation during concurrent user dashboard loading',
    source: 'Hacker News',
    sourceChannel: 'Ask HN: Scaling ClickHouse for user-facing analytics',
    sourceUrl: 'https://news.ycombinator.com/item?id=39211029',
    author: 'george_cdp_dev (Core Infra Lead)',
    postedAt: '2 days ago · IST',
    postedDate: '07 Oct 2026',
    timestamp: '2026-10-07T02:45:00Z',
    severity: 'Medium',
    technologies: ['ClickHouse', 'Docker', 'Kubernetes', 'Go', 'React'],
    score: 84,
    scoreBreakdown: {
      technicalSeverity: 82,
      capabilityMatch: 87,
      buyerAuthority: 85,
      urgency: 83
    },
    scoreExplanation: 'DataKavach faces ClickHouse thread starvation when enterprise customer dashboards load concurrently. Heavy aggregation queries monopolize CPU threads, causing 12s+ latency for simple customer lookup queries.',
    originalExcerpt: `ClickHouse handles 100M rows in 200ms when tested sequentially.
However, when 50 enterprise users open their analytics dashboard at 9am, max_threads (32) gets exhausted immediately.
Single heavy queries starve quick point lookups, causing dashboard loading spinners to hang for 12+ seconds.
We tried setting max_execution_time but users complain about aborted queries.
Looking for an intelligent query scheduler and aggregation cache layer for ClickHouse.`,
    problemSummary: 'ClickHouse thread starvation under concurrent multi-tenant dashboard loads, causing simple customer queries to freeze for over 12 seconds.',
    rootCause: 'Lack of multi-tenant query priority scheduling and semantic result caching in front of the analytical column store.',
    companyMatch: {
      name: 'DataKavach Analytics',
      verifiedDomain: 'datakavach.co',
      location: 'Kochi, Kerala',
      stage: 'Series B (₹200 Cr funding)',
      employees: '150',
      buyerPersona: 'Head of Core Data Infrastructure',
      targetContact: 'George Mathew, Head of Data Platform',
      contactEmail: 'george.m@datakavach.co',
      techStackConfirmed: ['ClickHouse Cluster', 'Go Backend', 'Kafka', 'Kubernetes']
    },
    evidence: [
      'Hacker News post outlining 12s dashboard load times and ClickHouse thread exhaustion',
      'Author verified as analytics infrastructure lead at DataKavach Kochi office',
      'Company is actively marketing sub-second real-time dashboards to enterprise buyers'
    ],
    recommendedAction: 'Contact George Mathew with our Semantic Aggregation Cache and Fair-Share Query Scheduler architecture for ClickHouse.',
    pipelineStage: 'Qualified',
    pipelineValue: 4200000, // ₹42 Lakhs
    isDemoData: true,
    outreachDrafts: {
      consultative: `Subject: Fixing ClickHouse thread starvation under concurrent dashboard loads

Hi George,

I saw your question on Hacker News regarding ClickHouse thread starvation when 50+ concurrent users open their customer analytics dashboards.

ClickHouse is phenomenal for raw analytical throughput, but its default thread scheduler gives equal priority to heavy table scans, allowing a few complex aggregations to starve all lightweight lookups.

We developed an intelligent semantic caching proxy for ClickHouse that deduplicates identical aggregations and enforces fair-share query thread quotas per tenant. This guarantees point lookups return in <200ms even under peak concurrent dashboard load.

Would you be open to reviewing our architecture overview?

Best regards,
Arjun Mehta`,
      technical: `Subject: Fair-share query priority scheduling for ClickHouse clusters

George — saw your note on max_threads saturation causing 12s dashboard spinners.

Our proxy layer implements semantic query fingerprinting and fair-share work-stealing scheduling in front of ClickHouse HTTP endpoints, preventing heavy analytical scans from blocking sub-second dashboard widgets.

Can send over our query scheduler benchmarks if you'd like to inspect the latency distribution.

Arjun Mehta`,
      executive: `Subject: Guaranteeing sub-second dashboard performance for DataKavach customers

Hi George,

Delivering instantaneous dashboard analytics to enterprise users is core to DataKavach's customer retention and product promise.

We help fast-growing data analytics platforms eliminate query queuing delays during peak morning logins, ensuring reliable sub-second user experience without doubling server footprint.

Could we schedule 15 minutes this week to share our customer performance data?

Arjun Mehta`
    },
    lastOutreachSent: null
  }
];

export const KNOWLEDGE_BASE_DOCS = [
  {
    id: 'kb-1',
    category: 'Product Capability Specs',
    title: 'Adaptive Connection Multiplexer & Protocol Proxy',
    lastUpdated: '09 Oct 2026',
    summary: 'High-performance transparent proxy designed for PostgreSQL and MySQL that multiplexes thousands of client connections down to small connection pools while maintaining full prepared statement isolation.',
    targetProblems: [
      'FATAL: remaining connection slots are reserved for non-superuser connections',
      'Prisma prepared statement collision ("s0 already exists") in PgBouncer transaction mode',
      'RDS read replica failovers caused by client connection spikes'
    ],
    supportedStacks: ['PostgreSQL 13-16', 'MySQL 8.0', 'AWS RDS', 'Prisma ORM', 'TypeORM', 'Hibernate'],
    keyMetrics: '90% backend connection reduction, <0.4ms p99 latency overhead, 100% prepared statement compatibility.'
  },
  {
    id: 'kb-2',
    category: 'Product Capability Specs',
    title: 'Tiered Vector Memory Cache & HNSW Quantizer',
    lastUpdated: '09 Oct 2026',
    summary: 'Memory optimization and caching layer for enterprise vector databases (Milvus, pgvector, Qdrant, Pinecone) using adaptive product quantization to keep latency under 10ms with 75% less RAM.',
    targetProblems: [
      'Pod OOMKilled crashes during high-dimensional vector index construction',
      'Astronomical GPU / high-memory instance cloud bills for vector search',
      'Cold-start similarity search latencies exceeding 400ms'
    ],
    supportedStacks: ['pgvector', 'Milvus 2.4', 'Qdrant', 'OpenAI 1536-dim', 'Cohere 1024-dim', 'Kubernetes'],
    keyMetrics: '75% RAM footprint reduction, sub-8ms p99 recall, zero OOM indexing crashes.'
  },
  {
    id: 'kb-3',
    category: 'Product Capability Specs',
    title: 'Pre-Execution Query Cost Governor & Circuit Breaker',
    lastUpdated: '09 Oct 2026',
    summary: 'SQL AST parser and cost estimator that intercepts data warehouse queries (Snowflake, BigQuery, Databricks) and prevents runaway full table scans and accidental Cartesian joins before compute credits are consumed.',
    targetProblems: [
      'Snowflake credit budget exhaustion caused by unpartitioned dbt incremental runs',
      'Unconstrained Cartesian joins executed by ad-hoc BI users on multi-terabyte tables',
      'Finance leadership mandates and emergency warehouse resize freezes'
    ],
    supportedStacks: ['Snowflake Enterprise', 'dbt Cloud / Core', 'Google BigQuery', 'Databricks SQL', 'Airflow'],
    keyMetrics: 'Up to 42% cloud warehouse credit savings, real-time query interception in <5ms.'
  },
  {
    id: 'kb-4',
    category: 'Product Capability Specs',
    title: 'eBPF Cryptographic Tenant Isolation & Audit Guard',
    lastUpdated: '09 Oct 2026',
    summary: 'Kernel-level network monitoring and policy enforcement suite for multi-tenant Kubernetes clusters. Generates tamper-proof cryptographic logs to satisfy strict ABDM, HIPAA, and SOC2 compliance audits.',
    targetProblems: [
      'Healthcare compliance auditor rejection of standard Cilium or iptables logs',
      'Inability to prove non-repudiable multi-tenant namespace packet isolation',
      'Contract renewal blocks caused by missing regulatory audit trails'
    ],
    supportedStacks: ['Kubernetes 1.28+', 'Cilium eBPF', 'AWS EKS', 'GKE', 'ABDM / SOC2 Type II'],
    keyMetrics: 'Zero packet overhead, one-click auditor attestation export, 100% audit pass rate.'
  },
  {
    id: 'kb-5',
    category: 'Target ICP & Personas',
    title: 'Ideal Customer Profile (ICP) & Buying Personas (India & Global B2B)',
    lastUpdated: '09 Oct 2026',
    summary: 'Criteria used by DarkIntent to filter public technical discussions into high-probability enterprise buyer opportunities.',
    criteria: [
      { name: 'Target Locations', detail: 'Bengaluru, Chennai, Hyderabad, Pune, Mumbai, Gurugram, Noida, Kochi, plus international expansion hubs' },
      { name: 'Company Size', detail: '50 to 2,000 employees; Series A to Pre-IPO or high-growth PE-backed SaaS & Tech' },
      { name: 'Signal Urgency', detail: 'Production degradation, impending compliance audit, or cloud bill shock within the last 72 hours' },
      { name: 'Buyer Personas', detail: 'VP of Engineering, Staff/Principal SRE, Chief Information Security Officer, Director of Data Engineering' },
      { name: 'Disqualification Criteria', detail: 'Solo developers, hobbyist projects, open-source maintainers without commercial enterprise sponsorship' }
    ]
  },
  {
    id: 'kb-6',
    category: 'Case Studies & Battlecards',
    title: 'Indian Enterprise Case Studies & GTM Battlecards',
    lastUpdated: '09 Oct 2026',
    summary: 'Proven conversion talk tracks and resolution evidence for sales teams when reaching out to leads identified by DarkIntent.',
    caseStudies: [
      { client: 'Bengaluru Freight Unicorn (₹3,200 Cr GMV)', problem: 'PostgreSQL connection storms during flash sales', solution: 'Connection Multiplexer deployed in 1 hour; 0 replica reboots during festival peak.' },
      { client: 'Hyderabad HealthTech (45 hospital networks)', problem: 'Hospital compliance isolation audit failure', solution: 'eBPF Compliance Suite generated auditor-certified cryptographic proof in 2 days.' },
      { client: 'Mumbai FinTech Gateway (₹95,000 Cr transactions)', problem: 'Snowflake credit runaway by dbt models', solution: 'Query Governor blocked 1,400 rogue queries, saving ₹31 Lakhs in first quarter.' }
    ]
  }
];

export const ANALYTICS_DATA = {
  summary: {
    totalSignalsIngested: 1248,
    qualifiedOpportunities: 142,
    conversionRate: 18.4,
    avgDealVelocityDays: 14,
    totalPipelineIdentified: 41900000, // ₹4.19 Crores
    activeSourcesCount: 4
  },
  sourceDistribution: [
    { source: 'GitHub', count: 524, percentage: 42, conversionRate: 19.8, color: '#24292e' },
    { source: 'Reddit', count: 349, percentage: 28, conversionRate: 22.4, color: '#FF4500' },
    { source: 'Stack Overflow', count: 225, percentage: 18, conversionRate: 14.2, color: '#F48024' },
    { source: 'Hacker News', count: 150, percentage: 12, conversionRate: 24.0, color: '#FF6600' }
  ],
  techPainPoints: [
    { tech: 'PostgreSQL / RDS Connections', mentions: 184, avgScore: 92, severity: 'Critical' },
    { tech: 'Vector DB / Embedding Memory (OOM)', mentions: 142, avgScore: 89, severity: 'High' },
    { tech: 'Kubernetes Ingress & TLS Saturation', mentions: 128, avgScore: 94, severity: 'Critical' },
    { tech: 'Data Warehouse Cost Runaway (Snowflake)', mentions: 116, avgScore: 87, severity: 'High' },
    { tech: 'Enterprise SAML / SSO Cert Expiry', mentions: 98, avgScore: 91, severity: 'Critical' },
    { tech: 'Kafka Consumer Group Rebalance Storms', mentions: 84, avgScore: 82, severity: 'Medium' },
    { tech: 'Redis Fragmentation & Thundering Herds', mentions: 78, avgScore: 80, severity: 'Medium' },
    { tech: 'AWS NAT Gateway Cross-AZ Data Fees', mentions: 64, avgScore: 85, severity: 'High' }
  ],
  trendOverTime: [
    { day: '01 Oct', signals: 28, highIntent: 6 },
    { day: '02 Oct', signals: 34, highIntent: 9 },
    { day: '03 Oct', signals: 31, highIntent: 7 },
    { day: '04 Oct', signals: 42, highIntent: 12 },
    { day: '05 Oct', signals: 38, highIntent: 11 },
    { day: '06 Oct', signals: 49, highIntent: 14 },
    { day: '07 Oct', signals: 45, highIntent: 13 },
    { day: '08 Oct', signals: 52, highIntent: 16 },
    { day: '09 Oct', signals: 58, highIntent: 18 }
  ],
  funnelMetrics: [
    { stage: 'Public Signals Detected', count: 1248, rate: '100%' },
    { stage: 'Company & Stack Resolved', count: 580, rate: '46.5%' },
    { stage: 'Qualified Intent (Score 80+)', count: 142, rate: '24.5%' },
    { stage: 'Outreach Initiated', count: 88, rate: '62.0%' },
    { stage: 'Technical Meeting Held', count: 32, rate: '36.4%' },
    { stage: 'Won Opportunities', count: 14, rate: '43.8%' }
  ]
};
