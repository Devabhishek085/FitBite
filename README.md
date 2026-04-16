# 🍽️ FitBite — Smart Calorie Tracker

> A modern, aesthetic calorie tracking web app built with React that helps users monitor their daily nutrition with a beautiful UI and smart features.

![FitBite Banner](https://img.shields.io/badge/FitBite-Smart%20Calorie%20Tracker-10b981?style=for-the-badge&logo=react)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?style=flat-square&logo=tailwindcss)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-✓-ff69b4?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)

---

## ✨ Features

- 🔥 **Add, Edit, Delete** food items with full macro details
- ⚡ **Auto-fill nutrition** using the USDA FoodData Central API
- 🎯 **Daily calorie goal** tracking with animated progress ring
- 📊 **Animated calorie ring** with smooth SVG stroke animation
- 🧊 **Smart Plate UI** — visual macro distribution via conic-gradient
- 🔥 **Streak system** — gamification to keep you on track daily
- 🌙 **Dark / Light mode** toggle with smooth transitions
- 💾 **Persistent data** stored in localStorage
- 🎨 **3D animated background** with Three.js orbs and CSS blobs
- 📦 **Quantity control** — `+` / `−` per food item
- 🍞 **Toast notifications** on add, edit, delete

---

## 🧠 Auto Nutrition Feature

Simply enter a food name and click **"Auto Fill"** to automatically fetch:

| Nutrient | Source |
|----------|--------|
| 🔥 Calories | USDA FoodData Central |
| 💪 Protein | USDA FoodData Central |
| 🌾 Carbohydrates | USDA FoodData Central |
| 🥑 Fat | USDA FoodData Central |

Powered by the **[USDA FoodData Central API](https://fdc.nal.usda.gov/)**

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| ⚛️ React 19 (Vite) | Frontend framework |
| 🎨 Tailwind CSS 3.4 | Utility-first styling |
| 🎬 Framer Motion | Animations & transitions |
| 🌐 Three.js + R3F | 3D animated background |
| 🗄️ localStorage | Data persistence |
| 🍎 USDA FoodData API | Nutrition auto-fill |

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Devabhishek085/FitBite.git

# Navigate into the project
cd FitBite

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Environment Variables

Create a `.env` file in the root of the project:

```env
VITE_USDA_API_KEY=your_api_key_here
```

> Get your free API key at: [https://fdc.nal.usda.gov/api-key-signup.html](https://fdc.nal.usda.gov/api-key-signup.html)

---

## 📸 Screenshots

| Dark Mode | Light Mode |
|-----------|------------|
| *(Add screenshot here)* | *(Add screenshot here)* |

---

## 📂 Project Structure

```
FitBite/
├── public/
├── src/
│   ├── App.jsx           # Main app component
│   ├── Background3D.jsx  # Three.js animated background
│   ├── index.css         # Global styles + Tailwind
│   └── main.jsx          # Entry point
├── .env                  # Environment variables (not committed)
├── .gitignore
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🚀 Future Improvements

- 📱 Mobile app version (React Native)
- 🤖 AI-powered meal suggestions
- 📸 Food image recognition
- 🥗 Personalized diet plans
- 📈 Weekly nutrition charts & analytics
- 🔔 Daily reminder notifications

---

## ⚠️ Note

- API keys are used for development/demo purposes only
- Add a backend layer (Node.js/Express) for production-level security
- Never commit your `.env` file to version control

---

## 👨‍💻 Author

**Abhishek Pal**

[![GitHub](https://img.shields.io/badge/GitHub-Devabhishek085-181717?style=flat-square&logo=github)](https://github.com/Devabhishek085)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## ⭐ Show Your Support

If you like this project, please give it a ⭐ on GitHub — it really helps!

[![Star on GitHub](https://img.shields.io/github/stars/Devabhishek085/FitBite?style=social)](https://github.com/Devabhishek085/FitBite)
