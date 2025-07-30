# Barangay San Miguel - Maternal and Childcare Inventory System

A **web application** designed to improve **prenatal care** and **resource management** for the **Barangay San Miguel Health Center**. This centralized system allows healthcare workers and patients to manage maternal and child health records, monitor medical inventory, and streamline communication.

---

## 🚀 Features

- **🔐 Role-Based Access Control**
  - Secure login system with dashboards for:
    - Admin
    - BHW (Barangay Health Worker)
    - BNS (Barangay Nutrition Scholar)
    - User (Mother/Guardian)

- **👩‍⚕️ Patient Management**
  - Authorized users can **add**, **view**, and **update** patient health records.

- **📦 Inventory Monitoring**
  - Tracks stock levels of essential medical supplies like prenatal vitamins and vaccines.

- **📅 Appointment Scheduling**
  - Users (Mothers/Guardians) can book appointments with healthcare personnel.

- **📝 Secure Registration**
  - Public registration with **scrollable Terms & Conditions** (based on the **Data Privacy Act of 2012**).
  - Hidden `/registerVIP` route for admin to create internal (Admin, BHW, BNS) accounts.

---

## ⚙️ How the System Works

- **Frontend**: Built with **React** as a **Single Page Application (SPA)**.
- **Backend**: Powered by **Supabase** (PostgreSQL, Auth, API).
- **Routing**: Managed via `react-router-dom`.
- **Database Security**: **Row Level Security (RLS)** ensures users only access permitted data.
- **Styling**: Handled with **Tailwind CSS**.
- **Animation**: Smooth UI transitions using **Framer Motion**.

---

## 🛠️ Getting Started

### ✅ Prerequisites

- [Node.js & npm](https://nodejs.org/) (make sure they are installed)

---

### 📦 Step 1: Supabase Setup

1. Create an account and a project at [Supabase](https://supabase.com).
2. Go to your project's **SQL Editor**.
3. Copy the contents of `schema.sql` from this project and **run it** to create necessary tables (e.g., `profiles`, `patients`, etc.).
4. Go to **Project Settings > API** and **note down**:
   - Project URL
   - `anon` Public Key

---

### 💻 Step 2: React Application Setup

1. Clone this repository or download the ZIP.
2. Open your terminal and navigate to the project folder.
3. Install dependencies:
   ```bash
   npm install
````

4. Set up Supabase credentials:

   * Open `src/services/supabase.js`
   * Replace:

     ```js
     const supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
     ```

     with your **actual** Supabase project URL and anon key.

---

### ▶️ Step 3: Run the App

Start the development server:

```bash
npm start
```

* The app will launch at: [http://localhost:3000](http://localhost:3000)
* You’ll be greeted with the **Role Selection** screen.

---

## 📁 Tech Stack

* **Frontend**: React, Tailwind CSS, Framer Motion
* **Backend**: Supabase (PostgreSQL, Auth, Realtime)
* **Routing**: React Router
* **State/Data**: Supabase JS Client (`@supabase/supabase-js`)

---

## 🔐 Notes on Security

* **Terms and Conditions** are enforced before public registration.
* **Admin Registration** is restricted to a hidden route: `/registerVIP`.
* **RLS (Row Level Security)** in Supabase restricts data access based on user roles.

---

## 📬 Contact

For feedback or inquiries, feel free to contact the project maintainers or the development team behind the Barangay San Miguel Health Center System.

---

> Developed for the **Barangay San Miguel Health Center** – empowering local health services with digital transformation.

