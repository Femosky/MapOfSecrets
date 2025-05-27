# MapOfSecrets

[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-00C7B7)](https://map-of-secrets.vercel.app)  
[![Backend](https://img.shields.io/badge/Backend-AWS_EC2-FF9900)](LINK_TO_BACKEND_REPO)

A full-stack web app that’s a space to get your deepest, darkest secrets off your chest—anonymously, of course. :contentReference[oaicite:0]{index=0}

---

## 🚀 Live Demo

**Frontend:** [map-of-secrets.vercel.app](https://map-of-secrets.vercel.app) :contentReference[oaicite:1]{index=1}  
**Backend:** _See the linked repo above_

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
- **React** + **TypeScript** + **Vite** :contentReference[oaicite:2]{index=2}  
- @react-google-maps/api  
- @googlemaps/markerclusterer  
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
