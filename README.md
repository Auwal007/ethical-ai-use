
# ATBU Ethical AI Literacy System

*Empowering university students to navigate generative AI with critical thinking, academic integrity, and technological responsibility.*

</div>

## 📌 Project Overview
The **Ethical AI Literacy System** is a comprehensive, web-based educational platform designed for Abubakar Tafawa Balewa University (ATBU). It bridges the gap in structured AI ethics education by translating complex theoretical concepts into engaging, interactive learning experiences. 

Through scenario-based tasks, real-time feedback, and a gamified progression system, students learn to use Artificial Intelligence tools responsibly, critically, and ethically in their academic and professional careers.

---

## ✨ Key Features

🎓 **For Students:**
* **Interactive Learning Modules:** Structured, step-by-step flows combining theoretical learning with practical, scenario-based quizzes.
* **Gamified Dashboard:** Earn XP, maintain daily streaks, unlock achievement badges, and climb the competitive Leaderboard.
* **Dark/Light Mode:** A beautifully designed UI with persistent theme preferences and seamless glassmorphism aesthetics matching the ATBU green and gold color palette.
* **Responsive Design:** 100% mobile-friendly across all devices.

🛡️ **For Administrators:**
* **Data-Rich Analytics:** Visualizations of student progress, including module completion rates and average scores.
* **Progress Tracking:** Expandable student data tables allowing educators to drill down into individual performance and identify areas needing support.

---

## 📚 Core Curriculum

The platform currently features three core Senate-approved modules:

1. **Ethical Awareness (Foundational):** Understand the core principles of AI ethics, including data privacy, algorithmic bias, transparency, and the risks of AI hallucinations.
2. **Critical Evaluation (Interactive):** Learn to identify and mitigate AI-generated errors, spot fabricated "hallucinated" academic citations, and verify source material.
3. **AI for Social Good (Applied):** Navigate complex, scenario-based decision-making tasks regarding the ethical deployment of AI in university and professional environments.

---

## 🛠️ Technology Stack

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
* **Frontend:** React, TypeScript
* **Styling:** Tailwind CSS, custom CSS Variables for advanced theming
* **Icons:** [Lucide React](https://lucide.dev/)
* **Database:** SQLite (`better-sqlite3`) for robust, localized progress tracking and user management
* **Authentication:** Custom JWT/Cookie-based secure session management

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
* Node.js (v18.x or newer)
* npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Auwal007/ethical-ai-use.git
   cd ethical-ai-use
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
   *(Ensure any required API keys or secret tokens are filled out in `.env.local`)*

4. **Initialize the Database:**
   The SQLite database (`app.db`) will be created automatically upon the first API request. 

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```

6. **View the Application:**
   Open [http://localhost:3001](http://localhost:3001) in your browser. (Note: Port may vary depending on your local environment setup).

---

## 🔐 Default Roles

* **Student Account:** Sign up via the standard `/register` route to experience the student flow.
* **Admin Account:** To access the `/admin` portal, create a user and manually assign their role to `'admin'` within the SQLite database.

---

## 🏛️ Credits
Designed and developed for **Abubakar Tafawa Balewa University (ATBU)**, Bauchi, Nigeria.
*TETFund Backed • NUC Compliant • Open Educational Resource*
