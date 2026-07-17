# Projects

A collection of interactive IT learning resources, command-line practice labs, certification study materials, technical reference articles, and utility application projects. The site uses concise landing pages, shared navigation, and self-contained learning resources published through GitHub Pages.

## Live Site

[Open the Projects website](https://sudo-antonio-castro.github.io/Projects/)

## Repository Sections

* **`Apps/` — Application Projects**
  Utility applications, scripts, and support tools, including Active Directory user tools, printer tools, remote-support tools, and packaged executables.

* **`CLIs/` — Command-Line Labs**
  Interactive command-line practice environments for Linux, Windows PowerShell, and the macOS Terminal.

* **`CompTIA/` — Certification Study Resources**
  Study guides, topic modules, quizzes, midterms, and final exams for CompTIA A+, Linux+, and Security+.

* **`EC-Council/` — CEH Study Resources**
  Complete Certified Ethical Hacker material in `EC-Council/CEH/`, including 15 study modules, module quizzes, a midterm, and a final exam.

* **`IT-Knowledge-Base-Articles/` — Technical Reference Library**
  Step-by-step articles and notes covering IT tools and workflows, including Ollama installation and Wifite usage on Kali Linux.


## Learning Roadmap design system

All `index.html` pages use the shared Option 3 Learning Roadmap theme in `assets/roadmap-theme.css` and `assets/roadmap-theme.js`. New index pages should link those two files using the correct relative path and add `class="roadmap-theme"` to the `<body>`. Hub pages also use `rm-hub`; lesson/article pages use `rm-lesson`; quizzes use `rm-quiz`; and CLI labs use `rm-cli`. Landing pages intentionally keep introductions and navigation brief.
