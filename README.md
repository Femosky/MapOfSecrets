# MapOfSecrets

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-00C7B7)](https://map-of-secrets.vercel.app) [![Backend Repository](https://img.shields.io/badge/Backend-AWS_EC2-FF9900)](https://github.com/Femosky/MapOfSecrets_Backend)

A full-stack web app that’s a space to get your deepest, darkest secrets off your chest—anonymously, of course.

---

## 🚀 Live Demo

1. **Frontend:** [map-of-secrets.vercel.app](https://map-of-secrets.vercel.app)
2. **Backend:** _See the linked repo above_ or [Click here](https://github.com/Femosky/MapOfSecrets_Backend)

---

## ✨ Features

- **Anonymous Secret Posting**  
  Pin your secret anywhere on the map without ever creating an account.  
- **Interactive Map View**  
  Browse secrets worldwide using a smooth Google Maps integration.  
- **Marker Clustering**  
  Groups nearby pins for better performance and readability.  
- **Responsive Design**  
  Looks great on desktop, tablet, and mobile.  
- **RESTful API**  
  Full create/read operations for secrets via a clean Express.js backend.  
- **Custom Markers & Animations**  
  Unique HTML markers animated with Framer Motion.  
- **Easy Deployment**  
  Frontend hosted on Vercel; backend on AWS EC2.

---

## 🛠 Tech Stack

### Frontend  
- **React** + **TypeScript** + **Vite**
- Google Maps API
- Tailwind CSS  
- Framer Motion

### Backend  
- **Node.js** + **Express.js**  
- **Prisma** ORM  
- **PostgreSQL** on AWS RDS  
- Deployed to **AWS EC2**

---

## 📥 Quick Start

1. **Clone this repo**  
   ```bash
   git clone https://github.com/Femosky/MapOfSecrets.git
   cd MapOfSecrets

2. **Install NPM and all required dependencies**  
   ```bash
   npm install

3. **Configure environment variables**
   - You need to get a google maps api key from [here](https://mapsplatform.google.com) first.
   - Create and use it in a `.env` file in the project root with:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

5. **Run in development mode**
   ```bash
   npm run dev

6. **Build for production**
   ```bash
   npm build run

## 📂 Project Structure

| Name                   | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| **public/**            | Static assets (favicon)                                 |
| **src/**               | Source code files                                       |
| **src/components**     | React UI components (Map, etc.)                         |
| **src/contexts**       | React context providers                                 |
| **src/hooks**          | Custom React hooks (useMap, useNotes, etc.)             |
| **src/models**         | Map Typescript Interfaces                               |
| **src/utils**          | Utility functions (API calls, formatting)               |
| **src/App.tsx/**       | Root React component                                    |
| **src/main.tsx**       | React entry point                                       |
| **package.json/**      | Dependencies & npm scripts                              |
| **tsconfig.json/**     | TypeScript configuration                                |
| **vite.config.json/**  | Vite build settings                                     |
| **.env/**              | Environment variable definitions                        |

## 📄 License

Distributed under the MIT License. See LICENSE for more details.

## ✉️ Contact

[Contact me here](https://femiojeyemi.com/contact)
