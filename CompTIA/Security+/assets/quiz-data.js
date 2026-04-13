window.MODULE_LABELS = {
  "module1": "Module I - Security Foundations & Control Models",
  "module2": "Module II - Threat Actors & Attack Paths",
  "module3": "Module III - Encryption, PKI & Secure Cryptography",
  "module4": "Module IV - Identity, Authentication & Access",
  "module5": "Module V - Enterprise Network Defense Architecture",
  "module6": "Module VI - Cloud Security & Zero Trust",
  "module7": "Module VII - Resilience, Redundancy & Physical Protection",
  "module8": "Module VIII - Vulnerability Management & Remediation",
  "module9": "Module IX - Network Security Baselines & Hardening",
  "module10": "Module X - Endpoint Protection & Device Hardening",
  "module11": "Module XI - Application, Web & Email Security",
  "module12": "Module XII - Incident Response & Security Monitoring",
  "module13": "Module XIII - Indicators of Compromise & Malicious Activity",
  "module14": "Module XIV - Governance, Policy & Security Operations",
  "module15": "Module XV - Risk, Third Parties & Assessments",
  "module16": "Module XVI - Data Protection, Compliance & People"
};

window.QUIZ_BANK = [
  {
    "id": 1,
    "module": "module1",
    "question": "Which element of the CIA triad ensures data is readable only by authorized users?",
    "options": [
      "Availability",
      "Confidentiality",
      "Integrity",
      "Non-repudiation"
    ],
    "answer": 1,
    "explanation": "Confidentiality prevents unauthorized disclosure of information."
  },
  {
    "id": 2,
    "module": "module1",
    "question": "What does integrity mean in an information security context?",
    "options": [
      "Data is always online",
      "Data remains accurate and unaltered unless properly authorized",
      "Users can deny their actions",
      "Traffic is encrypted"
    ],
    "answer": 1,
    "explanation": "Integrity focuses on preventing unauthorized modification and preserving correctness."
  },
  {
    "id": 3,
    "module": "module1",
    "question": "Which NIST function focuses on identifying, analyzing, containing, and eradicating threats?",
    "options": [
      "Protect",
      "Identify",
      "Respond",
      "Recover"
    ],
    "answer": 2,
    "explanation": "Respond covers incident handling actions once malicious activity is identified."
  },
  {
    "id": 4,
    "module": "module1",
    "question": "A control implemented primarily through people and process, such as training, is which category?",
    "options": [
      "Technical",
      "Operational",
      "Managerial",
      "Physical"
    ],
    "answer": 1,
    "explanation": "Operational controls are carried out mainly by personnel."
  },
  {
    "id": 5,
    "module": "module1",
    "question": "Which control type is best represented by a backup used after ransomware damage?",
    "options": [
      "Preventive",
      "Directive",
      "Corrective",
      "Deterrent"
    ],
    "answer": 2,
    "explanation": "Backups restore systems after a damaging event, making them corrective."
  },
  {
    "id": 6,
    "module": "module1",
    "question": "What is the primary purpose of a gap analysis?",
    "options": [
      "To replace all existing controls",
      "To compare current security capabilities with a target framework or requirement",
      "To disable redundant services",
      "To generate phishing reports"
    ],
    "answer": 1,
    "explanation": "Gap analysis identifies what is missing or weak compared to the desired framework state."
  },
  {
    "id": 7,
    "module": "module2",
    "question": "Which threat actor is most likely to have nation-state funding and long-term strategic goals?",
    "options": [
      "Script kiddie",
      "Hacktivist",
      "Advanced persistent threat actor",
      "Help desk contractor"
    ],
    "answer": 2,
    "explanation": "Nation-state or state-backed groups are typically the most resourced and persistent actors."
  },
  {
    "id": 8,
    "module": "module2",
    "question": "What best describes a threat vector?",
    "options": [
      "A complete list of all assets",
      "The path or method used to carry out an attack",
      "A regulatory requirement",
      "A hash of a malicious file"
    ],
    "answer": 1,
    "explanation": "A threat vector is the route or method an attacker uses to compromise a target."
  },
  {
    "id": 9,
    "module": "module2",
    "question": "A user receives a text message urging immediate password verification through a link. This is:",
    "options": [
      "Typosquatting",
      "Smishing",
      "Vishing",
      "Shoulder surfing"
    ],
    "answer": 1,
    "explanation": "Smishing uses SMS text messages as the phishing medium."
  },
  {
    "id": 10,
    "module": "module2",
    "question": "Which example best represents an insider threat?",
    "options": [
      "A competitor brute-forcing a public portal",
      "A terminated employee using leftover VPN access",
      "A random internet scan against a web server",
      "A public malware campaign against multiple companies"
    ],
    "answer": 1,
    "explanation": "A former employee with residual access is an insider or insider-knowledge threat."
  },
  {
    "id": 11,
    "module": "module2",
    "question": "What is typosquatting?",
    "options": [
      "Leaving malicious USB drives in a parking lot",
      "Registering a domain name that closely resembles a legitimate one",
      "Intercepting a wireless handshake",
      "Replacing a certificate authority"
    ],
    "answer": 1,
    "explanation": "Typosquatting relies on lookalike domains to fool users."
  },
  {
    "id": 12,
    "module": "module2",
    "question": "Which social engineering approach uses a fabricated scenario to make a request seem believable?",
    "options": [
      "Sandboxing",
      "Tokenization",
      "Pretexting",
      "Salting"
    ],
    "answer": 2,
    "explanation": "Pretexting builds a story that persuades the target to comply."
  },
  {
    "id": 13,
    "module": "module3",
    "question": "Which cryptographic approach is fastest for bulk data encryption?",
    "options": [
      "Asymmetric encryption",
      "Hashing",
      "Symmetric encryption",
      "Digital signatures"
    ],
    "answer": 2,
    "explanation": "Symmetric algorithms are efficient for encrypting large volumes of data."
  },
  {
    "id": 14,
    "module": "module3",
    "question": "What is the main purpose of a cryptographic hash?",
    "options": [
      "Provide confidentiality",
      "Support integrity verification",
      "Exchange public keys",
      "Replace MFA"
    ],
    "answer": 1,
    "explanation": "Hashes are one-way digests used to confirm that data has not changed."
  },
  {
    "id": 15,
    "module": "module3",
    "question": "In public key cryptography, which key encrypts data intended only for Bob to read?",
    "options": [
      "Alice\u2019s private key",
      "Bob\u2019s public key",
      "Bob\u2019s private key",
      "A shared password"
    ],
    "answer": 1,
    "explanation": "Anyone can encrypt for Bob using Bob\u2019s public key, but only Bob\u2019s private key can decrypt."
  },
  {
    "id": 16,
    "module": "module3",
    "question": "What does a digital signature primarily provide?",
    "options": [
      "Only confidentiality",
      "Authentication and integrity",
      "Compression and obfuscation",
      "Port filtering"
    ],
    "answer": 1,
    "explanation": "Digital signatures help prove sender authenticity and message integrity."
  },
  {
    "id": 17,
    "module": "module3",
    "question": "What PKI component issues and validates digital certificates?",
    "options": [
      "RAID controller",
      "Certificate authority",
      "Hypervisor",
      "DHCP server"
    ],
    "answer": 1,
    "explanation": "Certificate authorities issue and validate certificates in a PKI."
  },
  {
    "id": 18,
    "module": "module3",
    "question": "Why is key management critical to cryptography?",
    "options": [
      "Because algorithms never matter",
      "Because cryptography fails if keys are weak, exposed, or mishandled",
      "Because it removes the need for certificates",
      "Because it replaces encryption"
    ],
    "answer": 1,
    "explanation": "Even strong algorithms fail when keys are guessed, stolen, or poorly protected."
  },
  {
    "id": 19,
    "module": "module4",
    "question": "Which factor type is represented by a password?",
    "options": [
      "Something you have",
      "Somewhere you are",
      "Something you know",
      "Something you are"
    ],
    "answer": 2,
    "explanation": "Passwords are knowledge factors."
  },
  {
    "id": 20,
    "module": "module4",
    "question": "What does authorization determine after authentication succeeds?",
    "options": [
      "Whether the password is strong",
      "What resources and actions the subject is allowed to use",
      "Whether a certificate is expired",
      "Which router owns the subnet"
    ],
    "answer": 1,
    "explanation": "Authorization enforces rights and permissions after identity is verified."
  },
  {
    "id": 21,
    "module": "module4",
    "question": "Which access model is based on job role or organizational function?",
    "options": [
      "DAC",
      "MAC",
      "RBAC",
      "PAM"
    ],
    "answer": 2,
    "explanation": "Role-based access control assigns permissions according to role."
  },
  {
    "id": 22,
    "module": "module4",
    "question": "What is a common purpose of a privileged access management solution?",
    "options": [
      "To replace endpoint logging",
      "To vault and rotate administrative credentials",
      "To manage printer toner",
      "To block all email attachments"
    ],
    "answer": 1,
    "explanation": "PAM tools manage, rotate, and audit privileged credentials."
  },
  {
    "id": 23,
    "module": "module4",
    "question": "Which protocol is closely associated with ticket-based enterprise single sign-on?",
    "options": [
      "SMTP",
      "Kerberos",
      "SNMP",
      "NTP"
    ],
    "answer": 1,
    "explanation": "Kerberos uses tickets and a KDC to support SSO in enterprise environments."
  },
  {
    "id": 24,
    "module": "module4",
    "question": "What should happen during offboarding to reduce identity risk?",
    "options": [
      "Increase access for managers",
      "Disable or remove access that is no longer needed",
      "Share passwords with team leads",
      "Convert all accounts to guest access"
    ],
    "answer": 1,
    "explanation": "Offboarding must remove access promptly to avoid stale or leftover privileges."
  },
  {
    "id": 25,
    "module": "module5",
    "question": "What is the main security benefit of network segmentation?",
    "options": [
      "It compresses traffic",
      "It limits lateral movement and simplifies control boundaries",
      "It disables routing",
      "It removes the need for logs"
    ],
    "answer": 1,
    "explanation": "Segmentation reduces the spread of compromise and improves access control."
  },
  {
    "id": 26,
    "module": "module5",
    "question": "A firewall that tracks established connections and session state is performing:",
    "options": [
      "Tokenization",
      "Stateful inspection",
      "Fuzzing",
      "Sandboxing"
    ],
    "answer": 1,
    "explanation": "Stateful inspection uses a state table to monitor session context."
  },
  {
    "id": 27,
    "module": "module5",
    "question": "Which security device is designed to inspect and filter HTTP/HTTPS application traffic?",
    "options": [
      "WAF",
      "KVM",
      "UPS",
      "Load balancer only"
    ],
    "answer": 0,
    "explanation": "A web application firewall focuses on protecting web application traffic."
  },
  {
    "id": 28,
    "module": "module5",
    "question": "Which protocol is the principal secure way to administer a remote command-line server?",
    "options": [
      "Telnet",
      "FTP",
      "SSH",
      "TFTP"
    ],
    "answer": 2,
    "explanation": "SSH protects terminal sessions and secure file transfer use cases."
  },
  {
    "id": 29,
    "module": "module5",
    "question": "Which IPsec mode is commonly used for site-to-site VPN tunnels across untrusted networks?",
    "options": [
      "Monitor mode",
      "Broadcast mode",
      "Tunnel mode",
      "Transparent mode"
    ],
    "answer": 2,
    "explanation": "Tunnel mode encapsulates the entire original packet for VPN use."
  },
  {
    "id": 30,
    "module": "module5",
    "question": "What is an air-gapped host?",
    "options": [
      "A host with dual NICs",
      "A host physically isolated from other networks",
      "A host that only uses Wi-Fi",
      "A host running a guest VM"
    ],
    "answer": 1,
    "explanation": "Air-gapped systems are intentionally disconnected from other networks."
  },
  {
    "id": 31,
    "module": "module6",
    "question": "Which cloud model uses provider-owned shared infrastructure offered over the Internet to many customers?",
    "options": [
      "Private cloud",
      "Public cloud",
      "Community cloud",
      "Air-gapped cloud"
    ],
    "answer": 1,
    "explanation": "Public cloud services are shared and Internet-accessible."
  },
  {
    "id": 32,
    "module": "module6",
    "question": "What does the shared responsibility model describe?",
    "options": [
      "How wireless keys are rotated",
      "How security duties are divided between the provider and the customer",
      "How backups are compressed",
      "How SIEM alerts are scored"
    ],
    "answer": 1,
    "explanation": "In cloud environments, some controls belong to the CSP and others to the customer."
  },
  {
    "id": 33,
    "module": "module6",
    "question": "Which concept is central to zero trust architecture?",
    "options": [
      "Implicit trust for internal devices",
      "Verify explicitly and limit access continuously",
      "Allow all east-west traffic",
      "Use one perimeter firewall as the primary control"
    ],
    "answer": 1,
    "explanation": "Zero trust requires explicit verification and least-privilege access decisions."
  },
  {
    "id": 34,
    "module": "module6",
    "question": "What does device posture describe in zero trust terms?",
    "options": [
      "The physical size of the laptop",
      "The security status and configuration health of the device",
      "The user\u2019s job title",
      "The wireless signal strength"
    ],
    "answer": 1,
    "explanation": "Device posture reflects whether the device meets security requirements."
  },
  {
    "id": 35,
    "module": "module6",
    "question": "Which technology allows network policies to be centrally defined and then enforced on managed devices?",
    "options": [
      "SDN",
      "NFC",
      "RAID",
      "LDAP"
    ],
    "answer": 0,
    "explanation": "Software-defined networking separates policy logic from forwarding implementation."
  },
  {
    "id": 36,
    "module": "module6",
    "question": "Why do IoT and embedded systems often create extra risk?",
    "options": [
      "They always support newest patches first",
      "They can be hard to patch, monitor, and replace",
      "They remove the need for segmentation",
      "They cannot connect to wireless"
    ],
    "answer": 1,
    "explanation": "Embedded and IoT systems often lag in patching and security visibility."
  },
  {
    "id": 37,
    "module": "module7",
    "question": "What is the main purpose of an asset inventory?",
    "options": [
      "To replace network authentication",
      "To identify and track systems and data that need protection",
      "To eliminate backups",
      "To disable unused software automatically"
    ],
    "answer": 1,
    "explanation": "Inventories help organizations know what exists, who owns it, and how critical it is."
  },
  {
    "id": 38,
    "module": "module7",
    "question": "Which measure most directly increases availability by allowing work to continue after one component fails?",
    "options": [
      "Redundancy",
      "Data masking",
      "Tokenization",
      "Obfuscation"
    ],
    "answer": 0,
    "explanation": "Redundancy provides alternate capacity or paths during failure."
  },
  {
    "id": 39,
    "module": "module7",
    "question": "Which control is primarily physical rather than technical?",
    "options": [
      "Application allowlisting",
      "Mantrap",
      "FDE",
      "SSO"
    ],
    "answer": 1,
    "explanation": "A mantrap is a physical access control mechanism."
  },
  {
    "id": 40,
    "module": "module7",
    "question": "Which planning activity focuses on restoring critical operations after a major disruption?",
    "options": [
      "BCP/DR planning",
      "Password spraying",
      "Container orchestration",
      "DMARC validation"
    ],
    "answer": 0,
    "explanation": "Business continuity and disaster recovery planning address large operational disruptions."
  },
  {
    "id": 41,
    "module": "module7",
    "question": "Why is utility protection part of site security?",
    "options": [
      "Because HVAC and power can affect system safety and availability",
      "Because utilities replace encryption",
      "Because it reduces phishing only",
      "Because it eliminates insider threats"
    ],
    "answer": 0,
    "explanation": "Power, cooling, and environmental controls are essential to resilient operations."
  },
  {
    "id": 42,
    "module": "module7",
    "question": "Which statement best distinguishes backups from redundancy?",
    "options": [
      "Backups prevent all outages",
      "Redundancy keeps service available during failure, while backups help restore after loss",
      "They are identical controls",
      "Backups only matter for mobile devices"
    ],
    "answer": 1,
    "explanation": "Redundancy supports continuity during failure; backups support later recovery."
  },
  {
    "id": 43,
    "module": "module8",
    "question": "What makes an end-of-life system especially risky?",
    "options": [
      "It uses too much RAM",
      "The vendor no longer supplies patches or updates",
      "It always has default credentials",
      "It cannot be inventoried"
    ],
    "answer": 1,
    "explanation": "Unsupported systems remain vulnerable because security fixes are no longer provided."
  },
  {
    "id": 44,
    "module": "module8",
    "question": "Which scanning method typically reveals deeper configuration detail on a target?",
    "options": [
      "Credentialed scanning",
      "Uncredentialed scanning",
      "Passive DNS only",
      "Broadcast sniffing"
    ],
    "answer": 0,
    "explanation": "Credentialed scans can inspect installed software, settings, and patch state more deeply."
  },
  {
    "id": 45,
    "module": "module8",
    "question": "What is a zero-day vulnerability?",
    "options": [
      "A flaw the vendor has already fully patched",
      "A flaw unknown to defenders before exploitation",
      "A misconfigured password policy only",
      "A retired certificate"
    ],
    "answer": 1,
    "explanation": "Zero-days are exploited before the vendor or defenders can respond with a fix."
  },
  {
    "id": 46,
    "module": "module8",
    "question": "Which source most helps prioritize vulnerabilities based on active threat context?",
    "options": [
      "Threat feeds",
      "Printer logs",
      "Wallpaper policies",
      "DHCP lease times"
    ],
    "answer": 0,
    "explanation": "Threat feeds add current intelligence that helps focus on the most relevant risks."
  },
  {
    "id": 47,
    "module": "module8",
    "question": "Using network isolation around a legacy system that cannot be patched is an example of:",
    "options": [
      "Compensating control",
      "Cryptographic key escrow",
      "Federation",
      "Hash collision"
    ],
    "answer": 0,
    "explanation": "Isolation can compensate when the preferred primary control is unavailable."
  },
  {
    "id": 48,
    "module": "module8",
    "question": "What should occur after a vulnerability fix is applied?",
    "options": [
      "Nothing else is needed",
      "Validation or retesting to confirm remediation",
      "Immediate password reuse",
      "Automatic incident closure without evidence"
    ],
    "answer": 1,
    "explanation": "Remediation should be verified to ensure the issue is really resolved."
  },
  {
    "id": 49,
    "module": "module9",
    "question": "Which wireless mode is best suited to authenticating users with a RADIUS server?",
    "options": [
      "Open mode",
      "Enterprise mode",
      "Personal PSK only",
      "Ad hoc mode"
    ],
    "answer": 1,
    "explanation": "Enterprise wireless commonly uses 802.1X with AAA infrastructure."
  },
  {
    "id": 50,
    "module": "module9",
    "question": "What does NAC primarily evaluate before allowing network access?",
    "options": [
      "Printer toner levels",
      "Device identity and security posture",
      "The user\u2019s desk location",
      "GPU temperature"
    ],
    "answer": 1,
    "explanation": "Network access control checks whether a user or device meets required conditions."
  },
  {
    "id": 51,
    "module": "module9",
    "question": "Which wireless protocol replaces WPA2-PSK with SAE in personal mode?",
    "options": [
      "WEP",
      "WPA",
      "WPA3",
      "TKIP"
    ],
    "answer": 2,
    "explanation": "WPA3 personal uses SAE to improve resistance to password attacks."
  },
  {
    "id": 52,
    "module": "module9",
    "question": "Why is a security baseline useful for network devices?",
    "options": [
      "It prevents all outages automatically",
      "It defines the minimum acceptable secure configuration",
      "It replaces threat hunting",
      "It removes the need for patching"
    ],
    "answer": 1,
    "explanation": "Baselines provide a repeatable secure standard to measure against."
  },
  {
    "id": 53,
    "module": "module9",
    "question": "Which control improves network visibility by summarizing suspicious patterns rather than just raw connectivity?",
    "options": [
      "IDS/IPS monitoring",
      "Longer Ethernet cables",
      "Screen cleaners",
      "Printer duplexing"
    ],
    "answer": 0,
    "explanation": "Detection and prevention tools add visibility into malicious or anomalous traffic patterns."
  },
  {
    "id": 54,
    "module": "module9",
    "question": "What is the main risk of configuration drift?",
    "options": [
      "It slowly weakens the intended secure state over time",
      "It increases battery life",
      "It guarantees duplicate logs",
      "It prevents segmentation"
    ],
    "answer": 0,
    "explanation": "Drift causes systems to move away from the approved baseline and increases exposure."
  },
  {
    "id": 55,
    "module": "module10",
    "question": "Which control most directly prevents unauthorized applications from executing on an endpoint?",
    "options": [
      "Application allowlisting",
      "Full-disk encryption",
      "DHCP snooping",
      "NetFlow export"
    ],
    "answer": 0,
    "explanation": "Allowlisting blocks software unless it is explicitly approved."
  },
  {
    "id": 56,
    "module": "module10",
    "question": "What is the main purpose of an endpoint detection and response tool?",
    "options": [
      "Host user interface theming",
      "Detection and investigation of endpoint threats with response capability",
      "Replacing certificates",
      "Managing RAID arrays"
    ],
    "answer": 1,
    "explanation": "EDR focuses on endpoint telemetry, detection, and response actions."
  },
  {
    "id": 57,
    "module": "module10",
    "question": "Which mobile security approach best separates business data on a personal device?",
    "options": [
      "Containerization",
      "Overclocking",
      "Port mirroring",
      "Screen timeout only"
    ],
    "answer": 0,
    "explanation": "Containerization isolates corporate data and management from personal content."
  },
  {
    "id": 58,
    "module": "module10",
    "question": "Why should rooted or jailbroken mobile devices be treated as higher risk?",
    "options": [
      "They always improve battery life",
      "They can bypass built-in security restrictions and management trust assumptions",
      "They cannot install apps",
      "They only connect over Bluetooth"
    ],
    "answer": 1,
    "explanation": "Rooting or jailbreaking weakens platform security controls and compliance assumptions."
  },
  {
    "id": 59,
    "module": "module10",
    "question": "Which capability helps an organization remove company data from a lost phone without wiping the user\u2019s personal content?",
    "options": [
      "Selective wipe",
      "RAID 10",
      "Sandbox escape",
      "ARP inspection"
    ],
    "answer": 0,
    "explanation": "Selective wipe targets managed organizational data while leaving personal content intact."
  },
  {
    "id": 60,
    "module": "module10",
    "question": "What principle supports endpoint hardening by reducing exposed features and services?",
    "options": [
      "Least functionality",
      "Maximum compatibility",
      "Full trust",
      "Default allow"
    ],
    "answer": 0,
    "explanation": "Least functionality removes unnecessary services and lowers attack surface."
  },
  {
    "id": 61,
    "module": "module11",
    "question": "What is the main purpose of DMARC?",
    "options": [
      "To encrypt all outbound email bodies",
      "To improve domain-based email authenticity and reduce spoofing",
      "To replace DNS entirely",
      "To force all users onto VPN"
    ],
    "answer": 1,
    "explanation": "DMARC helps receiving systems validate how to handle messages that fail SPF or DKIM checks."
  },
  {
    "id": 62,
    "module": "module11",
    "question": "Which device typically sits at the control point for inbound and outbound email filtering?",
    "options": [
      "Email gateway",
      "KVM switch",
      "Hypervisor",
      "RAID controller"
    ],
    "answer": 0,
    "explanation": "Email gateways inspect email for spam, malware, and impersonation indicators."
  },
  {
    "id": 63,
    "module": "module11",
    "question": "Which tool is most directly associated with protecting a web application from malicious HTTP requests?",
    "options": [
      "WAF",
      "NTP server",
      "UPS",
      "HSM"
    ],
    "answer": 0,
    "explanation": "A WAF inspects and filters web application traffic."
  },
  {
    "id": 64,
    "module": "module11",
    "question": "What does a CASB help organizations do?",
    "options": [
      "Manage physical cabling",
      "Apply policy and visibility to cloud service usage",
      "Replace SSO",
      "Tune BIOS fans"
    ],
    "answer": 1,
    "explanation": "Cloud access security brokers mediate and monitor cloud application access."
  },
  {
    "id": 65,
    "module": "module11",
    "question": "Why are cloud applications attractive attack targets?",
    "options": [
      "They cannot scale",
      "Misconfigurations and shared resources can expose large amounts of accessible data and services",
      "They do not use APIs",
      "They are invisible to users"
    ],
    "answer": 1,
    "explanation": "Cloud apps often combine high accessibility with misconfiguration risk."
  },
  {
    "id": 66,
    "module": "module11",
    "question": "Which secure protocol baseline is most appropriate for a public web login portal?",
    "options": [
      "Plain HTTP",
      "HTTPS with trusted certificate and strong settings",
      "Telnet",
      "SNMPv1"
    ],
    "answer": 1,
    "explanation": "Public login portals should use HTTPS with valid certificates and strong TLS settings."
  },
  {
    "id": 67,
    "module": "module12",
    "question": "Which incident response phase limits the scope and magnitude of an incident?",
    "options": [
      "Preparation",
      "Containment",
      "Recovery",
      "Lessons learned"
    ],
    "answer": 1,
    "explanation": "Containment focuses on limiting spread and impact."
  },
  {
    "id": 68,
    "module": "module12",
    "question": "What is the main purpose of digital forensics during incident handling?",
    "options": [
      "To increase GPU performance",
      "To collect and analyze evidence without destroying its integrity",
      "To compress backups",
      "To replace vulnerability scans"
    ],
    "answer": 1,
    "explanation": "Forensics preserves and analyzes evidence for understanding and, when needed, legal use."
  },
  {
    "id": 69,
    "module": "module12",
    "question": "Which data source is most likely to show detailed packet-level contents?",
    "options": [
      "Packet capture",
      "Asset tag list",
      "AUP document",
      "Rack diagram"
    ],
    "answer": 0,
    "explanation": "Packet captures provide detailed frame and protocol content for analysis."
  },
  {
    "id": 70,
    "module": "module12",
    "question": "What is a playbook in security operations?",
    "options": [
      "A data-driven step-by-step guide for handling a specific incident type",
      "A BIOS update package",
      "A printer calibration sheet",
      "A public vulnerability disclosure only"
    ],
    "answer": 0,
    "explanation": "Playbooks guide analysts through standardized response tasks."
  },
  {
    "id": 71,
    "module": "module12",
    "question": "Which platform type best correlates events from multiple security tools into one analysis view?",
    "options": [
      "SIEM",
      "MDM",
      "Hypervisor",
      "RAID"
    ],
    "answer": 0,
    "explanation": "A SIEM aggregates and correlates events from many sources."
  },
  {
    "id": 72,
    "module": "module12",
    "question": "Why is time synchronization important in monitoring and forensics?",
    "options": [
      "It improves battery charge",
      "It keeps events from different systems comparable in a reliable timeline",
      "It replaces chain of custody",
      "It blocks phishing"
    ],
    "answer": 1,
    "explanation": "Consistent timestamps are essential when reconstructing incident timelines."
  },
  {
    "id": 73,
    "module": "module13",
    "question": "Which symptom most strongly suggests malware rather than a simple performance issue?",
    "options": [
      "Unexpected disabling of antivirus or update services",
      "A user changed wallpaper",
      "A monitor brightness change",
      "A new keyboard layout"
    ],
    "answer": 0,
    "explanation": "Security tool failure or tampering is a common indicator of compromise."
  },
  {
    "id": 74,
    "module": "module13",
    "question": "What does repeated low-volume outbound traffic to the same destination often suggest?",
    "options": [
      "Beaconing to a command-and-control system",
      "A healthy battery cycle",
      "Printer maintenance",
      "Normal keyboard calibration"
    ],
    "answer": 0,
    "explanation": "Beaconing is a common post-compromise communication pattern."
  },
  {
    "id": 75,
    "module": "module13",
    "question": "Which sign could indicate a rogue device or physical intrusion?",
    "options": [
      "Unexpected network hardware connected in a secured area",
      "A normal logoff record",
      "A scheduled reboot",
      "A ticket closure note"
    ],
    "answer": 0,
    "explanation": "Unknown devices in protected areas can indicate tampering or unauthorized access."
  },
  {
    "id": 76,
    "module": "module13",
    "question": "Which application-layer clue might indicate an injection attack?",
    "options": [
      "Repeated malformed input followed by unusual query or error behavior",
      "A longer password policy",
      "A successful backup",
      "A monitor sleep timer"
    ],
    "answer": 0,
    "explanation": "Injection attempts often leave traces in app logs or error responses."
  },
  {
    "id": 77,
    "module": "module13",
    "question": "Why should multiple indicators be correlated before declaring compromise?",
    "options": [
      "Because any single clue may have a nonmalicious explanation",
      "Because logs are never useful",
      "Because malware never touches applications",
      "Because forensics replaces detection"
    ],
    "answer": 0,
    "explanation": "Correlation reduces false positives and helps build a stronger case for action."
  },
  {
    "id": 78,
    "module": "module13",
    "question": "A sudden spike in failed logins across many accounts with one password attempt each is most consistent with:",
    "options": [
      "Password spraying",
      "RAID rebuild",
      "Data deduplication",
      "Certificate pinning"
    ],
    "answer": 0,
    "explanation": "Password spraying uses a few passwords across many accounts to avoid lockouts."
  },
  {
    "id": 79,
    "module": "module14",
    "question": "Which document best states management intent and high-level security direction?",
    "options": [
      "Policy",
      "Procedure",
      "Playbook",
      "Asset inventory"
    ],
    "answer": 0,
    "explanation": "Policies define broad organizational intent and expectations."
  },
  {
    "id": 80,
    "module": "module14",
    "question": "What is the main purpose of change management?",
    "options": [
      "To prevent every future incident permanently",
      "To reduce risk and disruption when modifying production systems",
      "To replace backup testing",
      "To hide emergency fixes"
    ],
    "answer": 1,
    "explanation": "Change management aims to control implementation risk and maintain accountability."
  },
  {
    "id": 81,
    "module": "module14",
    "question": "Which term best describes using APIs and workflows to connect multiple security tools into one response process?",
    "options": [
      "Tokenization",
      "Orchestration",
      "Overclocking",
      "Mirroring"
    ],
    "answer": 1,
    "explanation": "Orchestration coordinates actions across multiple systems and tools."
  },
  {
    "id": 82,
    "module": "module14",
    "question": "Why is a rollback or backout plan important in change management?",
    "options": [
      "It guarantees no downtime ever",
      "It provides a path to restore service if the change causes problems",
      "It encrypts the ticket",
      "It replaces testing"
    ],
    "answer": 1,
    "explanation": "Backout planning reduces operational risk when changes fail."
  },
  {
    "id": 83,
    "module": "module14",
    "question": "Which document type gives detailed step-by-step instructions for completing a task?",
    "options": [
      "Procedure",
      "Standard",
      "Policy",
      "Guideline only"
    ],
    "answer": 0,
    "explanation": "Procedures describe the operational steps to follow."
  },
  {
    "id": 84,
    "module": "module14",
    "question": "What is a key risk of poor automation design?",
    "options": [
      "It can execute incorrect actions at scale",
      "It automatically fixes governance",
      "It eliminates the need for approvals",
      "It always improves visibility"
    ],
    "answer": 0,
    "explanation": "Automation amplifies both good and bad logic, so mistakes can spread quickly."
  },
  {
    "id": 85,
    "module": "module15",
    "question": "Which risk treatment option is represented by purchasing cyber insurance?",
    "options": [
      "Acceptance",
      "Avoidance",
      "Transference",
      "Mitigation only"
    ],
    "answer": 2,
    "explanation": "Insurance transfers some financial impact of risk to another party."
  },
  {
    "id": 86,
    "module": "module15",
    "question": "What remains after controls are applied but before risk is completely eliminated?",
    "options": [
      "Residual risk",
      "Zero-day risk only",
      "Supply voltage",
      "Hash entropy"
    ],
    "answer": 0,
    "explanation": "Residual risk is the risk that still exists after treatment."
  },
  {
    "id": 87,
    "module": "module15",
    "question": "Which activity best supports secure vendor onboarding?",
    "options": [
      "Due diligence and review of the provider\u2019s controls and obligations",
      "Disabling all logging",
      "Sharing admin passwords in advance",
      "Skipping contract language"
    ],
    "answer": 0,
    "explanation": "Due diligence helps verify whether the vendor can meet security and compliance needs."
  },
  {
    "id": 88,
    "module": "module15",
    "question": "What does an audit primarily evaluate?",
    "options": [
      "Whether required controls and processes exist and work as expected",
      "Whether GPU performance is stable",
      "Whether a user likes the interface",
      "Whether tickets are alphabetized"
    ],
    "answer": 0,
    "explanation": "Audits measure alignment to requirements, controls, and expected practice."
  },
  {
    "id": 89,
    "module": "module15",
    "question": "What is a risk register used for?",
    "options": [
      "Tracking identified risks, owners, status, and treatments",
      "Replacing a CMDB",
      "Storing private keys",
      "Issuing VLANs"
    ],
    "answer": 0,
    "explanation": "Risk registers maintain visibility of risks, ownership, and treatment progress."
  },
  {
    "id": 90,
    "module": "module15",
    "question": "Why are third-party service accounts a special concern?",
    "options": [
      "They often create trusted remote access paths into your environment",
      "They cannot use MFA",
      "They disable backups automatically",
      "They are only used on mobile devices"
    ],
    "answer": 0,
    "explanation": "Third-party access paths are a common source of supply-chain and remote access risk."
  },
  {
    "id": 91,
    "module": "module16",
    "question": "What is the main purpose of data classification?",
    "options": [
      "To randomize filenames",
      "To match controls and handling rules to the sensitivity of the data",
      "To replace encryption",
      "To eliminate retention policies"
    ],
    "answer": 1,
    "explanation": "Classification helps organizations apply appropriate protections based on data type and risk."
  },
  {
    "id": 92,
    "module": "module16",
    "question": "Which policy typically defines acceptable and prohibited use of company systems?",
    "options": [
      "AUP",
      "MOU",
      "RAID policy",
      "NetFlow baseline"
    ],
    "answer": 0,
    "explanation": "The acceptable use policy describes allowed and prohibited system use."
  },
  {
    "id": 93,
    "module": "module16",
    "question": "Which type of information is most associated with privacy obligations for individuals?",
    "options": [
      "PII",
      "Public marketing copy",
      "Generic uptime logs",
      "Patch notes"
    ],
    "answer": 0,
    "explanation": "Personally identifiable information carries direct privacy obligations."
  },
  {
    "id": 94,
    "module": "module16",
    "question": "What is the goal of security awareness training?",
    "options": [
      "To replace all technical controls",
      "To improve user behavior, recognition of threats, and reporting of suspicious activity",
      "To remove the need for policies",
      "To stop all phishing permanently"
    ],
    "answer": 1,
    "explanation": "Training helps users recognize, avoid, and report risky behavior and attacks."
  },
  {
    "id": 95,
    "module": "module16",
    "question": "Which practice most directly supports a clean desk policy?",
    "options": [
      "Leaving sensitive documents out overnight",
      "Removing or securing sensitive materials when not in use",
      "Sharing printed reports in public areas",
      "Posting passwords on monitors"
    ],
    "answer": 1,
    "explanation": "Clean desk policies reduce unauthorized access to exposed physical information."
  },
  {
    "id": 96,
    "module": "module16",
    "question": "Why is role-based training better than one-size-fits-all training?",
    "options": [
      "It aligns guidance to the actual responsibilities and risks of the audience",
      "It removes the need for executives to participate",
      "It only works for contractors",
      "It guarantees full compliance"
    ],
    "answer": 0,
    "explanation": "Different roles face different data handling, access, and reporting responsibilities."
  }
];
