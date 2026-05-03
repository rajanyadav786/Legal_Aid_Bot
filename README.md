<div align="center">
  <h1>⚖️ Legal Aid Bot</h1>
  <p><i>Democratizing legal knowledge for everyone</i></p>

  <img src="https://img.shields.io/badge/Status-In%20Development-blue?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</div>

<br />

<div align="center">
  <!-- TODO: Replace with an actual hero screenshot or logo -->
  <img src="./preview/RES.png" alt="Legal Aid Bot Interface Screenshot" />
</div>

<br />

## 📖 Overview

**Legal Aid Bot** is a full-stack, AI-powered application designed to democratize legal knowledge. It simplifies complex legal information for underprivileged communities, providing accessible, accurate, and easy-to-understand legal assistance. The bot strictly adheres to Indian legal codes and the Constitution, ensuring reliable and localized guidance.

Featuring voice-input capabilities and high-quality realistic text-to-speech, the application is built with accessibility and a premium user experience in mind.

## ✨ Features

- 🎙️ **Voice Interaction:** Seamlessly ask legal questions using voice input.
- 🔊 **Realistic Text-to-Speech:** High-quality voice responses using ElevenLabs integration.
- 🧠 **Advanced AI Models:** Powered by state-of-the-art LLMs (Gemini, OpenRouter) to decode complex legal jargon.
- 🇮🇳 **Localized Legal Knowledge:** Focused on Indian legal codes and the Constitution.
- 🎨 **Premium Aesthetic:** A highly accessible, responsive, and visually appealing user interface.

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)

### Backend
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)

### AI & Integrations
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google%20gemini&logoColor=white)
![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?style=for-the-badge&logo=elevenlabs&logoColor=white)
![OpenRouter](https://img.shields.io/badge/OpenRouter-1A1A1A?style=for-the-badge)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- Node.js (v18+)
- Python (v3.10+)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Legal_Aid_Bot.git
   cd Legal_Aid_Bot
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. **Setup the Environment Variables:**
   Create a `.env` file in the `backend` directory and add your API keys:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ```

4. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the FastAPI Backend:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start the React Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## 📸 Screenshots

<div align="center">
  <!-- TODO: Replace with actual screenshots of your application -->
  <img src="./preview/home.png" alt="Home Screen" width="48%" />
  <img src="./preview/model.png" alt="model" width="48%" />
</div>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
