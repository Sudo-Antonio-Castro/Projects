window.MODULE_LABELS = {
  "module1": "Module I: Ethical Hacking Essentials",
  "module2": "Module II: Penetration Testing Foundations",
  "module3": "Module III: Human Factors & Physical Access",
  "module4": "Module IV: Reconnaissance & Footprinting",
  "module5": "Module V: Scanning & Service Discovery",
  "module6": "Module VI: Enumeration & Target Profiling",
  "module7": "Module VII: Vulnerability Analysis & Prioritization",
  "module8": "Module VIII: System Compromise & Privilege Escalation",
  "module9": "Module IX: Malware Techniques & Countermeasures",
  "module10": "Module X: Sniffing, Hijacking & Denial of Service",
  "module11": "Module XI: IDS, Firewalls & Deception Systems",
  "module12": "Module XII: Web Servers, Web Apps & SQL Injection",
  "module13": "Module XIII: Wireless, Bluetooth & Mobile Security",
  "module14": "Module XIV: Cloud & IoT Attack Surface",
  "module15": "Module XV: Cryptography & Key Management"
};
window.QUIZ_BANK = [
  {
    "id": 1,
    "module": "module1",
    "question": "What makes a hacking activity ethical rather than criminal?",
    "options": [
      "Using advanced tools only",
      "Having written authorization to test the target",
      "Avoiding all network traffic",
      "Working anonymously"
    ],
    "answer": 1,
    "explanation": "Authorization is the defining line between ethical hacking and unauthorized intrusion."
  },
  {
    "id": 2,
    "module": "module1",
    "question": "Which sequence best reflects the common ethical hacking phases discussed in the course?",
    "options": [
      "Reconnaissance, scanning, gaining access, maintaining access, covering tracks",
      "Scanning, patching, recovery, reporting, encryption",
      "Enumeration, patching, governance, logging, forensics",
      "Privilege escalation, encryption, imaging, compliance, auditing"
    ],
    "answer": 0,
    "explanation": "The course frames ethical hacking as reconnaissance, scanning and enumeration, gaining access, maintaining access, and covering tracks."
  },
  {
    "id": 3,
    "module": "module1",
    "question": "Why is strong note-taking important during hands-on ethical hacking practice?",
    "options": [
      "It replaces the need for tool output",
      "It helps track commands, findings, and follow-up actions",
      "It guarantees exploitation success",
      "It avoids the need for reporting"
    ],
    "answer": 1,
    "explanation": "Good testers record what they did, what they observed, and what needs follow-up."
  },
  {
    "id": 4,
    "module": "module1",
    "question": "Which environment is commonly associated with ethical hacking labs and terminal-based tools?",
    "options": [
      "Kali Linux",
      "Windows PE only",
      "macOS Recovery",
      "UEFI Shell"
    ],
    "answer": 0,
    "explanation": "Kali Linux is a common environment for ethical hacking tools and command-line workflows."
  },
  {
    "id": 5,
    "module": "module1",
    "question": "What background knowledge does the course expect before deeper CEH study?",
    "options": [
      "Only web design and video editing",
      "Networking basics such as IP addressing, DNS, DHCP, and security fundamentals",
      "Mechanical engineering and PLC programming only",
      "No prior technical knowledge"
    ],
    "answer": 1,
    "explanation": "The course introduction expects familiarity with networking, IP addressing, DNS, DHCP, and basic security practices."
  },
  {
    "id": 6,
    "module": "module1",
    "question": "Which statement best describes CEH-style knowledge assessment in the source material?",
    "options": [
      "Only live labs count",
      "It uses multiple-choice questions regarding ethical hacking techniques and tools",
      "It is entirely essay based",
      "It avoids tool-related questions"
    ],
    "answer": 1,
    "explanation": "The course states CEH knowledge is assessed with multiple-choice questions about techniques and tools."
  },
  {
    "id": 7,
    "module": "module2",
    "question": "Penetration testing is best described as:",
    "options": [
      "Random exploitation for proof of skill",
      "The practice of finding vulnerabilities and risks to help secure systems",
      "Exclusive malware development",
      "Only blue-team log review"
    ],
    "answer": 1,
    "explanation": "Penetration testing is a structured practice of finding vulnerabilities and risks so systems can be secured."
  },
  {
    "id": 8,
    "module": "module2",
    "question": "Which testing approach best simulates an outside attacker with no prior environment knowledge?",
    "options": [
      "White box",
      "Gray box",
      "Black box",
      "Purple box"
    ],
    "answer": 2,
    "explanation": "Black-box testing gives the tester little or no target information and best simulates an external attacker."
  },
  {
    "id": 9,
    "module": "module2",
    "question": "What is the main distinguishing step in the penetration testing life cycle compared with the basic ethical hacking methodology?",
    "options": [
      "Banner grabbing",
      "Reporting",
      "Social engineering",
      "Privilege escalation"
    ],
    "answer": 1,
    "explanation": "The penetration testing life cycle emphasizes reporting as the key additional focus."
  },
  {
    "id": 10,
    "module": "module2",
    "question": "OWASP is especially useful when testing:",
    "options": [
      "Physical door controls",
      "Web applications and web services",
      "Printer toner levels",
      "Fiber installation paths"
    ],
    "answer": 1,
    "explanation": "OWASP focuses on common web application and web service security issues."
  },
  {
    "id": 11,
    "module": "module2",
    "question": "A tester given partial IP details and internal naming conventions is most likely performing which test type?",
    "options": [
      "Black box",
      "Gray box",
      "White box",
      "Blind DDoS"
    ],
    "answer": 1,
    "explanation": "Gray-box testing simulates an insider or partially informed attacker."
  },
  {
    "id": 12,
    "module": "module2",
    "question": "In common team terminology, the blue team is responsible for:",
    "options": [
      "Offensive exploitation",
      "Defensive security and closing vulnerabilities",
      "Only red-team reporting",
      "Building malware samples"
    ],
    "answer": 1,
    "explanation": "Blue teams focus on defense, response, and reducing security weaknesses."
  },
  {
    "id": 13,
    "module": "module3",
    "question": "Which trait is most commonly exploited in a social engineering attack?",
    "options": [
      "CPU clock speed",
      "Human trust and behavior",
      "RAID parity",
      "Screen refresh rate"
    ],
    "answer": 1,
    "explanation": "Social engineering succeeds by exploiting normal human reactions such as trust, urgency, fear, or curiosity."
  },
  {
    "id": 14,
    "module": "module3",
    "question": "A believable invented scenario used to manipulate a target is called:",
    "options": [
      "Tokenization",
      "Pretexting",
      "Hashing",
      "Sandboxing"
    ],
    "answer": 1,
    "explanation": "Pretexting uses a fabricated but plausible story to influence a victim."
  },
  {
    "id": 15,
    "module": "module3",
    "question": "Which control most directly reduces unauthorized people following employees through secured doors?",
    "options": [
      "Tailgating prevention and visitor controls",
      "SMTP hardening",
      "Port mirroring",
      "Cookie filtering"
    ],
    "answer": 0,
    "explanation": "Physical access control and visitor procedures directly address tailgating and related entry abuse."
  },
  {
    "id": 16,
    "module": "module3",
    "question": "Why are physical controls relevant to ethical hacking?",
    "options": [
      "They only affect facilities teams",
      "Physical access can lead to device compromise, rogue hardware placement, or data theft",
      "They remove the need for passwords",
      "They prevent all phishing"
    ],
    "answer": 1,
    "explanation": "Physical access often enables attacks such as theft, badge abuse, rogue device placement, or media compromise."
  },
  {
    "id": 17,
    "module": "module3",
    "question": "Which pair best represents a human-focused attack plus a fitting mitigation?",
    "options": [
      "Phishing and awareness training",
      "RAID failure and cable labeling",
      "SQL injection and desk locks",
      "ARP spoofing and elevator badges"
    ],
    "answer": 0,
    "explanation": "Awareness training is a standard defensive measure against phishing and other social engineering attacks."
  },
  {
    "id": 18,
    "module": "module3",
    "question": "If a scenario centers on exploiting curiosity, urgency, or authority, which topic is most relevant?",
    "options": [
      "Password salting",
      "Social engineering",
      "Elliptic curves",
      "Disk imaging"
    ],
    "answer": 1,
    "explanation": "Those are classic human levers used in social engineering attacks."
  },
  {
    "id": 19,
    "module": "module4",
    "question": "What is the main purpose of reconnaissance in an ethical hacking engagement?",
    "options": [
      "To erase logs",
      "To gather information about the target before direct exploitation",
      "To patch systems automatically",
      "To rotate encryption keys"
    ],
    "answer": 1,
    "explanation": "Reconnaissance builds the target profile before active exploitation begins."
  },
  {
    "id": 20,
    "module": "module4",
    "question": "Which tool set is most associated with network footprinting?",
    "options": [
      "Whois, nslookup, and ARIN",
      "John the Ripper, Hydra, and Hashcat",
      "Aircrack-ng, Reaver, and Kismet",
      "GPG, VeraCrypt, and OpenSSL"
    ],
    "answer": 0,
    "explanation": "Whois, nslookup, and ARIN are standard footprinting resources for early target research."
  },
  {
    "id": 21,
    "module": "module4",
    "question": "Which type of employee information is commonly gathered during reconnaissance?",
    "options": [
      "Phone numbers, emails, names, and addresses",
      "CPU temperatures and BIOS voltages",
      "Hypervisor snapshots only",
      "RAID rebuild times"
    ],
    "answer": 0,
    "explanation": "Reconnaissance often gathers contact and organizational details about employees."
  },
  {
    "id": 22,
    "module": "module4",
    "question": "Why can public documents be valuable to an attacker during reconnaissance?",
    "options": [
      "They often reveal metadata, names, and infrastructure clues",
      "They disable encryption automatically",
      "They hide service banners",
      "They remove domain ownership records"
    ],
    "answer": 0,
    "explanation": "Public files can leak names, software, authorship, and other metadata useful for later phases."
  },
  {
    "id": 23,
    "module": "module4",
    "question": "What is a good defensive goal during reconnaissance countermeasures?",
    "options": [
      "Expose more version details",
      "Minimize unnecessary public information and service disclosure",
      "Allow unrestricted directory browsing",
      "Increase default sample pages"
    ],
    "answer": 1,
    "explanation": "Reducing publicly exposed information makes early attacker profiling harder."
  },
  {
    "id": 24,
    "module": "module4",
    "question": "If the tester is collecting geographic details, routines, and entry-control observations, they are gathering which kind of recon data?",
    "options": [
      "Cryptographic data",
      "Physical and operational information",
      "Only DNS information",
      "Only source code"
    ],
    "answer": 1,
    "explanation": "Physical and operational reconnaissance includes locations, routines, and entry controls."
  },
  {
    "id": 25,
    "module": "module5",
    "question": "Scanning is best described as:",
    "options": [
      "A passive-only legal review",
      "Active probing to identify hosts, ports, and services",
      "Automatic malware removal",
      "Only password rotation"
    ],
    "answer": 1,
    "explanation": "Scanning actively probes systems to discover reachable hosts, ports, and service details."
  },
  {
    "id": 26,
    "module": "module5",
    "question": "Which tool is most strongly associated with general network and port scanning in the course?",
    "options": [
      "Nmap",
      "Tripwire",
      "GPG",
      "Snort only"
    ],
    "answer": 0,
    "explanation": "Nmap is a standard tool for host discovery, port scanning, and service identification."
  },
  {
    "id": 27,
    "module": "module5",
    "question": "Banner grabbing helps a tester learn:",
    "options": [
      "Battery voltage",
      "Service versions and product details",
      "Door badge status",
      "Cooling fan speed"
    ],
    "answer": 1,
    "explanation": "Banners can reveal service names, versions, and other details useful for prioritizing follow-up work."
  },
  {
    "id": 28,
    "module": "module5",
    "question": "If a service reveals too much version information in its banner, the main risk is that it:",
    "options": [
      "Improves wireless coverage",
      "Helps map the service to known vulnerabilities",
      "Disables packet capture",
      "Encrypts too strongly"
    ],
    "answer": 1,
    "explanation": "Verbose version disclosure can help attackers match the service to public vulnerability data."
  },
  {
    "id": 29,
    "module": "module5",
    "question": "Which phase is Heather in if she identifies that a workstation has TCP 445 open?",
    "options": [
      "Reconnaissance",
      "Scanning and enumeration",
      "Maintain access",
      "Cover tracks"
    ],
    "answer": 1,
    "explanation": "Identifying open ports is a hallmark of the scanning and enumeration phase."
  },
  {
    "id": 30,
    "module": "module5",
    "question": "A scan plan should consider timing and stealth because:",
    "options": [
      "Scans can affect detectability, performance, and results",
      "It changes the CPU architecture",
      "It guarantees wireless decryption",
      "It creates PKI certificates"
    ],
    "answer": 0,
    "explanation": "Scan timing and style can influence noise, accuracy, and operational impact."
  },
  {
    "id": 31,
    "module": "module6",
    "question": "Enumeration differs from basic scanning because it focuses on:",
    "options": [
      "Collecting detailed names, shares, users, and service information",
      "Only finding if a host replies to ping",
      "Creating encrypted tunnels",
      "Physically tailgating employees"
    ],
    "answer": 0,
    "explanation": "Enumeration turns service exposure into detailed intelligence such as usernames, shares, and system names."
  },
  {
    "id": 32,
    "module": "module6",
    "question": "Which item is a classic example of excessive information disclosure through enumeration?",
    "options": [
      "DNS zone transfer",
      "Screen brightness",
      "Battery calibration",
      "Keyboard layout"
    ],
    "answer": 0,
    "explanation": "Improperly allowed DNS zone transfers can reveal large amounts of useful infrastructure information."
  },
  {
    "id": 33,
    "module": "module6",
    "question": "Why is enumeration valuable after scanning?",
    "options": [
      "It confirms weather conditions",
      "It converts raw connectivity into targetable intelligence",
      "It prevents all exploitation",
      "It replaces reporting"
    ],
    "answer": 1,
    "explanation": "Enumeration extracts practical data from reachable services after they are discovered."
  },
  {
    "id": 34,
    "module": "module6",
    "question": "Which defensive action best reduces unauthenticated DNS information leakage?",
    "options": [
      "Enable zone transfers for everyone",
      "Restrict zone transfers",
      "Add more open recursive resolvers",
      "Publish internal hostnames publicly"
    ],
    "answer": 1,
    "explanation": "Restricting zone transfers helps prevent unnecessary disclosure of DNS data."
  },
  {
    "id": 35,
    "module": "module6",
    "question": "If a tool reveals computer names, shares, and services from a Windows host, the activity is most likely:",
    "options": [
      "PKI enrollment",
      "Enumeration",
      "Disk imaging",
      "Cloud bursting"
    ],
    "answer": 1,
    "explanation": "Those details fit the goal of enumeration."
  },
  {
    "id": 36,
    "module": "module6",
    "question": "What is the best summary of enumeration countermeasures?",
    "options": [
      "Reduce useful service disclosures and enforce secure defaults",
      "Increase all guest permissions",
      "Mirror every website",
      "Disable every firewall"
    ],
    "answer": 0,
    "explanation": "Enumeration defenses aim to reduce the quantity and value of exposed information."
  },
  {
    "id": 37,
    "module": "module7",
    "question": "What is the goal of a vulnerability assessment?",
    "options": [
      "To establish long-term unauthorized access",
      "To identify weaknesses that could be exploited",
      "To jam wireless signals",
      "To clear audit logs"
    ],
    "answer": 1,
    "explanation": "Vulnerability assessment finds weaknesses so they can be prioritized and remediated."
  },
  {
    "id": 38,
    "module": "module7",
    "question": "Which tool is commonly associated with vulnerability scanning in the course?",
    "options": [
      "Nessus",
      "Maltego only",
      "OpenStego",
      "CCleaner"
    ],
    "answer": 0,
    "explanation": "Nessus appears as a common vulnerability-assessment tool in the course material."
  },
  {
    "id": 39,
    "module": "module7",
    "question": "Why is validation important after a vulnerability scan?",
    "options": [
      "Because every scanner result is automatically critical",
      "Because findings vary in accuracy and urgency",
      "Because validation replaces patching",
      "Because it hides the evidence"
    ],
    "answer": 1,
    "explanation": "Not every finding has the same impact or confidence level, so validation matters."
  },
  {
    "id": 40,
    "module": "module7",
    "question": "Which sequence best matches a vulnerability management life cycle?",
    "options": [
      "Discovery, assessment, prioritization, remediation, verification",
      "Imaging, arrest, prosecution, sentencing, archive",
      "Enumeration, tailgating, phishing, exfiltration, cleanup",
      "Banner grabbing, defrag, DNS, reboot, formatting"
    ],
    "answer": 0,
    "explanation": "A proper lifecycle covers discovery through remediation and follow-up verification."
  },
  {
    "id": 41,
    "module": "module7",
    "question": "When deciding what to fix first, the strongest factor is usually:",
    "options": [
      "Only asset color",
      "Combined severity, exploitability, and business impact",
      "Number of employees in the break room",
      "Length of the hostname"
    ],
    "answer": 1,
    "explanation": "Prioritization should combine technical severity with real business exposure."
  },
  {
    "id": 42,
    "module": "module7",
    "question": "A scanner that reports weak settings on a domain controller is providing which type of value?",
    "options": [
      "Entertainment value",
      "Assessment visibility into exploitable weaknesses",
      "Only physical access logs",
      "Cryptographic key escrow"
    ],
    "answer": 1,
    "explanation": "The purpose is to expose weaknesses that need review and remediation."
  },
  {
    "id": 43,
    "module": "module8",
    "question": "Which tool is commonly used for offline password cracking against captured hashes?",
    "options": [
      "John the Ripper",
      "Traceroute",
      "Whois",
      "Pentbox"
    ],
    "answer": 0,
    "explanation": "John the Ripper is a classic password-cracking tool used in ethical hacking labs and scenarios."
  },
  {
    "id": 44,
    "module": "module8",
    "question": "What is the main objective of privilege escalation?",
    "options": [
      "Reduce a user's access",
      "Gain higher permissions than originally obtained",
      "Encrypt every log file",
      "Disable all network cards"
    ],
    "answer": 1,
    "explanation": "Privilege escalation aims to move from limited access to more powerful control."
  },
  {
    "id": 45,
    "module": "module8",
    "question": "Which term best describes a hidden access path installed to preserve future unauthorized entry?",
    "options": [
      "Checksum",
      "Backdoor",
      "Whitelist",
      "Patch baseline"
    ],
    "answer": 1,
    "explanation": "Backdoors are commonly used to maintain access after compromise."
  },
  {
    "id": 46,
    "module": "module8",
    "question": "Why does physical access significantly change host compromise possibilities?",
    "options": [
      "It can enable credential reset or offline access attacks",
      "It disables every BIOS",
      "It permanently blocks malware",
      "It forces certificate renewal"
    ],
    "answer": 0,
    "explanation": "Physical access can allow offline attacks, password resets, or boot-based compromise methods."
  },
  {
    "id": 47,
    "module": "module8",
    "question": "If an attacker removes evidence by clearing event logs, they are primarily trying to:",
    "options": [
      "Improve throughput",
      "Cover their tracks",
      "Increase CPU cache",
      "Repair the service"
    ],
    "answer": 1,
    "explanation": "Clearing logs is a classic tactic for hiding evidence of compromise."
  },
  {
    "id": 48,
    "module": "module8",
    "question": "Which statement best reflects persistence after initial access?",
    "options": [
      "Access ends immediately after login",
      "The attacker creates a way to return without repeating the entire initial attack",
      "Persistence only exists in printers",
      "It refers to encrypting all documents"
    ],
    "answer": 1,
    "explanation": "Persistence keeps access available for future use, often through backdoors or other footholds."
  },
  {
    "id": 49,
    "module": "module9",
    "question": "A Trojan horse is best described as malware that:",
    "options": [
      "Spreads only through worms",
      "Appears legitimate while hiding malicious functionality",
      "Only encrypts backups",
      "Cannot provide remote access"
    ],
    "answer": 1,
    "explanation": "A Trojan hides malicious behavior inside something that looks legitimate."
  },
  {
    "id": 50,
    "module": "module9",
    "question": "Which host utility is useful for checking suspicious open connections and listening ports?",
    "options": [
      "TCPView",
      "WordPad",
      "Notepad",
      "Whoami"
    ],
    "answer": 0,
    "explanation": "TCPView helps inspect open ports and active connections on a Windows system."
  },
  {
    "id": 51,
    "module": "module9",
    "question": "What distinguishes a worm from many other malware types?",
    "options": [
      "It always requires manual file opening",
      "It can self-propagate across systems",
      "It only affects smartphones",
      "It cannot use a network"
    ],
    "answer": 1,
    "explanation": "Worms are known for self-propagation without the same user action required by many other threats."
  },
  {
    "id": 52,
    "module": "module9",
    "question": "Why is malware analysis valuable to defenders?",
    "options": [
      "It identifies behavior, indicators, and likely impact",
      "It permanently immunizes every host",
      "It replaces backups",
      "It disables monitoring"
    ],
    "answer": 0,
    "explanation": "Analysis helps defenders understand what the malware does and what evidence or cleanup steps to pursue."
  },
  {
    "id": 53,
    "module": "module9",
    "question": "Which defensive measure best fits broad endpoint malware prevention?",
    "options": [
      "Anti-malware software and host monitoring",
      "Anonymous FTP",
      "Open guest shares",
      "Disabling updates"
    ],
    "answer": 0,
    "explanation": "Anti-malware software and host monitoring are core endpoint controls against malware."
  },
  {
    "id": 54,
    "module": "module9",
    "question": "If a machine shows unusual outbound connections on unexpected ports, which concern is most reasonable?",
    "options": [
      "Possible malware or backdoor activity",
      "Improved PKI trust",
      "Safe mode optimization",
      "Healthy battery charging"
    ],
    "answer": 0,
    "explanation": "Unexpected network connections are often a sign of malware, a backdoor, or other compromise behavior."
  },
  {
    "id": 55,
    "module": "module10",
    "question": "Which mode allows a network interface to pass all observed traffic to the CPU instead of only intended frames?",
    "options": [
      "Promiscuous mode",
      "Safe mode",
      "Bridge assurance",
      "Half duplex"
    ],
    "answer": 0,
    "explanation": "Promiscuous mode is associated with sniffing and broad packet visibility."
  },
  {
    "id": 56,
    "module": "module10",
    "question": "What is the goal of session hijacking?",
    "options": [
      "Delete all browser history",
      "Take over a valid user session",
      "Reduce wireless range",
      "Patch a web server"
    ],
    "answer": 1,
    "explanation": "Session hijacking targets valid session state such as cookies or IDs to impersonate a user."
  },
  {
    "id": 57,
    "module": "module10",
    "question": "A SYN flood primarily targets which security objective?",
    "options": [
      "Integrity",
      "Availability",
      "Confidentiality",
      "Non-repudiation"
    ],
    "answer": 1,
    "explanation": "A SYN flood is a denial-of-service technique intended to disrupt availability."
  },
  {
    "id": 58,
    "module": "module10",
    "question": "Which tool is strongly associated with packet analysis in many sniffing scenarios?",
    "options": [
      "Wireshark",
      "L0phtCrack",
      "Airbase-ng",
      "Tripwire"
    ],
    "answer": 0,
    "explanation": "Wireshark is a common packet-analysis tool for sniffing and network inspection."
  },
  {
    "id": 59,
    "module": "module10",
    "question": "Why can ARP poisoning support man-in-the-middle attacks?",
    "options": [
      "It rewrites certificates automatically",
      "It misdirects local traffic through the attacker",
      "It patches routers",
      "It randomizes SQL queries"
    ],
    "answer": 1,
    "explanation": "ARP poisoning can redirect traffic on a local network so the attacker can observe or alter it."
  },
  {
    "id": 60,
    "module": "module10",
    "question": "What is the difference between DoS and DDoS?",
    "options": [
      "DDoS is always passive",
      "DDoS distributes the attack across multiple systems",
      "DoS always uses SQL",
      "There is no difference"
    ],
    "answer": 1,
    "explanation": "Distributed denial of service uses multiple systems to generate the attack traffic."
  },
  {
    "id": 61,
    "module": "module11",
    "question": "What is the primary job of an intrusion detection system?",
    "options": [
      "Issue payroll checks",
      "Monitor for suspicious or policy-violating activity",
      "Perform disk encryption automatically",
      "Replace DNS"
    ],
    "answer": 1,
    "explanation": "An IDS observes traffic or host activity to identify suspicious behavior."
  },
  {
    "id": 62,
    "module": "module11",
    "question": "What best describes a honeypot?",
    "options": [
      "A guaranteed exploit kit",
      "A decoy system used to observe or attract malicious activity",
      "A password manager",
      "A backup rotation method"
    ],
    "answer": 1,
    "explanation": "Honeypots are controlled decoy systems used to study or detect malicious behavior."
  },
  {
    "id": 63,
    "module": "module11",
    "question": "A perimeter firewall is primarily used to:",
    "options": [
      "Monitor printer toner",
      "Control traffic crossing trust boundaries",
      "Defragment disks",
      "Rotate application logs"
    ],
    "answer": 1,
    "explanation": "Firewalls are used to enforce traffic rules between network segments or boundaries."
  },
  {
    "id": 64,
    "module": "module11",
    "question": "Why should a honeypot be isolated carefully?",
    "options": [
      "To improve fan speed",
      "To keep a decoy from becoming a real pivot point into production systems",
      "To block printing",
      "To avoid all logging"
    ],
    "answer": 1,
    "explanation": "A poorly isolated honeypot could be abused as a stepping stone into real assets."
  },
  {
    "id": 65,
    "module": "module11",
    "question": "If a system that should have no legitimate users suddenly receives connection attempts, which technology is especially useful for learning from that traffic?",
    "options": [
      "A honeypot",
      "A screen saver",
      "A spreadsheet macro",
      "A BIOS update"
    ],
    "answer": 0,
    "explanation": "Unexpected interaction with a decoy system is precisely what makes honeypots useful."
  },
  {
    "id": 66,
    "module": "module11",
    "question": "What common attacker objective appears in both IDS and firewall evasion topics?",
    "options": [
      "Avoiding detection or filtering while continuing the attack",
      "Improving certificate trust",
      "Repairing databases",
      "Lowering memory usage"
    ],
    "answer": 0,
    "explanation": "Evasion aims to keep malicious activity effective while reducing the chance of detection or blocking."
  },
  {
    "id": 67,
    "module": "module12",
    "question": "Why are web servers especially attractive targets?",
    "options": [
      "They are usually offline",
      "They are public-facing and often handle sensitive data",
      "They cannot run software",
      "They remove the need for authentication"
    ],
    "answer": 1,
    "explanation": "Web servers are accessible by design and often process high-value information."
  },
  {
    "id": 68,
    "module": "module12",
    "question": "Which issue most directly creates SQL injection risk?",
    "options": [
      "Strong parameterized queries",
      "Unsafe handling of untrusted input in database queries",
      "Too many backups",
      "A locked server room"
    ],
    "answer": 1,
    "explanation": "SQL injection occurs when untrusted input alters query logic."
  },
  {
    "id": 69,
    "module": "module12",
    "question": "What is one major risk of poor session management in web applications?",
    "options": [
      "Increased battery health",
      "Session takeover through weak or lingering session IDs",
      "Faster cryptography",
      "Lower bandwidth usage"
    ],
    "answer": 1,
    "explanation": "Weak session handling can make it easier for attackers to capture or reuse valid sessions."
  },
  {
    "id": 70,
    "module": "module12",
    "question": "Why might an attacker mirror a website during assessment?",
    "options": [
      "To increase cooling",
      "To duplicate structure and source for offline analysis",
      "To repair the server",
      "To change ARP tables"
    ],
    "answer": 1,
    "explanation": "Mirroring lets the tester study the site's structure and content more carefully."
  },
  {
    "id": 71,
    "module": "module12",
    "question": "Which control most directly reduces SQL injection risk?",
    "options": [
      "Default credentials",
      "Parameterized queries and strong input validation",
      "Public directory listing",
      "Verbose stack traces"
    ],
    "answer": 1,
    "explanation": "Keeping user input separate from SQL command structure is a key SQL injection defense."
  },
  {
    "id": 72,
    "module": "module12",
    "question": "Cookies matter in web security because they:",
    "options": [
      "Are only decorative",
      "Can store session or state information that attackers may try to abuse",
      "Replace certificates",
      "Only affect printers"
    ],
    "answer": 1,
    "explanation": "Cookies often carry session or state data, making them relevant in web attacks and defenses."
  },
  {
    "id": 73,
    "module": "module13",
    "question": "Which tool family is closely associated with cracking Wi-Fi handshakes and wireless encryption in labs?",
    "options": [
      "Aircrack-ng",
      "John the Ripper only",
      "Tripwire",
      "HTTrack"
    ],
    "answer": 0,
    "explanation": "Aircrack-ng is widely associated with Wi-Fi analysis and encryption-cracking workflows."
  },
  {
    "id": 74,
    "module": "module13",
    "question": "What is a rogue access point?",
    "options": [
      "A legitimate backup battery",
      "An unauthorized wireless access device on the network",
      "A DNS server role",
      "A certificate authority"
    ],
    "answer": 1,
    "explanation": "A rogue AP is an unauthorized wireless device that can create risk or intercept traffic."
  },
  {
    "id": 75,
    "module": "module13",
    "question": "Which Bluetooth attack uses the OBEX protocol to gain access to device data?",
    "options": [
      "Bluesnarfing",
      "Bluejacking",
      "BlueSmacking",
      "Wardriving"
    ],
    "answer": 0,
    "explanation": "Bluesnarfing is associated with unauthorized Bluetooth data access using OBEX."
  },
  {
    "id": 76,
    "module": "module13",
    "question": "What is one major benefit of mobile device management (MDM)?",
    "options": [
      "It replaces wireless hardware",
      "It enforces policy and visibility across many mobile devices",
      "It removes all malware instantly",
      "It turns Bluetooth off permanently"
    ],
    "answer": 1,
    "explanation": "MDM supports centralized mobile policy enforcement, configuration, and visibility."
  },
  {
    "id": 77,
    "module": "module13",
    "question": "Why is wireless predictive planning useful before deployment?",
    "options": [
      "It guarantees no users",
      "It helps place access points securely and effectively",
      "It encrypts SQL queries",
      "It disables Bluetooth"
    ],
    "answer": 1,
    "explanation": "Predictive planning tools help determine effective and secure access point placement."
  },
  {
    "id": 78,
    "module": "module13",
    "question": "If the problem involves discovering a hidden SSID or rogue wireless infrastructure, which topic is most relevant?",
    "options": [
      "Wireless security assessment",
      "Disk forensics",
      "PKI enrollment",
      "Log rotation"
    ],
    "answer": 0,
    "explanation": "Hidden-network discovery and rogue infrastructure are core wireless-assessment concerns."
  },
  {
    "id": 79,
    "module": "module14",
    "question": "What does shared responsibility mean in cloud security?",
    "options": [
      "Only the customer secures everything",
      "Security duties are divided between provider and customer depending on service model",
      "No one manages identity",
      "Clouds are inherently insecure"
    ],
    "answer": 1,
    "explanation": "Cloud security responsibilities vary by service model and are shared between customer and provider."
  },
  {
    "id": 80,
    "module": "module14",
    "question": "Which issue is a common source of cloud security incidents?",
    "options": [
      "Perfect segmentation everywhere",
      "Weak configuration and identity misuse",
      "Too many paper manuals",
      "Low-resolution monitors"
    ],
    "answer": 1,
    "explanation": "Many cloud incidents still stem from misconfiguration and poor identity control."
  },
  {
    "id": 81,
    "module": "module14",
    "question": "Why are IoT devices often difficult to secure?",
    "options": [
      "They always support full EDR",
      "They are numerous, varied, and often hard to patch or inventory",
      "They cannot connect to networks",
      "They never use default settings"
    ],
    "answer": 1,
    "explanation": "IoT security is difficult because devices are numerous, heterogeneous, and often poorly maintained."
  },
  {
    "id": 82,
    "module": "module14",
    "question": "Which public-facing discovery platform is commonly associated with finding exposed IoT devices?",
    "options": [
      "Shodan",
      "VeraCrypt",
      "CCleaner",
      "Retina"
    ],
    "answer": 0,
    "explanation": "Shodan is widely used to search for exposed internet-connected devices and services."
  },
  {
    "id": 83,
    "module": "module14",
    "question": "What is a strong defensive step for IoT environments?",
    "options": [
      "Leave all devices on flat networks",
      "Inventory and segment devices while keeping them updated",
      "Disable all logging",
      "Use public default passwords"
    ],
    "answer": 1,
    "explanation": "Inventory, segmentation, and updates are key IoT defensive practices."
  },
  {
    "id": 84,
    "module": "module14",
    "question": "If a question focuses on who secures identity and data in a cloud service model, the core concept is:",
    "options": [
      "Shared responsibility",
      "Rogue DHCP",
      "Steganography",
      "Bluejacking"
    ],
    "answer": 0,
    "explanation": "The shared responsibility model explains who secures which parts of a cloud deployment."
  },
  {
    "id": 85,
    "module": "module15",
    "question": "Which cryptographic goal is most directly provided by hashing?",
    "options": [
      "Availability",
      "Integrity",
      "Physical security",
      "Packet routing"
    ],
    "answer": 1,
    "explanation": "Hashes are primarily used to verify integrity."
  },
  {
    "id": 86,
    "module": "module15",
    "question": "Why is asymmetric cryptography useful?",
    "options": [
      "It provides key exchange and digital signature capabilities",
      "It is only for video streaming",
      "It avoids all certificates",
      "It eliminates passwords automatically"
    ],
    "answer": 0,
    "explanation": "Asymmetric cryptography supports functions such as key exchange and digital signatures."
  },
  {
    "id": 87,
    "module": "module15",
    "question": "What is the main role of PKI?",
    "options": [
      "Managing printer queues",
      "Supporting certificate-based trust and key management",
      "Cooling data centers",
      "Hiding MAC addresses"
    ],
    "answer": 1,
    "explanation": "Public key infrastructure manages certificate trust relationships and associated lifecycle processes."
  },
  {
    "id": 88,
    "module": "module15",
    "question": "Which tool family is associated with encrypted file or message protection in the course content?",
    "options": [
      "PGP and GPG",
      "Zenmap and Nmap",
      "NetBIOS and SMB",
      "SMAC and Ettercap"
    ],
    "answer": 0,
    "explanation": "PGP and GPG are associated with file and message encryption implementations."
  },
  {
    "id": 89,
    "module": "module15",
    "question": "Why can strong algorithms still fail in practice?",
    "options": [
      "Because keyboards are loud",
      "Weak key handling, trust failures, or poor implementation can undermine them",
      "Because HTTPS is illegal",
      "Because hashes replace encryption"
    ],
    "answer": 1,
    "explanation": "Real-world crypto failure often comes from implementation, trust, or key-management weaknesses rather than the algorithm alone."
  },
  {
    "id": 90,
    "module": "module15",
    "question": "If the task is to verify that a file has not been altered, which approach fits best?",
    "options": [
      "Compute and compare a hash value",
      "Open more firewall ports",
      "Change the hostname",
      "Mirror the website"
    ],
    "answer": 0,
    "explanation": "Hash comparison is a standard way to verify file integrity."
  }
];
